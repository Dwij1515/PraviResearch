const mongoose = require('mongoose');
const { AssetStatus } = require('../constants/enums');

const lifecycleEventSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required']
    },
    fromState: {
      type: String,
      required: [true, 'fromState is required'],
      enum: {
        values: AssetStatus,
        message: '{VALUE} is not a valid AssetStatus'
      }
    },
    toState: {
      type: String,
      required: [true, 'toState is required'],
      enum: {
        values: AssetStatus,
        message: '{VALUE} is not a valid AssetStatus'
      }
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: [
        'REGISTRATION',
        'COMMISSIONED',
        'INSPECTION_SUBMITTED',
        'DEFECT_ESCALATED',
        'WORK_ORDER_DISPATCHED',
        'MAINTENANCE_VERIFIED',
        'EMERGENCY_LOCKOUT',
        'DECOMMISSION_APPROVED',
        'DISPOSED'
      ]
    },
    triggeredById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Triggered by user ID is required']
    },
    reason: {
      type: String,
      required: [true, 'Transition reason is required'],
      trim: true
    },
    evidenceDocumentUrls: {
      type: [String],
      default: []
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    collection: 'lifecycle_events'
  }
);

lifecycleEventSchema.index({ assetId: 1, timestamp: -1 });

const LifecycleEvent = mongoose.model('LifecycleEvent', lifecycleEventSchema);

module.exports = LifecycleEvent;
