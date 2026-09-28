const express = require('express');
const {
  createAsset,
  getAssets,
  getAssetById,
  getAssetByQr,
  updateAsset,
  deleteAsset,
  transitionLifecycle,
  getAssetSummary
} = require('../controllers/assetController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

// Public QR Token Resolver
router.get('/qr/:qrIdentifier', getAssetByQr);

// Protected endpoints require valid JWT authentication
router.use(authenticateToken);

// Dashboard summary aggregation
router.get('/summary', getAssetSummary);

// List assets with filters & search
router.get('/', getAssets);

// Register a new asset (ADMIN or ASSET_MANAGER)
router.post('/', requireRoles('ADMIN', 'ASSET_MANAGER'), createAsset);

// Get complete Asset Passport by ID
router.get('/:id', getAssetById);

// Update asset metadata (ADMIN or ASSET_MANAGER)
router.patch('/:id', requireRoles('ADMIN', 'ASSET_MANAGER'), updateAsset);

// Archive / Deactivate asset (ADMIN or ASSET_MANAGER)
router.delete('/:id', requireRoles('ADMIN', 'ASSET_MANAGER'), deleteAsset);

// Transition asset lifecycle state (Role validation evaluated per transition)
router.patch('/:id/lifecycle', transitionLifecycle);

module.exports = router;
