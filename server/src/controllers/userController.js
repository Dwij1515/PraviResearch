const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { recordEvent } = require('../services/auditService');

/**
 * List users (Filterable by role, departmentId)
 * GET /api/v1/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, departmentId } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (departmentId) filter.departmentId = departmentId;

    // If Director, restrict to their department
    if (req.user.role === 'DIRECTOR') {
      filter.departmentId = req.user.departmentId;
    }

    const users = await User.find(filter)
      .populate('departmentId', 'name code zone')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Provision new municipal officer / user
 * POST /api/v1/users
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, departmentId, phone } = req.body;

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, password, role, and phone are required fields.'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: `A user with email '${normalizedEmail}' already exists.`
        }
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      departmentId: departmentId || null,
      phone: phone.trim()
    });

    await user.save();

    await recordEvent({
      entityName: 'USER',
      entityId: user._id,
      action: 'CREATE',
      performedById: req.user.id,
      performerRole: req.user.role,
      ipAddress: req.ip,
      delta: { name: user.name, email: user.email, role: user.role, departmentId: user.departmentId },
      justification: `User account created by ${req.user.email}`
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active status
 * PATCH /api/v1/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'isActive must be a boolean.'
        }
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The requested user was not found.'
        }
      });
    }

    const prevStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    await recordEvent({
      entityName: 'USER',
      entityId: user._id,
      action: 'UPDATE',
      performedById: req.user.id,
      performerRole: req.user.role,
      ipAddress: req.ip,
      delta: { isActive: { before: prevStatus, after: isActive } },
      justification: `User active status toggled by ${req.user.email}`
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reassign user department
 * PATCH /api/v1/users/:id/department
 */
const updateUserDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The requested user was not found.'
        }
      });
    }

    const prevDept = user.departmentId;
    user.departmentId = departmentId || null;
    await user.save();

    await recordEvent({
      entityName: 'USER',
      entityId: user._id,
      action: 'UPDATE',
      performedById: req.user.id,
      performerRole: req.user.role,
      ipAddress: req.ip,
      delta: { departmentId: { before: prevDept, after: user.departmentId } },
      justification: `User department reassigned by ${req.user.email}`
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        departmentId: user.departmentId
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUserStatus,
  updateUserDepartment
};
