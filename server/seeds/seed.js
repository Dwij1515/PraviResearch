require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Asset = require('../src/models/Asset');
const LifecycleEvent = require('../src/models/LifecycleEvent');
const { recordEvent, GENESIS_HASH } = require('../src/services/auditService');
const { getConditionRating } = require('../src/services/conditionService');

const generateQrIdentifier = (tag) => `IAMS-${tag.replace(/[^A-Z0-9]/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const seedDatabase = async () => {
  console.log('[Seed] Starting complete database seeding for IAMS (Ahmedabad Municipal Corporation)...');

  await connectDB();

  try {
    // 1. Clear existing demo data for clean, idempotent re-runs
    console.log('[Seed] Clearing existing collections (users, departments, assets, lifecycle_events)...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Asset.deleteMany({});
    await LifecycleEvent.deleteMany({});

    // 2. Define the 6 Canonical Ahmedabad Municipal Departments
    const departmentsData = [
      {
        name: 'Public Works Department (Road & Building)',
        code: 'AMC-PWD',
        zone: 'CENTRAL',
        annualBudgetInr: 150000000, // ₹15.00 Crore
        allocatedSpendInr: 42500000
      },
      {
        name: 'Health & Family Welfare Department',
        code: 'AMC-HEALTH',
        zone: 'WEST',
        annualBudgetInr: 120000000, // ₹12.00 Crore
        allocatedSpendInr: 31000000
      },
      {
        name: 'Municipal School Board (Education Department)',
        code: 'AMC-EDU',
        zone: 'SOUTH',
        annualBudgetInr: 85000000, // ₹8.50 Crore
        allocatedSpendInr: 22000000
      },
      {
        name: 'Water Supply & Sewerage Department',
        code: 'AMC-WATER',
        zone: 'NORTH',
        annualBudgetInr: 140000000, // ₹14.00 Crore
        allocatedSpendInr: 51200000
      },
      {
        name: 'Urban Development & Smart City Mission',
        code: 'AMC-SMARTCITY',
        zone: 'WEST',
        annualBudgetInr: 95000000, // ₹9.50 Crore
        allocatedSpendInr: 18500000
      },
      {
        name: 'Transport Department (AMTS / BRTS Janmarg)',
        code: 'AMC-TRANS',
        zone: 'CENTRAL',
        annualBudgetInr: 110000000, // ₹11.00 Crore
        allocatedSpendInr: 39000000
      }
    ];

    console.log('[Seed] Creating 6 AMC departments...');
    const createdDepartments = await Department.insertMany(departmentsData);
    const deptMap = {};
    createdDepartments.forEach((d) => {
      deptMap[d.code] = d._id;
    });

    console.log(`[Seed] Created ${createdDepartments.length} departments.`);

    // 3. Hash default password for all demo accounts
    const demoPassword = 'Password@123';
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(demoPassword, salt);

    // 4. Create Demo Users for each canonical role
    const usersData = [
      {
        name: 'Municipal Commissioner / System Admin',
        email: 'admin@amc.gov.in',
        passwordHash,
        role: 'ADMIN',
        departmentId: null, // Global access
        phone: '9825000001',
        isActive: true
      },
      {
        name: 'Shri Rajesh Patel (City Engineer - PWD)',
        email: 'director.pwd@amc.gov.in',
        passwordHash,
        role: 'DIRECTOR',
        departmentId: deptMap['AMC-PWD'],
        phone: '9825000002',
        isActive: true
      },
      {
        name: 'Smt. Ananya Desai (Executive Engineer)',
        email: 'manager.pwd@amc.gov.in',
        passwordHash,
        role: 'ASSET_MANAGER',
        departmentId: deptMap['AMC-PWD'],
        phone: '9825000003',
        isActive: true
      },
      {
        name: 'Shri Mehul Shah (Senior Civil Inspector)',
        email: 'inspector.pwd@amc.gov.in',
        passwordHash,
        role: 'INSPECTOR',
        departmentId: deptMap['AMC-PWD'],
        phone: '9825000004',
        isActive: true
      },
      {
        name: 'Gujarat Infra Projects Ltd (Crew Lead)',
        email: 'contractor.infra@amc.gov.in',
        passwordHash,
        role: 'CONTRACTOR',
        departmentId: deptMap['AMC-PWD'],
        phone: '9825000005',
        isActive: true
      },
      {
        name: 'Gujarat State Local Fund Auditor',
        email: 'auditor.gujarat@amc.gov.in',
        passwordHash,
        role: 'AUDITOR',
        departmentId: null, // Read-only global access
        phone: '9825000006',
        isActive: true
      },
      {
        name: 'Deactivated Officer (Testing Account)',
        email: 'inactive.officer@amc.gov.in',
        passwordHash,
        role: 'ASSET_MANAGER',
        departmentId: deptMap['AMC-PWD'],
        phone: '9825000007',
        isActive: false
      }
    ];

    console.log('[Seed] Creating demo users across all 6 roles...');
    const createdUsers = await User.insertMany(usersData);
    const userMap = {};
    createdUsers.forEach((u) => {
      userMap[u.role] = u._id;
      userMap[u.email] = u._id;
    });
    console.log(`[Seed] Created ${createdUsers.length} demo users.`);

    // 5. Update Department Head reference
    await Department.findByIdAndUpdate(deptMap['AMC-PWD'], { headUserId: userMap['director.pwd@amc.gov.in'] });

    // 6. Define 24 Diverse Ahmedabad Municipal Physical Infrastructure Assets
    const now = new Date();
    const pastDate = (daysAgo) => new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
    const futureDate = (daysAhead) => new Date(now.getTime() + daysAhead * 24 * 3600 * 1000);

    const assetsData = [
      // 1. Bridges
      {
        assetTag: 'AMC-PWD-BRG-001',
        name: 'Sardar Vallabhbhai Patel Flyover',
        category: 'BRIDGE',
        subType: 'Pre-stressed Concrete Flyover',
        departmentId: deptMap['AMC-PWD'],
        status: 'OPERATIONAL',
        criticality: 'CRITICAL_INFRASTRUCTURE',
        location: {
          type: 'Point',
          coordinates: [72.5186, 23.0374], // Bodakdev / SG Highway
          address: 'SG Highway Junction, Bodakdev',
          ward: 'Bodakdev Ward',
          zone: 'WEST',
          pincode: '380054'
        },
        physicalAttributes: {
          yearConstructed: 2018,
          dimensions: { lengthMeters: 850, widthMeters: 24, lanes: 6 },
          contractorName: 'L&T Heavy Civil Infra'
        },
        condition: {
          score: 92,
          rating: getConditionRating(92),
          lastInspectedAt: pastDate(45),
          nextInspectionDue: futureDate(135)
        },
        financials: {
          procurementCost: 480000000,
          installationCost: 35000000,
          maintenanceCost: 12000000,
          repairCost: 4500000,
          replacementCostEstimate: 550000000,
          usefulLifeYears: 60,
          totalLifecycleCost: 531500000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-BRG-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-PWD-BRG-002',
        name: 'Subhash Bridge Overpass',
        category: 'BRIDGE',
        subType: 'Reinforced Concrete Rail Overbridge',
        departmentId: deptMap['AMC-PWD'],
        status: 'NEEDS_REPAIR',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.5852, 23.0645], // Sabarmati
          address: 'Subhash Bridge Approach, Sabarmati',
          ward: 'Sabarmati Ward',
          zone: 'CENTRAL',
          pincode: '380027'
        },
        physicalAttributes: {
          yearConstructed: 1995,
          dimensions: { lengthMeters: 420, widthMeters: 18, lanes: 4 },
          contractorName: 'Western India Engineering Ltd'
        },
        condition: {
          score: 44, // POOR condition
          rating: getConditionRating(44),
          lastInspectedAt: pastDate(120),
          nextInspectionDue: pastDate(30) // Overdue inspection
        },
        financials: {
          procurementCost: 180000000,
          installationCost: 15000000,
          maintenanceCost: 32000000,
          repairCost: 18000000,
          replacementCostEstimate: 290000000,
          usefulLifeYears: 40,
          totalLifecycleCost: 245000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-BRG-002'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-PWD-BRG-003',
        name: 'Ellis Bridge Heritage Iron Structure',
        category: 'BRIDGE',
        subType: 'Centenary Steel Truss Bridge',
        departmentId: deptMap['AMC-PWD'],
        status: 'UNDER_INSPECTION',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.5714, 23.0225],
          address: 'Ashram Road at Sabarmati Riverfront',
          ward: 'Navrangpura Ward',
          zone: 'CENTRAL',
          pincode: '380009'
        },
        physicalAttributes: {
          yearConstructed: 1892,
          dimensions: { lengthMeters: 450, widthMeters: 12, spans: 7 },
          contractorName: 'Bombay PWD Historical'
        },
        condition: {
          score: 64,
          rating: getConditionRating(64),
          lastInspectedAt: pastDate(2),
          nextInspectionDue: futureDate(88)
        },
        financials: {
          procurementCost: 50000000,
          installationCost: 10000000,
          maintenanceCost: 45000000,
          repairCost: 22000000,
          replacementCostEstimate: 200000000,
          usefulLifeYears: 150,
          totalLifecycleCost: 127000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-BRG-003'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },

      // 2. Roads
      {
        assetTag: 'AMC-PWD-RD-001',
        name: 'Sindhu Bhavan Urban Commercial Corridor',
        category: 'ROAD',
        subType: '6-Lane Bituminous Concrete Arterial',
        departmentId: deptMap['AMC-PWD'],
        status: 'OPERATIONAL',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.5085, 23.0392],
          address: 'Sindhu Bhavan Marg, Thaltej',
          ward: 'Thaltej Ward',
          zone: 'WEST',
          pincode: '380059'
        },
        physicalAttributes: {
          yearConstructed: 2021,
          dimensions: { lengthKm: 4.8, carriagewayWidthMeters: 28 },
          contractorName: 'Patel Infrastructure Ltd'
        },
        condition: {
          score: 95,
          rating: getConditionRating(95),
          lastInspectedAt: pastDate(30),
          nextInspectionDue: futureDate(150)
        },
        financials: {
          procurementCost: 140000000,
          installationCost: 20000000,
          maintenanceCost: 8500000,
          repairCost: 1200000,
          replacementCostEstimate: 180000000,
          usefulLifeYears: 15,
          totalLifecycleCost: 169700000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-RD-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-PWD-RD-002',
        name: 'Naroda GIDC Heavy Vehicle Freight Road',
        category: 'ROAD',
        subType: 'Industrial Heavy Duty Rigid Pavement',
        departmentId: deptMap['AMC-PWD'],
        status: 'OUT_OF_SERVICE',
        criticality: 'CRITICAL_INFRASTRUCTURE',
        location: {
          type: 'Point',
          coordinates: [72.6582, 23.0721],
          address: 'Road No. 6, Naroda Industrial Zone',
          ward: 'Naroda Ward',
          zone: 'EAST',
          pincode: '382330'
        },
        physicalAttributes: {
          yearConstructed: 2008,
          dimensions: { lengthKm: 3.2, carriagewayWidthMeters: 14 },
          contractorName: 'Gujarat State Road Construction'
        },
        condition: {
          score: 24, // CRITICAL condition
          rating: getConditionRating(24),
          lastInspectedAt: pastDate(15),
          nextInspectionDue: pastDate(5)
        },
        financials: {
          procurementCost: 75000000,
          installationCost: 10000000,
          maintenanceCost: 28000000,
          repairCost: 19000000,
          replacementCostEstimate: 120000000,
          usefulLifeYears: 12,
          totalLifecycleCost: 132000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-RD-002'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-PWD-RD-003',
        name: 'Ashram Road Civic Arterial',
        category: 'ROAD',
        subType: 'Urban Transit Corridor',
        departmentId: deptMap['AMC-PWD'],
        status: 'OPERATIONAL',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.5731, 23.0418],
          address: 'Ashram Road, Usmanpura Section',
          ward: 'Usmanpura Ward',
          zone: 'CENTRAL',
          pincode: '380013'
        },
        physicalAttributes: {
          yearConstructed: 2019,
          dimensions: { lengthKm: 6.2, carriagewayWidthMeters: 24 },
          contractorName: 'Sadbhav Engineering Ltd'
        },
        condition: {
          score: 82,
          rating: getConditionRating(82),
          lastInspectedAt: pastDate(60),
          nextInspectionDue: futureDate(120)
        },
        financials: {
          procurementCost: 210000000,
          installationCost: 25000000,
          maintenanceCost: 18000000,
          repairCost: 4000000,
          replacementCostEstimate: 260000000,
          usefulLifeYears: 15,
          totalLifecycleCost: 257000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-RD-003'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },

      // 3. Buildings & Civic Facilities
      {
        assetTag: 'AMC-PWD-BLD-001',
        name: 'AMC Central Municipal Corporation Headquarters',
        category: 'BUILDING',
        subType: 'Administrative Secretariat',
        departmentId: deptMap['AMC-PWD'],
        status: 'OPERATIONAL',
        criticality: 'CRITICAL_INFRASTRUCTURE',
        location: {
          type: 'Point',
          coordinates: [72.5878, 23.0242],
          address: 'Mahanagar Seva Sadan, Danapith',
          ward: 'Danapith Ward',
          zone: 'CENTRAL',
          pincode: '380001'
        },
        physicalAttributes: {
          yearConstructed: 1965,
          dimensions: { builtUpSqFt: 185000, floors: 7 },
          contractorName: 'AMC In-House Engineering'
        },
        condition: {
          score: 88,
          rating: getConditionRating(88),
          lastInspectedAt: pastDate(90),
          nextInspectionDue: futureDate(90)
        },
        financials: {
          procurementCost: 250000000,
          installationCost: 40000000,
          maintenanceCost: 65000000,
          repairCost: 15000000,
          replacementCostEstimate: 950000000,
          usefulLifeYears: 80,
          totalLifecycleCost: 370000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-BLD-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-PWD-BLD-002',
        name: 'West Zone New Integrated Civic Centre',
        category: 'BUILDING',
        subType: 'Zonal Citizen Service Complex',
        departmentId: deptMap['AMC-PWD'],
        status: 'PLANNING',
        criticality: 'MEDIUM',
        location: {
          type: 'Point',
          coordinates: [72.5298, 23.0336],
          address: 'Near Vastrapur Lake, Vastrapur',
          ward: 'Vastrapur Ward',
          zone: 'WEST',
          pincode: '380015'
        },
        physicalAttributes: {
          yearConstructed: 2026,
          dimensions: { estimatedSqFt: 65000, floors: 4 }
        },
        condition: { score: 100, rating: 'EXCELLENT' },
        financials: {
          procurementCost: 120000000,
          installationCost: 15000000,
          usefulLifeYears: 50,
          totalLifecycleCost: 135000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-PWD-BLD-002'), status: 'PENDING_ACTIVATION' },
        responsibleOfficerId: userMap['manager.pwd@amc.gov.in']
      },

      // 4. Hospitals & Health Infrastructure
      {
        assetTag: 'AMC-HEALTH-HSP-001',
        name: 'Sheth V.S. General Hospital Trauma Block',
        category: 'HOSPITAL',
        subType: 'Multi-Specialty Municipal Hospital',
        departmentId: deptMap['AMC-HEALTH'],
        status: 'OPERATIONAL',
        criticality: 'CRITICAL_INFRASTRUCTURE',
        location: {
          type: 'Point',
          coordinates: [72.5719, 23.0185],
          address: 'Ellis Bridge Medical Enclave',
          ward: 'Ellis Bridge Ward',
          zone: 'CENTRAL',
          pincode: '380006'
        },
        physicalAttributes: {
          yearConstructed: 2012,
          dimensions: { beds: 650, builtUpSqFt: 320000, floors: 9 },
          contractorName: 'Shapoorji Pallonji EPC'
        },
        condition: {
          score: 86,
          rating: getConditionRating(86),
          lastInspectedAt: pastDate(40),
          nextInspectionDue: futureDate(50)
        },
        financials: {
          procurementCost: 950000000,
          installationCost: 120000000,
          maintenanceCost: 85000000,
          repairCost: 22000000,
          replacementCostEstimate: 1400000000,
          usefulLifeYears: 50,
          totalLifecycleCost: 1177000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-HEALTH-HSP-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-HEALTH-PHC-002',
        name: 'Nikol Urban Primary Health Centre',
        category: 'HOSPITAL',
        subType: 'Community Health Dispensary',
        departmentId: deptMap['AMC-HEALTH'],
        status: 'OPERATIONAL',
        criticality: 'MEDIUM',
        location: {
          type: 'Point',
          coordinates: [72.6641, 23.0452],
          address: 'Nikol Gam Road, Nikol',
          ward: 'Nikol Ward',
          zone: 'EAST',
          pincode: '382350'
        },
        physicalAttributes: {
          yearConstructed: 2016,
          dimensions: { builtUpSqFt: 12500, floors: 2 },
          contractorName: 'Apex Health Builders'
        },
        condition: {
          score: 68, // FAIR condition
          rating: getConditionRating(68),
          lastInspectedAt: pastDate(140),
          nextInspectionDue: pastDate(20) // Overdue inspection
        },
        financials: {
          procurementCost: 35000000,
          installationCost: 5000000,
          maintenanceCost: 6500000,
          repairCost: 1800000,
          replacementCostEstimate: 52000000,
          usefulLifeYears: 30,
          totalLifecycleCost: 48300000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-HEALTH-PHC-002'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-HEALTH-HSP-003',
        name: 'Shardaben General Hospital Critical Care Unit',
        category: 'HOSPITAL',
        subType: 'Emergency ICU & Ward Wing',
        departmentId: deptMap['AMC-HEALTH'],
        status: 'UNDER_MAINTENANCE',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.6124, 23.0312],
          address: 'Saraspur Main Road, Saraspur',
          ward: 'Saraspur Ward',
          zone: 'EAST',
          pincode: '380018'
        },
        physicalAttributes: {
          yearConstructed: 2002,
          dimensions: { builtUpSqFt: 85000, beds: 220, floors: 5 },
          contractorName: 'Gujarat State Police Housing Corp'
        },
        condition: {
          score: 48, // POOR condition
          rating: getConditionRating(48),
          lastInspectedAt: pastDate(10),
          nextInspectionDue: futureDate(80)
        },
        financials: {
          procurementCost: 180000000,
          installationCost: 25000000,
          maintenanceCost: 38000000,
          repairCost: 14000000,
          replacementCostEstimate: 310000000,
          usefulLifeYears: 40,
          totalLifecycleCost: 257000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-HEALTH-HSP-003'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-HEALTH-PHC-004',
        name: 'Chandkheda Community Diagnostic Dispensary',
        category: 'HOSPITAL',
        subType: 'Diagnostic Centre',
        departmentId: deptMap['AMC-HEALTH'],
        status: 'PROCUREMENT',
        criticality: 'MEDIUM',
        location: {
          type: 'Point',
          coordinates: [72.5812, 23.1098],
          address: 'IOC Road, Chandkheda',
          ward: 'Chandkheda Ward',
          zone: 'NORTH',
          pincode: '382424'
        },
        physicalAttributes: {
          yearConstructed: 2025,
          dimensions: { estimatedSqFt: 18000 }
        },
        condition: { score: 100, rating: 'EXCELLENT' },
        financials: {
          procurementCost: 42000000,
          installationCost: 6000000,
          usefulLifeYears: 30,
          totalLifecycleCost: 48000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-HEALTH-PHC-004'), status: 'PENDING_ACTIVATION' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },

      // 5. Municipal Schools & Education Infrastructure
      {
        assetTag: 'AMC-EDU-SCH-001',
        name: 'AMC Model Smart Municipal School #14',
        category: 'SCHOOL',
        subType: 'Primary & Secondary Co-Ed School',
        departmentId: deptMap['AMC-EDU'],
        status: 'OPERATIONAL',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.6012, 23.0064],
          address: 'Near Kankaria Gate No. 3, Maninagar',
          ward: 'Maninagar Ward',
          zone: 'SOUTH',
          pincode: '380008'
        },
        physicalAttributes: {
          yearConstructed: 2015,
          dimensions: { classrooms: 32, studentCapacity: 1200, floors: 3 },
          contractorName: 'AMC School Board Construction'
        },
        condition: {
          score: 78,
          rating: getConditionRating(78),
          lastInspectedAt: pastDate(70),
          nextInspectionDue: futureDate(110)
        },
        financials: {
          procurementCost: 55000000,
          installationCost: 8000000,
          maintenanceCost: 9500000,
          repairCost: 2100000,
          replacementCostEstimate: 85000000,
          usefulLifeYears: 40,
          totalLifecycleCost: 74600000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-EDU-SCH-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-EDU-SCH-002',
        name: 'Sharda Mandir Primary Vidyalaya',
        category: 'SCHOOL',
        subType: 'Municipal Primary School',
        departmentId: deptMap['AMC-EDU'],
        status: 'UNDER_MAINTENANCE',
        criticality: 'MEDIUM',
        location: {
          type: 'Point',
          coordinates: [72.5621, 23.0118],
          address: 'Paldi Gam Road, Paldi',
          ward: 'Paldi Ward',
          zone: 'WEST',
          pincode: '380007'
        },
        physicalAttributes: {
          yearConstructed: 1988,
          dimensions: { classrooms: 18, studentCapacity: 600, floors: 2 }
        },
        condition: {
          score: 46, // POOR condition
          rating: getConditionRating(46),
          lastInspectedAt: pastDate(15),
          nextInspectionDue: futureDate(75)
        },
        financials: {
          procurementCost: 22000000,
          installationCost: 3500000,
          maintenanceCost: 14000000,
          repairCost: 6500000,
          replacementCostEstimate: 45000000,
          usefulLifeYears: 40,
          totalLifecycleCost: 46000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-EDU-SCH-002'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-EDU-SCH-003',
        name: 'Vastrapur Municipal Balwadi Complex',
        category: 'SCHOOL',
        subType: 'Early Childhood Center',
        departmentId: deptMap['AMC-EDU'],
        status: 'DECOMMISSIONED',
        criticality: 'LOW',
        location: {
          type: 'Point',
          coordinates: [72.5321, 23.0315],
          address: 'Old Balwadi Road, Vastrapur',
          ward: 'Vastrapur Ward',
          zone: 'WEST',
          pincode: '380015'
        },
        physicalAttributes: {
          yearConstructed: 1974,
          dimensions: { classrooms: 6, floors: 1 }
        },
        condition: {
          score: 18, // CRITICAL condition
          rating: getConditionRating(18),
          lastInspectedAt: pastDate(180),
          nextInspectionDue: pastDate(90)
        },
        financials: {
          procurementCost: 6500000,
          installationCost: 1000000,
          maintenanceCost: 9500000,
          repairCost: 4500000,
          replacementCostEstimate: 18000000,
          usefulLifeYears: 30,
          totalLifecycleCost: 21500000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-EDU-SCH-003'), status: 'REVOKED' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-EDU-SCH-004',
        name: 'Maninagar Smart Digital High School',
        category: 'SCHOOL',
        subType: 'Smart Secondary School',
        departmentId: deptMap['AMC-EDU'],
        status: 'COMMISSIONING',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.6045, 23.0018],
          address: 'Station Road, Maninagar',
          ward: 'Maninagar Ward',
          zone: 'SOUTH',
          pincode: '380008'
        },
        physicalAttributes: {
          yearConstructed: 2024,
          dimensions: { classrooms: 36, floors: 4 }
        },
        condition: { score: 100, rating: 'EXCELLENT' },
        financials: {
          procurementCost: 82000000,
          installationCost: 11000000,
          usefulLifeYears: 50,
          totalLifecycleCost: 93000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-EDU-SCH-004'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },

      // 6. Water Supply & Sewerage Infrastructure
      {
        assetTag: 'AMC-WATER-WTP-001',
        name: 'Kotarpur Water Treatment Facility (650 MLD)',
        category: 'WATER',
        subType: 'Potable Water Treatment Plant',
        departmentId: deptMap['AMC-WATER'],
        status: 'OPERATIONAL',
        criticality: 'CRITICAL_INFRASTRUCTURE',
        location: {
          type: 'Point',
          coordinates: [72.6128, 23.0945],
          address: 'Kotarpur Water Works, Airport Road',
          ward: 'Kotarpur Ward',
          zone: 'NORTH',
          pincode: '382475'
        },
        physicalAttributes: {
          yearConstructed: 2011,
          dimensions: { capacityMld: 650, acres: 45 },
          contractorName: 'Degremont Suez EPC'
        },
        condition: {
          score: 84,
          rating: getConditionRating(84),
          lastInspectedAt: pastDate(30),
          nextInspectionDue: futureDate(60)
        },
        financials: {
          procurementCost: 650000000,
          installationCost: 90000000,
          maintenanceCost: 55000000,
          repairCost: 12000000,
          replacementCostEstimate: 980000000,
          usefulLifeYears: 40,
          totalLifecycleCost: 807000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-WATER-WTP-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-WATER-PL-002',
        name: 'Raska Pumping Main Water Pipeline #4',
        category: 'WATER',
        subType: '1200mm Mild Steel Transmission Main',
        departmentId: deptMap['AMC-WATER'],
        status: 'NEEDS_REPAIR',
        criticality: 'CRITICAL_INFRASTRUCTURE',
        location: {
          type: 'Point',
          coordinates: [72.6482, 23.0084],
          address: 'SP Ring Road Corridor, Vastral',
          ward: 'Vastral Ward',
          zone: 'EAST',
          pincode: '382418'
        },
        physicalAttributes: {
          yearConstructed: 2005,
          dimensions: { diameterMm: 1200, lengthKm: 18.5 },
          contractorName: 'Electrosteel Castings'
        },
        condition: {
          score: 42, // POOR condition
          rating: getConditionRating(42),
          lastInspectedAt: pastDate(95),
          nextInspectionDue: pastDate(5) // Overdue
        },
        financials: {
          procurementCost: 320000000,
          installationCost: 45000000,
          maintenanceCost: 48000000,
          repairCost: 26000000,
          replacementCostEstimate: 480000000,
          usefulLifeYears: 30,
          totalLifecycleCost: 439000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-WATER-PL-002'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-WATER-DRA-001',
        name: 'Chandkheda Stormwater Pumping Sump Station',
        category: 'WATER',
        subType: 'Drainage Pumping Station',
        departmentId: deptMap['AMC-WATER'],
        status: 'OUT_OF_SERVICE',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.5834, 23.1124],
          address: 'Tragad Road Junction, Chandkheda',
          ward: 'Chandkheda Ward',
          zone: 'NORTH',
          pincode: '382424'
        },
        physicalAttributes: {
          yearConstructed: 2009,
          dimensions: { pumpCapacityCusecs: 120, pumps: 4 },
          contractorName: 'Kirloskar Brothers EPC'
        },
        condition: {
          score: 22, // CRITICAL condition
          rating: getConditionRating(22),
          lastInspectedAt: pastDate(12),
          nextInspectionDue: pastDate(2)
        },
        financials: {
          procurementCost: 68000000,
          installationCost: 9000000,
          maintenanceCost: 22000000,
          repairCost: 15000000,
          replacementCostEstimate: 105000000,
          usefulLifeYears: 25,
          totalLifecycleCost: 114000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-WATER-DRA-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-WATER-WTP-003',
        name: 'Jaspur Water Distribution Plant Phase II',
        category: 'WATER',
        subType: 'Water Distribution Headworks',
        departmentId: deptMap['AMC-WATER'],
        status: 'INSTALLATION',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.5512, 23.1256],
          address: 'Jaspur Main Road, North Zone',
          ward: 'Gota Ward',
          zone: 'NORTH',
          pincode: '382481'
        },
        physicalAttributes: {
          yearConstructed: 2025,
          dimensions: { capacityMld: 250 }
        },
        condition: { score: 100, rating: 'EXCELLENT' },
        financials: {
          procurementCost: 220000000,
          installationCost: 35000000,
          usefulLifeYears: 40,
          totalLifecycleCost: 255000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-WATER-WTP-003'), status: 'PENDING_ACTIVATION' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },

      // 7. Streetlights, Parks, Urban Infrastructure
      {
        assetTag: 'AMC-SMART-SL-001',
        name: 'SG Highway Smart Connected LED Grid (Package 4)',
        category: 'STREETLIGHT',
        subType: 'CCMS Connected Smart Streetlights',
        departmentId: deptMap['AMC-SMARTCITY'],
        status: 'OPERATIONAL',
        criticality: 'MEDIUM',
        location: {
          type: 'Point',
          coordinates: [72.5112, 23.0512],
          address: 'SG Highway from Thaltej to Gota',
          ward: 'Thaltej Ward',
          zone: 'WEST',
          pincode: '380054'
        },
        physicalAttributes: {
          yearConstructed: 2022,
          dimensions: { poles: 850, wattagePerPole: 150 },
          contractorName: 'Bajaj Electricals Smart Lighting'
        },
        condition: {
          score: 94,
          rating: getConditionRating(94),
          lastInspectedAt: pastDate(25),
          nextInspectionDue: futureDate(155)
        },
        financials: {
          procurementCost: 45000000,
          installationCost: 7500000,
          maintenanceCost: 3200000,
          repairCost: 650000,
          replacementCostEstimate: 58000000,
          usefulLifeYears: 10,
          totalLifecycleCost: 56350000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-SMART-SL-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['admin@amc.gov.in']
      },
      {
        assetTag: 'AMC-SMART-PK-001',
        name: 'Sabarmati Riverfront Promenade West Park',
        category: 'PARK',
        subType: 'Civic Urban Riverfront Garden',
        departmentId: deptMap['AMC-SMARTCITY'],
        status: 'OPERATIONAL',
        criticality: 'MEDIUM',
        location: {
          type: 'Point',
          coordinates: [72.5742, 23.0365],
          address: 'Riverfront West Promenade, Usmanpura',
          ward: 'Usmanpura Ward',
          zone: 'CENTRAL',
          pincode: '380013'
        },
        physicalAttributes: {
          yearConstructed: 2014,
          dimensions: { areaHectares: 6.5, walkingTrackMeters: 2200 },
          contractorName: 'Sabarmati Riverfront Dev Corp Ltd'
        },
        condition: {
          score: 91,
          rating: getConditionRating(91),
          lastInspectedAt: pastDate(40),
          nextInspectionDue: futureDate(80)
        },
        financials: {
          procurementCost: 110000000,
          installationCost: 18000000,
          maintenanceCost: 24000000,
          repairCost: 3200000,
          replacementCostEstimate: 160000000,
          usefulLifeYears: 25,
          totalLifecycleCost: 155200000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-SMART-PK-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['admin@amc.gov.in']
      },

      // 8. Transport & Municipal Vehicles
      {
        assetTag: 'AMC-TRANS-BUS-001',
        name: 'Janmarg BRTS Electric Feeder Transit Fleet #EB-12',
        category: 'VEHICLE',
        subType: '12m Low-Floor Electric Bus',
        departmentId: deptMap['AMC-TRANS'],
        status: 'OPERATIONAL',
        criticality: 'HIGH',
        location: {
          type: 'Point',
          coordinates: [72.5815, 23.0568],
          address: 'RTO BRTS Hub, Sabarmati',
          ward: 'Sabarmati Ward',
          zone: 'CENTRAL',
          pincode: '380027'
        },
        physicalAttributes: {
          yearConstructed: 2021,
          dimensions: { batteryKwh: 250, passengerCapacity: 45 },
          contractorName: 'JBM Auto Electric'
        },
        condition: {
          score: 72,
          rating: getConditionRating(72),
          lastInspectedAt: pastDate(15),
          nextInspectionDue: futureDate(75)
        },
        financials: {
          procurementCost: 16000000,
          installationCost: 800000,
          maintenanceCost: 3400000,
          repairCost: 950000,
          replacementCostEstimate: 19000000,
          usefulLifeYears: 10,
          totalLifecycleCost: 21150000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-TRANS-BUS-001'), status: 'ACTIVE' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      },
      {
        assetTag: 'AMC-TRANS-TRM-002',
        name: 'Old Kankaria Multi-Modal Transit Terminal',
        category: 'BUILDING',
        subType: 'Transit Depot & Terminal Station',
        departmentId: deptMap['AMC-TRANS'],
        status: 'DISPOSED',
        criticality: 'LOW',
        location: {
          type: 'Point',
          coordinates: [72.5982, 23.0034],
          address: 'Near Old Bus Depot, Kankaria',
          ward: 'Maninagar Ward',
          zone: 'SOUTH',
          pincode: '380008'
        },
        physicalAttributes: {
          yearConstructed: 1968,
          dimensions: { builtUpSqFt: 22000, platforms: 8 }
        },
        condition: {
          score: 10, // CRITICAL condition
          rating: getConditionRating(10),
          lastInspectedAt: pastDate(300),
          nextInspectionDue: pastDate(200)
        },
        financials: {
          procurementCost: 12000000,
          installationCost: 1500000,
          maintenanceCost: 18000000,
          repairCost: 8500000,
          salvageValue: 2500000,
          usefulLifeYears: 40,
          totalLifecycleCost: 40000000
        },
        qrCode: { identifier: generateQrIdentifier('AMC-TRANS-TRM-002'), status: 'REVOKED' },
        responsibleOfficerId: userMap['director.pwd@amc.gov.in']
      }
    ];

    console.log(`[Seed] Creating ${assetsData.length} diverse Ahmedabad infrastructure assets...`);
    const createdAssets = await Asset.insertMany(assetsData);
    console.log(`[Seed] Created ${createdAssets.length} municipal assets across all 11 lifecycle states.`);

    // 7. Seed Initial Lifecycle Events for Sample Assets
    const sampleEvents = [
      {
        assetId: createdAssets[0]._id, // Sardar Patel Flyover
        fromState: 'COMMISSIONING',
        toState: 'OPERATIONAL',
        eventType: 'COMMISSIONED',
        triggeredById: userMap['admin@amc.gov.in'],
        reason: 'Final structural load test passed with certificate from CEPT University.',
        evidenceDocumentUrls: ['https://amc.gov.in/certs/CEPT_LoadTest_2018.pdf'],
        timestamp: pastDate(365)
      },
      {
        assetId: createdAssets[1]._id, // Subhash Bridge Overpass
        fromState: 'UNDER_INSPECTION',
        toState: 'NEEDS_REPAIR',
        eventType: 'DEFECT_ESCALATED',
        triggeredById: userMap['inspector.pwd@amc.gov.in'],
        reason: 'Severe expansion joint distress and concrete spalling detected on Pier P4.',
        evidenceDocumentUrls: ['https://amc.gov.in/reports/insp_subhash_pier4.jpg'],
        timestamp: pastDate(120)
      },
      {
        assetId: createdAssets[4]._id, // Naroda Heavy Road
        fromState: 'NEEDS_REPAIR',
        toState: 'OUT_OF_SERVICE',
        eventType: 'EMERGENCY_LOCKOUT',
        triggeredById: userMap['director.pwd@amc.gov.in'],
        reason: 'Subsurface subsidence and cratering post-monsoon posing severe heavy truck hazard.',
        evidenceDocumentUrls: ['https://amc.gov.in/notices/hazard_naroda_rd6.pdf'],
        timestamp: pastDate(15)
      },
      {
        assetId: createdAssets[14]._id, // Vastrapur Balwadi
        fromState: 'OUT_OF_SERVICE',
        toState: 'DECOMMISSIONED',
        eventType: 'DECOMMISSION_APPROVED',
        triggeredById: userMap['admin@amc.gov.in'],
        reason: 'Standing committee resolution #204 approved building condemnation.',
        evidenceDocumentUrls: ['https://amc.gov.in/resolutions/SC_Res_204_2024.pdf'],
        timestamp: pastDate(180)
      }
    ];

    console.log('[Seed] Seeding sample lifecycle events...');
    await LifecycleEvent.insertMany(sampleEvents);

    // 8. Record Genesis Audit Log
    const adminUser = createdUsers.find((u) => u.role === 'ADMIN');
    await recordEvent({
      entityName: 'USER',
      entityId: adminUser._id,
      action: 'CREATE',
      performedById: adminUser._id,
      performerRole: 'ADMIN',
      ipAddress: '127.0.0.1',
      delta: {
        departmentsCreated: createdDepartments.length,
        usersCreated: createdUsers.length,
        assetsCreated: createdAssets.length
      },
      justification: 'System Phase 2 initialization & deterministic seed execution (24 Ahmedabad assets)'
    });

    console.log('[Seed] Genesis audit record sealed.');
    console.log('[Seed] SUCCESS: Database seeding complete with 24 Ahmedabad physical assets.');
    console.log('\n================ DEMO CREDENTIALS ================');
    console.log('Password for all demo accounts: Password@123');
    console.log('• ADMIN:          admin@amc.gov.in');
    console.log('• DIRECTOR:       director.pwd@amc.gov.in (Dept: AMC-PWD)');
    console.log('• ASSET_MANAGER:  manager.pwd@amc.gov.in (Dept: AMC-PWD)');
    console.log('• INSPECTOR:      inspector.pwd@amc.gov.in (Dept: AMC-PWD)');
    console.log('• CONTRACTOR:     contractor.infra@amc.gov.in (Dept: AMC-PWD)');
    console.log('• AUDITOR:        auditor.gujarat@amc.gov.in (State Audit)');
    console.log('• INACTIVE TEST:  inactive.officer@amc.gov.in (isActive: false)');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Seed] FATAL: Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
