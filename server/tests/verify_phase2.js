require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const { AssetStatus, ConditionRating, UserRole } = require('../src/constants/enums');
const { User, Department, Asset, LifecycleEvent, AuditLog } = require('../src/models');
const { getConditionRating, evaluateConditionStatus } = require('../src/services/conditionService');
const { verifyChain } = require('../src/services/auditService');

const runPhase2Tests = async () => {
  console.log('\n=============================================================');
  console.log('  IAMS BACKEND PHASE 2 — ASSET REGISTRY & LIFECYCLE TESTS');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? '-> ' + details : ''}`);
      failed++;
    }
  };

  const makeRequest = (server, method, path, headers = {}, body = null) => {
    return new Promise((resolve, reject) => {
      const addr = server.address();
      const options = {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              body: data ? JSON.parse(data) : null
            });
          } catch (e) {
            resolve({ statusCode: res.statusCode, rawBody: data });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  await connectDB();
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`[TestServer] Ephemeral server running on port ${port}\n`);

  try {
    // -------------------------------------------------------------
    // Helper: Obtain authentication tokens for test personas
    // -------------------------------------------------------------
    const loginPersona = async (email, password = 'Password@123') => {
      const res = await makeRequest(testServer, 'POST', '/api/v1/auth/login', {}, { email, password });
      return res.body?.data?.token;
    };

    const adminToken = await loginPersona('admin@amc.gov.in');
    const directorPwdToken = await loginPersona('director.pwd@amc.gov.in');
    const managerPwdToken = await loginPersona('manager.pwd@amc.gov.in');
    const inspectorPwdToken = await loginPersona('inspector.pwd@amc.gov.in');
    const contractorToken = await loginPersona('contractor.infra@amc.gov.in');
    const auditorToken = await loginPersona('auditor.gujarat@amc.gov.in');

    const pwdDept = await Department.findOne({ code: 'AMC-PWD' });
    const healthDept = await Department.findOne({ code: 'AMC-HEALTH' });

    // -------------------------------------------------------------
    // 1. Condition Scoring Unit Tests
    // -------------------------------------------------------------
    console.log('--- 1. CONDITION SCORING SERVICE ---');
    assert(getConditionRating(95) === 'EXCELLENT', 'Score 95 maps to EXCELLENT');
    assert(getConditionRating(90) === 'EXCELLENT', 'Score 90 maps to EXCELLENT');
    assert(getConditionRating(85) === 'GOOD', 'Score 85 maps to GOOD');
    assert(getConditionRating(75) === 'GOOD', 'Score 75 maps to GOOD');
    assert(getConditionRating(70) === 'FAIR', 'Score 70 maps to FAIR');
    assert(getConditionRating(60) === 'FAIR', 'Score 60 maps to FAIR');
    assert(getConditionRating(50) === 'POOR', 'Score 50 maps to POOR');
    assert(getConditionRating(40) === 'POOR', 'Score 40 maps to POOR');
    assert(getConditionRating(35) === 'CRITICAL', 'Score 35 maps to CRITICAL');
    assert(getConditionRating(0) === 'CRITICAL', 'Score 0 maps to CRITICAL');

    // -------------------------------------------------------------
    // 2. Asset Creation & Validation (POST /api/v1/assets)
    // -------------------------------------------------------------
    console.log('\n--- 2. ASSET CREATION & QR FOUNDATION ---');
    const testTag = `AMC-TEST-BRG-${Date.now()}`;
    const createRes = await makeRequest(testServer, 'POST', '/api/v1/assets', {
      Authorization: `Bearer ${adminToken}`
    }, {
      assetTag: testTag,
      name: 'Naranpura Railway Overbridge Extension',
      category: 'BRIDGE',
      subType: 'Composite Steel Girder',
      departmentId: pwdDept._id.toString(),
      criticality: 'HIGH',
      location: {
        type: 'Point',
        coordinates: [72.5514, 23.0525],
        address: 'Naranpura Cross Road',
        ward: 'Naranpura Ward',
        zone: 'WEST'
      },
      physicalAttributes: {
        yearConstructed: 2024,
        dimensions: { lengthMeters: 380, lanes: 4 }
      },
      financials: {
        procurementCost: 75000000,
        installationCost: 12000000,
        usefulLifeYears: 50
      },
      condition: {
        score: 100
      }
    });

    assert(createRes.statusCode === 201, 'POST /api/v1/assets creates new asset with HTTP 201');
    assert(createRes.body.data.status === 'PLANNING', 'Newly created asset defaults to status: "PLANNING"');
    assert(createRes.body.data.isAbandoned === false, 'Newly created asset defaults to isAbandoned: false');
    assert(createRes.body.data.qrCode.identifier.startsWith('IAMS-'), 'QR identifier generated with IAMS- prefix');
    assert(createRes.body.data.qrCode.status === 'PENDING_ACTIVATION', 'QR code status is PENDING_ACTIVATION');
    const createdAssetId = createRes.body.data._id;

    // Test duplicate assetTag rejected
    const dupRes = await makeRequest(testServer, 'POST', '/api/v1/assets', {
      Authorization: `Bearer ${adminToken}`
    }, {
      assetTag: testTag,
      name: 'Duplicate Bridge Attempt',
      category: 'BRIDGE',
      departmentId: pwdDept._id.toString(),
      location: { type: 'Point', coordinates: [72.55, 23.05] }
    });
    assert(dupRes.statusCode === 409, 'Duplicate assetTag rejected with HTTP 409 DUPLICATE_ASSET_TAG');

    // Test negative financial value rejected with HTTP 422
    const negFinRes = await makeRequest(testServer, 'POST', '/api/v1/assets', {
      Authorization: `Bearer ${adminToken}`
    }, {
      assetTag: `AMC-NEG-${Date.now()}`,
      name: 'Negative Cost Asset',
      category: 'ROAD',
      departmentId: pwdDept._id.toString(),
      location: { type: 'Point', coordinates: [72.55, 23.05] },
      financials: { procurementCost: -500000 }
    });
    assert(negFinRes.statusCode === 422, 'Negative financial value rejected with HTTP 422 NEGATIVE_FINANCIAL_VALUE');

    // Test invalid GeoJSON coordinates rejected with HTTP 400
    const badGeoRes = await makeRequest(testServer, 'POST', '/api/v1/assets', {
      Authorization: `Bearer ${adminToken}`
    }, {
      assetTag: `AMC-GEO-${Date.now()}`,
      name: 'Bad Coordinates Asset',
      category: 'ROAD',
      departmentId: pwdDept._id.toString(),
      location: { type: 'Point', coordinates: [250, 95] } // Out of bounds
    });
    assert(badGeoRes.statusCode === 400, 'Invalid GeoJSON coordinates rejected with HTTP 400');

    // -------------------------------------------------------------
    // 3. Asset Query & Pagination (GET /api/v1/assets)
    // -------------------------------------------------------------
    console.log('\n--- 3. ASSET LISTING, SEARCH & PAGINATION ---');
    const listRes = await makeRequest(testServer, 'GET', '/api/v1/assets?page=1&limit=5', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(listRes.statusCode === 200, 'GET /api/v1/assets returns HTTP 200');
    assert(listRes.body.data.items.length === 5, 'Pagination limit=5 enforced (returned 5 items)');
    assert(listRes.body.data.pagination.total >= 24, `Pagination total >= 24 (found: ${listRes.body.data.pagination.total})`);

    // Search query test
    const searchRes = await makeRequest(testServer, 'GET', '/api/v1/assets?search=Subhash', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(searchRes.statusCode === 200, 'Search query GET /api/v1/assets?search=Subhash succeeds');
    assert(
      searchRes.body.data.items.some((item) => item.name.includes('Subhash')),
      'Search results contain Subhash Bridge asset'
    );

    // -------------------------------------------------------------
    // 4. Asset Detail & Passport (GET /api/v1/assets/:id)
    // -------------------------------------------------------------
    console.log('\n--- 4. ASSET DETAIL & PASSPORT ---');
    const detailRes = await makeRequest(testServer, 'GET', `/api/v1/assets/${createdAssetId}`, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(detailRes.statusCode === 200, 'GET /api/v1/assets/:id returns HTTP 200');
    assert(detailRes.body.data.assetTag === testTag, 'Asset passport returns matching assetTag');
    assert(Array.isArray(detailRes.body.data.lifecycleHistory), 'Asset passport includes lifecycleHistory array');

    // -------------------------------------------------------------
    // 5. Asset Update & Direct Status Block (PATCH /api/v1/assets/:id)
    // -------------------------------------------------------------
    console.log('\n--- 5. ASSET METADATA UPDATE & STATUS GUARDS ---');
    const updateRes = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      name: 'Naranpura Rail Overbridge Main Flyover (Updated)',
      criticality: 'CRITICAL_INFRASTRUCTURE'
    });
    assert(updateRes.statusCode === 200, 'PATCH /api/v1/assets/:id updates metadata with HTTP 200');
    assert(updateRes.body.data.criticality === 'CRITICAL_INFRASTRUCTURE', 'Metadata update applied');

    // Direct status update attempt must be rejected with HTTP 400
    const directStatusRes = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      status: 'OPERATIONAL' // Forbidden direct modification
    });
    assert(
      directStatusRes.statusCode === 400,
      'Direct status modification on PATCH /assets/:id blocked with HTTP 400 DIRECT_STATUS_UPDATE_BLOCKED'
    );

    // -------------------------------------------------------------
    // 6. Departmental Scoping Enforcement
    // -------------------------------------------------------------
    console.log('\n--- 6. DEPARTMENTAL ACCESS SCOPING ---');

    // Director of PWD lists assets -> should only see PWD assets
    const directorListRes = await makeRequest(testServer, 'GET', '/api/v1/assets', {
      Authorization: `Bearer ${directorPwdToken}`
    });
    assert(directorListRes.statusCode === 200, 'Director of PWD can query assets');
    const allPwd = directorListRes.body.data.items.every(
      (item) => item.departmentId._id.toString() === pwdDept._id.toString() || item.departmentId.code === 'AMC-PWD'
    );
    assert(allPwd, 'Director view is strictly scoped to own department (AMC-PWD)');

    // Director trying to bypass scope by passing departmentId=AMC-HEALTH
    const bypassAttemptRes = await makeRequest(testServer, 'GET', `/api/v1/assets?departmentId=${healthDept._id}`, {
      Authorization: `Bearer ${directorPwdToken}`
    });
    const stillScoped = bypassAttemptRes.body.data.items.every(
      (item) => item.departmentId._id.toString() === pwdDept._id.toString() || item.departmentId.code === 'AMC-PWD'
    );
    assert(stillScoped, 'Director cannot bypass department scope by passing foreign departmentId in query');

    // Contractor attempting to access asset passport without work order (prohibited in Phase 2)
    const contractorAssetRes = await makeRequest(testServer, 'GET', `/api/v1/assets/${createdAssetId}`, {
      Authorization: `Bearer ${contractorToken}`
    });
    assert(contractorAssetRes.statusCode === 403, 'Contractor is denied general asset passport access (HTTP 403)');

    // -------------------------------------------------------------
    // 7. Canonical Asset Lifecycle Transitions
    // -------------------------------------------------------------
    console.log('\n--- 7. CANONICAL LIFECYCLE TRANSITIONS ---');

    // 1. Valid: PLANNING -> PROCUREMENT
    const trans1 = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      toState: 'PROCUREMENT',
      reason: 'Tender floated under AMC capital works scheme'
    });
    assert(trans1.statusCode === 200, 'PLANNING -> PROCUREMENT succeeds with HTTP 200');
    assert(trans1.body.data.asset.status === 'PROCUREMENT', 'Asset status is now PROCUREMENT');

    // 2. Valid: PROCUREMENT -> INSTALLATION
    const trans2 = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      toState: 'INSTALLATION',
      reason: 'Purchase order awarded and site excavation commenced'
    });
    assert(trans2.statusCode === 200, 'PROCUREMENT -> INSTALLATION succeeds with HTTP 200');

    // 3. Valid: INSTALLATION -> COMMISSIONING
    const trans3 = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      toState: 'COMMISSIONING',
      reason: 'Structural span placement complete; load testing initiated'
    });
    assert(trans3.statusCode === 200, 'INSTALLATION -> COMMISSIONING succeeds with HTTP 200');

    // 4. Valid: COMMISSIONING -> OPERATIONAL
    const trans4 = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      toState: 'OPERATIONAL',
      reason: 'Final safety clearance certified; opened for vehicular traffic'
    });
    assert(trans4.statusCode === 200, 'COMMISSIONING -> OPERATIONAL succeeds with HTTP 200');
    assert(trans4.body.data.asset.status === 'OPERATIONAL', 'Asset status is now OPERATIONAL');

    // 5. Valid: OPERATIONAL -> UNDER_INSPECTION (Inspector authorized)
    const trans5 = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${inspectorPwdToken}`
    }, {
      toState: 'UNDER_INSPECTION',
      reason: 'Pre-monsoon bridge structural audit initiated'
    });
    assert(trans5.statusCode === 200, 'OPERATIONAL -> UNDER_INSPECTION by Inspector succeeds with HTTP 200');

    // 6. Valid: UNDER_INSPECTION -> NEEDS_REPAIR
    const trans6 = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${managerPwdToken}`
    }, {
      toState: 'NEEDS_REPAIR',
      reason: 'Minor spalling and expansion joint gap displacement detected'
    });
    assert(trans6.statusCode === 200, 'UNDER_INSPECTION -> NEEDS_REPAIR succeeds with HTTP 200');

    // 7. Invalid transition rejected: NEEDS_REPAIR -> DISPOSED (Must fail with HTTP 409)
    const invalidTrans1 = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      toState: 'DISPOSED',
      reason: 'Illegal skip attempt'
    });
    assert(invalidTrans1.statusCode === 409, 'Illegal transition NEEDS_REPAIR -> DISPOSED rejected with HTTP 409 Conflict');

    // 8. Missing reason rejected with HTTP 400
    const noReasonTrans = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      toState: 'UNDER_MAINTENANCE'
      // missing reason
    });
    assert(noReasonTrans.statusCode === 400, 'Transition with missing reason rejected with HTTP 400');

    // 9. Contractor attempting lifecycle transition must be rejected with HTTP 403
    const contractorTrans = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${contractorToken}`
    }, {
      toState: 'UNDER_MAINTENANCE',
      reason: 'Contractor trying to self-transition'
    });
    assert(contractorTrans.statusCode === 403, 'Contractor direct lifecycle transition blocked with HTTP 403');

    // 10. Auditor attempting lifecycle transition must be rejected with HTTP 403
    const auditorTrans = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${auditorToken}`
    }, {
      toState: 'UNDER_MAINTENANCE',
      reason: 'Auditor trying to transition'
    });
    assert(auditorTrans.statusCode === 403, 'Auditor lifecycle transition blocked with HTTP 403');

    // 11. Move to Terminal DISPOSED state and verify DISPOSED -> OPERATIONAL fails
    await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, { toState: 'OUT_OF_SERVICE', reason: 'Emergency lockout' });

    await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, { toState: 'DECOMMISSIONED', reason: 'Condemned by committee' });

    await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, { toState: 'DISPOSED', reason: 'Dismantled and sold as scrap' });

    const terminalTrans = await makeRequest(testServer, 'PATCH', `/api/v1/assets/${createdAssetId}/lifecycle`, {
      Authorization: `Bearer ${adminToken}`
    }, {
      toState: 'OPERATIONAL',
      reason: 'Attempting to revive disposed asset'
    });
    assert(terminalTrans.statusCode === 409, 'Transition out of terminal DISPOSED state rejected with HTTP 409');

    // -------------------------------------------------------------
    // 8. LifecycleEvent & Audit Verification for Transitions
    // -------------------------------------------------------------
    console.log('\n--- 8. LIFECYCLE EVENT & AUDIT INTEGRITY ---');
    const events = await LifecycleEvent.find({ assetId: createdAssetId }).sort({ timestamp: 1 });
    assert(events.length >= 6, `Lifecycle events recorded sequentially (found: ${events.length} events)`);

    const auditCheck = await verifyChain();
    assert(auditCheck.isValid === true, 'Tamper-evident SHA-256 audit chain verified intact after all transitions');

    // -------------------------------------------------------------
    // 9. Asset Summary & Dashboard Aggregation
    // -------------------------------------------------------------
    console.log('\n--- 9. ASSET SUMMARY & DASHBOARD AGGREGATION ---');
    const summaryRes = await makeRequest(testServer, 'GET', '/api/v1/assets/summary', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(summaryRes.statusCode === 200, 'GET /api/v1/assets/summary returns HTTP 200');
    assert(summaryRes.body.data.totalAssets >= 24, `Summary totalAssets >= 24 (found: ${summaryRes.body.data.totalAssets})`);
    assert(summaryRes.body.data.operationalAssets >= 10, 'Summary includes operationalAssets count');
    assert(summaryRes.body.data.criticalAssets >= 3, 'Summary includes criticalAssets count');
    assert(typeof summaryRes.body.data.conditionDistribution === 'object', 'Summary includes conditionDistribution object');
    assert(typeof summaryRes.body.data.statusDistribution === 'object', 'Summary includes statusDistribution object');

    // -------------------------------------------------------------
    // 10. Soft Delete / Archive Behavior (DELETE /api/v1/assets/:id)
    // -------------------------------------------------------------
    console.log('\n--- 10. SOFT DELETE ARCHIVING ---');
    const deleteRes = await makeRequest(testServer, 'DELETE', `/api/v1/assets/${createdAssetId}`, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(deleteRes.statusCode === 200, 'DELETE /api/v1/assets/:id archives asset with HTTP 200');
    assert(deleteRes.body.data.isAbandoned === true, 'Response confirms isAbandoned: true');

    const archivedAssetInDb = await Asset.findById(createdAssetId);
    assert(archivedAssetInDb.isAbandoned === true, 'Asset remains in DB with isAbandoned: true (not physically deleted)');

    // Archived asset should not appear in default listing
    const defaultList = await makeRequest(testServer, 'GET', '/api/v1/assets', {
      Authorization: `Bearer ${adminToken}`
    });
    const foundArchived = defaultList.body.data.items.some((item) => item._id === createdAssetId);
    assert(!foundArchived, 'Archived asset excluded from active asset directory by default');

    console.log('\n=============================================================');
    console.log(`  PHASE 2 TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('[Phase2 TestSuite Error]', error);
    process.exit(1);
  } finally {
    testServer.close();
    await disconnectDB();
  }
};

runPhase2Tests();
