require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB, getDBStatus } = require('../src/config/db');
const {
  AssetStatus,
  ConditionRating,
  UserRole,
  WorkOrderStatus,
  QrStatus
} = require('../src/constants/enums');
const {
  User,
  Department,
  Asset,
  LifecycleEvent,
  Inspection,
  WorkOrder,
  AuditLog,
  AIInsight
} = require('../src/models');
const { verifyChain, recordEvent } = require('../src/services/auditService');

// Simple lightweight test runner for Phase 1 verification
const runTests = async () => {
  console.log('\n=============================================================');
  console.log('  IAMS BACKEND PHASE 1 — ACCEPTANCE VERIFICATION TEST SUITE');
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

  // Helper to make local HTTP requests to the Express app
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

  // Connect to DB and start temporary HTTP server
  await connectDB();
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`[TestServer] Ephemeral server running on port ${port}\n`);

  try {
    // -------------------------------------------------------------
    // 1. Database & Schema Invariants
    // -------------------------------------------------------------
    console.log('--- 1. DATABASE & SCHEMA INVARIANTS ---');

    const dbStatus = getDBStatus();
    assert(dbStatus.isConnected === true, 'MongoDB is connected and readyState is active');

    const registeredModels = Object.keys(mongoose.models);
    assert(
      registeredModels.length === 8,
      `Exactly 8 Mongoose models registered (found: ${registeredModels.length}: [${registeredModels.join(', ')}])`
    );

    assert(
      !registeredModels.includes('Document') && !registeredModels.includes('documents'),
      'No standalone "documents" collection exists in Mongoose models'
    );

    assert(
      AssetStatus.length === 11,
      `AssetStatus enum contains exactly 11 states (found: ${AssetStatus.length})`
    );

    assert(
      !AssetStatus.includes('CANCELLED'),
      'AssetStatus does NOT contain "CANCELLED"'
    );

    assert(
      !AssetStatus.includes('OPERATION'),
      'AssetStatus does NOT contain "OPERATION"'
    );

    assert(
      AssetStatus.includes('OPERATIONAL'),
      'AssetStatus contains canonical "OPERATIONAL"'
    );

    assert(
      ConditionRating.length === 5,
      `ConditionRating enum contains exactly 5 rating bands: [${ConditionRating.join(', ')}]`
    );

    assert(
      QrStatus.includes('PENDING_ACTIVATION') && QrStatus.includes('ACTIVE') && QrStatus.includes('REVOKED'),
      'QrStatus contains PENDING_ACTIVATION, ACTIVE, and REVOKED'
    );

    // Schema inspection checks
    const inspectionPaths = Object.keys(Inspection.schema.paths);
    assert(
      inspectionPaths.includes('reviewedById') &&
      inspectionPaths.includes('reviewedAt') &&
      inspectionPaths.includes('approved') &&
      inspectionPaths.includes('reviewNotes'),
      'Inspection model contains required review fields: reviewedById, reviewedAt, approved, reviewNotes'
    );

    const workOrderPaths = Object.keys(WorkOrder.schema.paths);
    assert(
      workOrderPaths.includes('preMaintenanceAssetStatus') &&
      workOrderPaths.includes('safetyClearanceVerified'),
      'WorkOrder model contains safety fields: preMaintenanceAssetStatus and safetyClearanceVerified'
    );

    // Test Schema-level enum validation rejects invalid states
    let schemaRejectionCaught = false;
    try {
      const invalidAsset = new Asset({
        assetTag: 'TEST-TAG-INVALID',
        name: 'Invalid Test Asset',
        category: 'ROAD',
        departmentId: new mongoose.Types.ObjectId(),
        status: 'CANCELLED', // Illegal enum value
        criticality: 'MEDIUM',
        location: { type: 'Point', coordinates: [72.5714, 23.0225] },
        qrCode: { identifier: 'QR-TEST-001' }
      });
      await invalidAsset.validate();
    } catch (err) {
      if (err.errors && err.errors.status) {
        schemaRejectionCaught = true;
      }
    }
    assert(
      schemaRejectionCaught,
      'Schema-level enum validation rejects invalid AssetStatus ("CANCELLED") with ValidationError'
    );

    // -------------------------------------------------------------
    // 2. Health Endpoint
    // -------------------------------------------------------------
    console.log('\n--- 2. HEALTH ENDPOINT ---');
    const healthRes = await makeRequest(testServer, 'GET', '/api/v1/health');
    assert(healthRes.statusCode === 200, 'GET /api/v1/health returns HTTP 200');
    assert(healthRes.body.data.status === 'healthy', 'Health check reports status: "healthy"');
    assert(healthRes.body.data.database.isConnected === true, 'Health check confirms database connection');

    // -------------------------------------------------------------
    // 3. Authentication & Login
    // -------------------------------------------------------------
    console.log('\n--- 3. AUTHENTICATION & SESSIONS ---');

    // Valid admin login
    const adminLoginRes = await makeRequest(testServer, 'POST', '/api/v1/auth/login', {}, {
      email: 'admin@amc.gov.in',
      password: 'Password@123'
    });
    assert(adminLoginRes.statusCode === 200, 'Valid admin credentials return HTTP 200');
    assert(adminLoginRes.body.data.token != null, 'Login returns JWT bearer token');
    assert(adminLoginRes.body.data.user.role === 'ADMIN', 'Login response includes role: "ADMIN"');
    assert(adminLoginRes.body.data.user.passwordHash === undefined, 'Login response redacts passwordHash');
    const adminToken = adminLoginRes.body.data.token;

    // Valid contractor login
    const contractorLoginRes = await makeRequest(testServer, 'POST', '/api/v1/auth/login', {}, {
      email: 'contractor.infra@amc.gov.in',
      password: 'Password@123'
    });
    assert(contractorLoginRes.statusCode === 200, 'Valid contractor credentials return HTTP 200');
    const contractorToken = contractorLoginRes.body.data.token;

    // Invalid password
    const badPasswordRes = await makeRequest(testServer, 'POST', '/api/v1/auth/login', {}, {
      email: 'admin@amc.gov.in',
      password: 'WrongPassword999'
    });
    assert(badPasswordRes.statusCode === 401, 'Invalid password returns HTTP 401');
    assert(badPasswordRes.body.error.code === 'INVALID_CREDENTIALS', 'Returns generic INVALID_CREDENTIALS error code');

    // Inactive account
    const inactiveRes = await makeRequest(testServer, 'POST', '/api/v1/auth/login', {}, {
      email: 'inactive.officer@amc.gov.in',
      password: 'Password@123'
    });
    assert(inactiveRes.statusCode === 403, 'Inactive account returns HTTP 403');
    assert(inactiveRes.body.error.code === 'ACCOUNT_DEACTIVATED', 'Returns ACCOUNT_DEACTIVATED error code');

    // Missing body fields
    const missingBodyRes = await makeRequest(testServer, 'POST', '/api/v1/auth/login', {}, {
      email: 'admin@amc.gov.in'
    });
    assert(missingBodyRes.statusCode === 400, 'Missing password returns HTTP 400 validation error');

    // -------------------------------------------------------------
    // 4. JWT Verification & Protected Endpoints
    // -------------------------------------------------------------
    console.log('\n--- 4. JWT VERIFICATION & TOKEN GUARDS ---');

    // Missing token
    const noTokenRes = await makeRequest(testServer, 'GET', '/api/v1/auth/me');
    assert(noTokenRes.statusCode === 401, 'GET /auth/me with missing token returns HTTP 401');

    // Invalid token
    const badTokenRes = await makeRequest(testServer, 'GET', '/api/v1/auth/me', {
      Authorization: 'Bearer invalid.tampered.token'
    });
    assert(badTokenRes.statusCode === 401, 'GET /auth/me with tampered token returns HTTP 401');

    // Valid token
    const meRes = await makeRequest(testServer, 'GET', '/api/v1/auth/me', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(meRes.statusCode === 200, 'GET /auth/me with valid Bearer token returns HTTP 200');
    assert(meRes.body.data.email === 'admin@amc.gov.in', 'GET /auth/me returns authenticated officer email');

    // -------------------------------------------------------------
    // 5. RBAC Middleware Evaluation
    // -------------------------------------------------------------
    console.log('\n--- 5. ROLE-BASED ACCESS CONTROL (RBAC) ---');

    // ADMIN accessing /api/v1/users (allowed)
    const adminUsersRes = await makeRequest(testServer, 'GET', '/api/v1/users', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminUsersRes.statusCode === 200, 'ADMIN role is authorized to access GET /api/v1/users (HTTP 200)');
    assert(Array.isArray(adminUsersRes.body.data), 'Returns array of registered municipal users');

    // CONTRACTOR accessing /api/v1/users (prohibited: requires ADMIN or DIRECTOR)
    const contractorUsersRes = await makeRequest(testServer, 'GET', '/api/v1/users', {
      Authorization: `Bearer ${contractorToken}`
    });
    assert(contractorUsersRes.statusCode === 403, 'CONTRACTOR role is denied access to GET /api/v1/users (HTTP 403)');
    assert(contractorUsersRes.body.error.code === 'FORBIDDEN', 'Returns standard FORBIDDEN error code');

    // -------------------------------------------------------------
    // 6. Departments Endpoint
    // -------------------------------------------------------------
    console.log('\n--- 6. DEPARTMENTS & MUNICIPAL DATA ---');
    const deptsRes = await makeRequest(testServer, 'GET', '/api/v1/departments', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(deptsRes.statusCode === 200, 'GET /api/v1/departments returns HTTP 200');
    assert(deptsRes.body.data.length === 6, `Returns all 6 Ahmedabad departments (found: ${deptsRes.body.data.length})`);
    const deptCodes = deptsRes.body.data.map((d) => d.code);
    assert(
      deptCodes.includes('AMC-PWD') &&
      deptCodes.includes('AMC-HEALTH') &&
      deptCodes.includes('AMC-EDU') &&
      deptCodes.includes('AMC-WATER') &&
      deptCodes.includes('AMC-SMARTCITY') &&
      deptCodes.includes('AMC-TRANS'),
      'All 6 canonical AMC department codes verified (AMC-PWD, AMC-HEALTH, AMC-EDU, AMC-WATER, AMC-SMARTCITY, AMC-TRANS)'
    );

    // -------------------------------------------------------------
    // 7. Tamper-Evident Audit Ledger
    // -------------------------------------------------------------
    console.log('\n--- 7. TAMPER-EVIDENT AUDIT INFRASTRUCTURE ---');
    const auditRes = await makeRequest(testServer, 'GET', '/api/v1/audit', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(auditRes.statusCode === 200, 'GET /api/v1/audit returns HTTP 200 for ADMIN');
    assert(auditRes.body.data.length >= 1, `Audit records captured (found: ${auditRes.body.data.length} records)`);

    const verifyAuditRes = await makeRequest(testServer, 'GET', '/api/v1/audit/verify', {
      Authorization: `Bearer ${adminToken}`
    });
    assert(verifyAuditRes.statusCode === 200, 'GET /api/v1/audit/verify returns HTTP 200');
    assert(verifyAuditRes.body.data.isValid === true, 'Audit SHA-256 hash chain verified intact (isValid: true)');

    // CONTRACTOR accessing /api/v1/audit (prohibited)
    const contractorAuditRes = await makeRequest(testServer, 'GET', '/api/v1/audit', {
      Authorization: `Bearer ${contractorToken}`
    });
    assert(contractorAuditRes.statusCode === 403, 'CONTRACTOR is denied access to audit logs (HTTP 403)');

    console.log('\n=============================================================');
    console.log(`  VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('[TestSuite Error]', error);
    process.exit(1);
  } finally {
    testServer.close();
    await disconnectDB();
  }
};

runTests();
