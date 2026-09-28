const mongoose = require('mongoose');
const {
  WorkOrderStatus,
  WorkOrderPriority,
  AssetStatus
} = require('../constants/enums');

const partReplacedSchema = new mongoose.Schema(
  {
    partName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCostInr: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const workOrderSchema = new mongoose.Schema(
  {
    workOrderNumber: {
      type: String,
      required: [true, 'Work order number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required']
    },
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection'
    },
    title: {
      type: String,
      required: [true, 'Work order title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Work order description is required'],
      trim: true
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: WorkOrderPriority,
        message: '{VALUE} is not a valid WorkOrderPriority'
      },
      default: 'MEDIUM'
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: WorkOrderStatus,
        message: '{VALUE} is not a valid WorkOrderStatus'
      },
      default: 'OPEN'
    },
    assignedContractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetCompletionDate: {
      type: Date,
      required: [true, 'Target completion date is required']
    },
    actualCompletionDate: {
      type: Date
    },
    costBreakdown: {
      estimatedCostInr: { type: Number, default: 0, min: 0 },
      laborCostInr: { type: Number, default: 0, min: 0 },
      partsCostInr: { type: Number, default: 0, min: 0 },
      totalApprovedCostInr: { type: Number, default: 0, min: 0 }
    },
    partsReplaced: {
      type: [partReplacedSchema],
      default: []
    },
    completionProofPhotos: {
      type: [String],
      default: []
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    verifiedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Context-Aware Recovery & Safety Fields (Mandatory per sealed spec)
    preMaintenanceAssetStatus: {
      type: String,
      required: [true, 'preMaintenanceAssetStatus is required for context-aware recovery'],
      enum: {
        values: AssetStatus,
        message: '{VALUE} is not a valid AssetStatus'
      }
    },
    safetyClearanceVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'work_orders'
  }
);

workOrderSchema.index({ assetId: 1, status: 1 });
workOrderSchema.index({ assignedContractorId: 1 });
workOrderSchema.index({ targetCompletionDate: 1 });

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);

module.exports = WorkOrder;
