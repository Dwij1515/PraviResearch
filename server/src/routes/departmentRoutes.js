const express = require('express');
const { getDepartments, getDepartmentById } = require('../controllers/departmentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/departments
router.get('/', authenticateToken, getDepartments);

// GET /api/v1/departments/:id
router.get('/:id', authenticateToken, getDepartmentById);

module.exports = router;
