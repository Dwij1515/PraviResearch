/**
 * Departmental scoping utility and middleware.
 * Enforces municipal resource boundaries based on the authenticated user's role and assigned department.
 */
const applyDepartmentScope = (req, baseFilter = {}) => {
  const filter = { ...baseFilter };
  const user = req.user;

  if (!user) {
    return filter;
  }

  // 1. ADMIN has global unrestricted municipal access
  if (user.role === 'ADMIN') {
    return filter;
  }

  // 2. AUDITOR has global read-only visibility for governance oversight
  if (user.role === 'AUDITOR') {
    return filter;
  }

  // 3. Operational municipal officers: DIRECTOR, ASSET_MANAGER, INSPECTOR
  // Strictly scoped to their home department
  if (['DIRECTOR', 'ASSET_MANAGER', 'INSPECTOR'].includes(user.role)) {
    if (!user.departmentId) {
      // Defensive fallback: if officer has no assigned department, match nothing
      filter.departmentId = null;
      return filter;
    }
    // Prevent client-side parameter override
    filter.departmentId = user.departmentId;
    return filter;
  }

  // 4. CONTRACTOR: Scoped to their assigned contractor ID
  if (user.role === 'CONTRACTOR') {
    filter.assignedContractorId = user.id;
    return filter;
  }

  return filter;
};

/**
 * Middleware that validates if a user has authority to interact with a specific departmentId resource.
 */
const requireDepartmentMatch = (getDepartmentIdFromReq) => {
  return (req, res, next) => {
    const user = req.user;

    // ADMIN and AUDITOR are exempt from single-department lock
    if (user.role === 'ADMIN' || user.role === 'AUDITOR') {
      return next();
    }

    const targetDepartmentId = getDepartmentIdFromReq(req);

    if (!targetDepartmentId) {
      return next();
    }

    if (!user.departmentId || user.departmentId.toString() !== targetDepartmentId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'DEPARTMENT_ACCESS_DENIED',
          message: 'Access denied: You are not authorized to access or modify resources outside your assigned department.'
        }
      });
    }

    next();
  };
};

module.exports = {
  applyDepartmentScope,
  requireDepartmentMatch
};
