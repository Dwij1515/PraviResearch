/**
 * Municipal Infrastructure Asset Management System (IAMS)
 * Centralized Canonical Enum Registry - Version 2.0.0-SEALED-SPEC
 */

const AssetStatus = Object.freeze([
  'PLANNING',
  'PROCUREMENT',
  'INSTALLATION',
  'COMMISSIONING',
  'OPERATIONAL',
  'UNDER_INSPECTION',
  'NEEDS_REPAIR',
  'UNDER_MAINTENANCE',
  'OUT_OF_SERVICE',
  'DECOMMISSIONED',
  'DISPOSED'
]);

const ConditionRating = Object.freeze([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'CRITICAL'
]);

const UserRole = Object.freeze([
  'ADMIN',
  'DIRECTOR',
  'ASSET_MANAGER',
  'INSPECTOR',
  'CONTRACTOR',
  'AUDITOR'
]);

const WorkOrderStatus = Object.freeze([
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING_VERIFICATION',
  'REWORK_REQUIRED',
  'VERIFIED',
  'CLOSED',
  'CANCELLED'
]);

const WorkOrderPriority = Object.freeze([
  'LOW',
  'MEDIUM',
  'HIGH',
  'EMERGENCY'
]);

const InspectionType = Object.freeze([
  'ROUTINE_QUARTERLY',
  'SAFETY_AUDIT',
  'POST_MONSOON',
  'SPECIAL_COMPLAINT'
]);

const DefectSeverity = Object.freeze([
  'MINOR',
  'MODERATE',
  'SEVERE'
]);

const InspectionStatus = Object.freeze([
  'SUBMITTED',
  'REVIEWED_BY_MANAGER'
]);

const Criticality = Object.freeze([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL_INFRASTRUCTURE'
]);

const AssetCategory = Object.freeze([
  'ROAD',
  'BRIDGE',
  'BUILDING',
  'SCHOOL',
  'HOSPITAL',
  'WATER',
  'STREETLIGHT',
  'PARK',
  'VEHICLE'
]);

const DepartmentZone = Object.freeze([
  'WEST',
  'CENTRAL',
  'EAST',
  'SOUTH',
  'NORTH'
]);

const AuditAction = Object.freeze([
  'LOGIN',
  'CREATE',
  'UPDATE',
  'STATE_TRANSITION',
  'STATUS_CHANGE',
  'VERIFICATION',
  'ARCHIVE_ATTEMPT'
]);

const AIInsightType = Object.freeze([
  'DETERMINISTIC_RISK_PADI',
  'LLM_INSPECTION_SYNTHESIS',
  'LLM_MAINTENANCE_DRAFT'
]);

const RiskTier = Object.freeze([
  'LOW',
  'MODERATE',
  'ELEVATED',
  'CRITICAL'
]);

const QrStatus = Object.freeze([
  'PENDING_ACTIVATION',
  'ACTIVE',
  'REVOKED'
]);

module.exports = {
  AssetStatus,
  ConditionRating,
  UserRole,
  WorkOrderStatus,
  WorkOrderPriority,
  InspectionType,
  DefectSeverity,
  InspectionStatus,
  Criticality,
  AssetCategory,
  DepartmentZone,
  AuditAction,
  AIInsightType,
  RiskTier,
  QrStatus
};
