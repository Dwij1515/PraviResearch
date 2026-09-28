const express = require('express');
const { getAiInsights, evaluateAsset } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/insights', getAiInsights);
router.post('/evaluate/:assetId', evaluateAsset);

module.exports = router;
