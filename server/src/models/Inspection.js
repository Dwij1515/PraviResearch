const mongoose = require('mongoose');
const {
  InspectionType,
  ConditionRating,
  DefectSeverity,
  InspectionStatus
} = require('../constants/enums');

const checklistItemSchema = new mongoose.Schema(
  {
    itemKey: { type: String, required: true },
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    weight: { type: Number, required: true, min: 1, max: 3, default: 1 },
    remarks: { type: String, default: '' }
  },
  { _id: false }
);

const defectSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: {
        values: DefectSeverity,
        message: '{VALUE} is not a valid DefectSeverity'
      }
    },
    photoUrls: { type: [String], default: [] },
    recommendedAction: { type: String, default: '' }
  },
  { _id: false }
);

const inspectionSchema = new mongoose.Schema(
  {
    inspectionNumber: {
      type: String,
      required: [true, 'Inspection number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required']
    },
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inspector ID is required']
    },
    performedDate: {
      type: Date,
      required: [true, 'Performed date is required'],
      default: Date.now
    },
    type: {
      type: String,
      required: [true, 'Inspection type is required'],
      enum: {
        values: InspectionType,
        message: '{VALUE} is not a valid InspectionType'
      }
    },
    checklist: {
      type: [checklistItemSchema],
      default: []
    },
    overallConditionScore: {
      type: Number,
      required: [true, 'Overall condition score is required'],
      min: [0, 'Condition score cannot be less than 0'],
      max: [100, 'Condition score cannot exceed 100']
    },
    conditionRating: {
      type: String,
      required: [true, 'Condition rating is required'],
      enum: {
        values: ConditionRating,
        message: '{VALUE} is not a valid ConditionRating'
      }
    },
    defects: {
      type: [defectSchema],
      default: []
    },
    status: {
      type: String,
      enum: {
        values: InspectionStatus,
        message: '{VALUE} is not a valid InspectionStatus'
      },
      default: 'SUBMITTED'
    },
    // Required Manager Review Metadata
    reviewedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    approved: {
      type: Boolean
    },
    reviewNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'inspections'
  }
);

inspectionSchema.index({ assetId: 1, performedDate: -1 });
inspectionSchema.index({ inspectorId: 1 });
inspectionSchema.index({ status: 1 });

const Inspection = mongoose.model('Inspection', inspectionSchema);

module.exports = Inspection;
