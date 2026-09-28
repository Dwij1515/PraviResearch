const express = require('express');
const {
  getUsers,
  createUser,
  updateUserStatus,
  updateUserDepartment
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/users (ADMIN and DIRECTOR)
router.get('/', requireRoles('ADMIN', 'DIRECTOR'), getUsers);

// POST /api/v1/users (ADMIN only)
router.post('/', requireRoles('ADMIN'), createUser);

// PATCH /api/v1/users/:id/status (ADMIN only)
router.patch('/:id/status', requireRoles('ADMIN'), updateUserStatus);

// PATCH /api/v1/users/:id/department (ADMIN only)
router.patch('/:id/department', requireRoles('ADMIN'), updateUserDepartment);

module.exports = router;
