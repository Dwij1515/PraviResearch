const { UserRole } = require('../constants/enums');

/**
 * Reusable Role-Based Access Control middleware for endpoint-level authorization.
 * Note: Work-order status transitions enforce additional transition-level tuple RBAC.
 */
const requireRoles = (...allowedRoles) => {
  // Validate that allowedRoles are valid canonical roles
  allowedRoles.forEach((role) => {
    if (!UserRole.includes(role)) {
      console.warn(`[RBAC Warning] Role '${role}' is not in canonical UserRole enum registry.`);
    }
  });

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User authentication required prior to role evaluation.'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized. Required role(s): [${allowedRoles.join(', ')}].`
        }
      });
    }

    next();
  };
};

module.exports = {
  requireRoles
};
