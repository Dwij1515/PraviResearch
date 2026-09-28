const mongoose = require('mongoose');
const { AuditAction, UserRole } = require('../constants/enums');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    entityName: {
      type: String,
      required: [true, 'Entity name is required'],
      enum: ['ASSET', 'INSPECTION', 'WORK_ORDER', 'USER', 'AUTH']
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Entity ID is required']
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: {
        values: AuditAction,
        message: '{VALUE} is not a valid AuditAction'
      }
    },
    performedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performerRole: {
      type: String,
      enum: {
        values: UserRole,
        message: '{VALUE} is not a valid UserRole'
      }
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    delta: {
      type: Object,
      default: {}
    },
    justification: {
      type: String,
      default: ''
    },
    // Tamper-evident cryptographic hash chain fields
    previousHash: {
      type: String,
      required: [true, 'Previous hash is required']
    },
    currentHash: {
      type: String,
      required: [true, 'Current hash is required']
    }
  },
  {
    timestamps: false,
    collection: 'audit_logs'
  }
);

auditLogSchema.index({ entityId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
