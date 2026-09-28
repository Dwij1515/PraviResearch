/**
 * Municipal Infrastructure Asset Management System (IAMS)
 * Centralized Asset Lifecycle Transition Engine - Version 2.0.0-SEALED-SPEC
 */

const { AssetStatus } = require('../constants/enums');
const Asset = require('../models/Asset');
const LifecycleEvent = require('../models/LifecycleEvent');
const { recordEvent } = require('./auditService');

/**
 * Canonical Transition Matrix
 * Maps each AssetStatus to an array of valid target states.
 */
const CANONICAL_TRANSITIONS = Object.freeze({
  PLANNING: ['PROCUREMENT'],
  PROCUREMENT: ['INSTALLATION'],
  INSTALLATION: ['COMMISSIONING'],
  COMMISSIONING: ['OPERATIONAL'],
  OPERATIONAL: ['UNDER_INSPECTION', 'OUT_OF_SERVICE', 'DECOMMISSIONED'],
  UNDER_INSPECTION: ['OPERATIONAL', 'NEEDS_REPAIR'],
  NEEDS_REPAIR: ['UNDER_MAINTENANCE', 'OUT_OF_SERVICE'],
  UNDER_MAINTENANCE: ['OPERATIONAL', 'OUT_OF_SERVICE'],
  OUT_OF_SERVICE: ['UNDER_MAINTENANCE', 'DECOMMISSIONED'],
  DECOMMISSIONED: ['DISPOSED'],
  DISPOSED: [] // Terminal state: no transitions allowed
});

/**
 * Maps state transitions to canonical LifecycleEvent eventType enum.
 */
const getEventTypeForTransition = (fromState, toState) => {
  if (toState === 'COMMISSIONING' || toState === 'OPERATIONAL' && fromState === 'COMMISSIONING') {
    return 'COMMISSIONED';
  }
  if (toState === 'UNDER_INSPECTION') {
    return 'INSPECTION_SUBMITTED';
  }
  if (toState === 'NEEDS_REPAIR') {
    return 'DEFECT_ESCALATED';
  }
  if (toState === 'UNDER_MAINTENANCE') {
    return 'WORK_ORDER_DISPATCHED';
  }
  if (fromState === 'UNDER_MAINTENANCE' && toState === 'OPERATIONAL') {
    return 'MAINTENANCE_VERIFIED';
  }
  if (toState === 'OUT_OF_SERVICE') {
    return 'EMERGENCY_LOCKOUT';
  }
  if (toState === 'DECOMMISSIONED') {
    return 'DECOMMISSION_APPROVED';
  }
  if (toState === 'DISPOSED') {
    return 'DISPOSED';
  }
  return 'REGISTRATION';
};

/**
 * Custom error class for lifecycle transition conflicts (HTTP 409)
 */
class LifecycleConflictError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'LifecycleConflictError';
    this.statusCode = 409;
    this.code = 'INVALID_LIFECYCLE_TRANSITION';
    this.details = details;
  }
}

/**
 * Custom error class for lifecycle authorization failures (HTTP 403)
 */
class LifecycleForbiddenError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'LifecycleForbiddenError';
    this.statusCode = 403;
    this.code = 'FORBIDDEN_LIFECYCLE_TRANSITION';
    this.details = details;
  }
}

/**
 * Validates role permissions for a requested state transition.
 */
const validateRoleForTransition = (user, fromState, toState, assetDepartmentId) => {
  const role = user.role;

  // 1. AUDITOR is strictly read-only
  if (role === 'AUDITOR') {
    throw new LifecycleForbiddenError(
      'Auditors have read-only access and cannot trigger asset lifecycle transitions.'
    );
  }

  // 2. CONTRACTOR has no direct lifecycle transition rights
  if (role === 'CONTRACTOR') {
    throw new LifecycleForbiddenError(
      'Contractors are not authorized to trigger direct asset lifecycle transitions.'
    );
  }

  // 3. Department boundary check for non-ADMIN users
  if (role !== 'ADMIN') {
    const userDept = user.departmentId ? user.departmentId.toString() : null;
    const assetDept = assetDepartmentId ? assetDepartmentId.toString() : null;
    if (!userDept || userDept !== assetDept) {
      throw new LifecycleForbiddenError(
        'Access denied: You cannot transition assets outside your assigned municipal department.',
        { userDepartment: userDept, assetDepartment: assetDept }
      );
    }
  }

  // 4. INSPECTOR role restrictions: may ONLY move OPERATIONAL -> UNDER_INSPECTION
  if (role === 'INSPECTOR') {
    if (fromState === 'OPERATIONAL' && toState === 'UNDER_INSPECTION') {
      return true;
    }
    throw new LifecycleForbiddenError(
      `Inspectors may only initiate inspections (OPERATIONAL -> UNDER_INSPECTION). Cannot transition from '${fromState}' to '${toState}'.`
    );
  }

  // 5. ADMIN, DIRECTOR, and ASSET_MANAGER (within department) have full transition rights
  if (['ADMIN', 'DIRECTOR', 'ASSET_MANAGER'].includes(role)) {
    return true;
  }

  throw new LifecycleForbiddenError(`Role '${role}' is not authorized for lifecycle transitions.`);
};

