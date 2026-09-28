const User = require('../models/User');
const { signToken } = require('../utils/token');
const { recordEvent } = require('../services/auditService');

/**
 * Officer / User Login
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email and password are required for login.'
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Protect against account enumeration by returning identical generic error
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.'
        }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'This user account has been deactivated by administration.'
        }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.'
        }
      });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId.toString() : null
    });

    // Record LOGIN audit event
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await recordEvent({
      entityName: 'AUTH',
      entityId: user._id,
      action: 'LOGIN',
      performedById: user._id,
      performerRole: user.role,
      ipAddress: clientIp,
      delta: { lastLoginAt: user.lastLoginAt },
      justification: `Successful login for ${user.email} (${user.role})`
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated User Profile
 * GET /api/v1/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('departmentId', 'name code zone')
      .select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Authenticated user profile could not be found.'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe
};
