const express = require('express');
const { getInspections, createInspection } = require('../controllers/inspectionController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getInspections);
router.post('/', requireRoles('ADMIN', 'ASSET_MANAGER', 'INSPECTOR'), createInspection);

module.exports = router;
