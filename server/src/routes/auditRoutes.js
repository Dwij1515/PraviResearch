const express = require('express');
const { getAuditLogs, verifyLedgerIntegrity } = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/audit (ADMIN, AUDITOR, DIRECTOR)
router.get('/', requireRoles('ADMIN', 'AUDITOR', 'DIRECTOR'), getAuditLogs);

// GET /api/v1/audit/verify (ADMIN, AUDITOR, DIRECTOR)
router.get('/verify', requireRoles('ADMIN', 'AUDITOR', 'DIRECTOR'), verifyLedgerIntegrity);

module.exports = router;
