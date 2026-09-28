const express = require('express');
const {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrderStatus
} = require('../controllers/workOrderController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getWorkOrders);
router.post('/', requireRoles('ADMIN', 'ASSET_MANAGER'), createWorkOrder);
router.patch('/:id/status', updateWorkOrderStatus);

module.exports = router;
