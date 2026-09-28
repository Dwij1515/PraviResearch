const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiter for authentication endpoint (max 20 requests per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    }
  }
});

// POST /api/v1/auth/login
router.post('/login', loginLimiter, login);

// GET /api/v1/auth/me
router.get('/me', authenticateToken, getMe);

module.exports = router;