/**
 * Executes a deterministic asset lifecycle transition.
 * Updates Asset, creates LifecycleEvent, and records AuditLog.
 *
 * @param {Object} params
 * @param {string} params.assetId
 * @param {string} params.toState
 * @param {string} params.reason
 * @param {string[]} [params.evidenceDocumentUrls]
 * @param {Object} params.user - Authenticated user context { id, role, departmentId }
 * @param {string} params.ipAddress
 * @returns {Promise<{ asset: Object, lifecycleEvent: Object }>}
 */
const transitionAssetLifecycle = async ({
  assetId,
  toState,
  reason,
  evidenceDocumentUrls = [],
  user,
  ipAddress = '127.0.0.1'
}) => {
  // 1. Validate inputs
  if (!toState || !AssetStatus.includes(toState)) {
    throw new LifecycleConflictError(
      `'${toState}' is not a valid AssetStatus. Valid states: [${AssetStatus.join(', ')}]`
    );
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    const err = new Error('A descriptive reason is mandatory for all asset lifecycle transitions.');
    err.statusCode = 400;
    err.code = 'MISSING_TRANSITION_REASON';
    throw err;
  }

  // 2. Fetch active asset
  const asset = await Asset.findById(assetId);
  if (!asset) {
    const err = new Error(`Asset with ID '${assetId}' was not found.`);
    err.statusCode = 404;
    err.code = 'ASSET_NOT_FOUND';
    throw err;
  }

  if (asset.isAbandoned) {
    throw new LifecycleConflictError(
      'Cannot transition an abandoned / archived asset. Reactivate the asset before lifecycle transitions.',
      { isAbandoned: true }
    );
  }

  const fromState = asset.status;

  // 3. Verify transition legality against Canonical Matrix
  const allowedNextStates = CANONICAL_TRANSITIONS[fromState] || [];
  if (!allowedNextStates.includes(toState)) {
    throw new LifecycleConflictError(
      `Invalid lifecycle transition from '${fromState}' to '${toState}'. Allowed target state(s): [${allowedNextStates.join(', ') || 'None (Terminal state)'}].`,
      { fromState, attemptedTarget: toState, allowedTransitions: allowedNextStates }
    );
  }

  // 4. Validate role and department authority
  validateRoleForTransition(user, fromState, toState, asset.departmentId);

  // 5. Update Asset status
  asset.status = toState;
  await asset.save();

  // 6. Record LifecycleEvent
  const eventType = getEventTypeForTransition(fromState, toState);
  const lifecycleEvent = new LifecycleEvent({
    assetId: asset._id,
    fromState,
    toState,
    eventType,
    triggeredById: user.id,
    reason: reason.trim(),
    evidenceDocumentUrls: Array.isArray(evidenceDocumentUrls) ? evidenceDocumentUrls : [],
    timestamp: new Date()
  });
  await lifecycleEvent.save();

  // 7. Record AuditLog
  await recordEvent({
    entityName: 'ASSET',
    entityId: asset._id,
    action: 'STATE_TRANSITION',
    performedById: user.id,
    performerRole: user.role,
    ipAddress,
    delta: {
      status: {
        before: fromState,
        after: toState
      },
      reason: reason.trim(),
      eventType
    },
    justification: `Lifecycle transition: ${fromState} -> ${toState} by ${user.role} (${reason.trim()})`
  });

  return {
    asset,
    lifecycleEvent
  };
};

module.exports = {
  CANONICAL_TRANSITIONS,
  transitionAssetLifecycle,
  validateRoleForTransition,
  getEventTypeForTransition,
  LifecycleConflictError,
  LifecycleForbiddenError
};
