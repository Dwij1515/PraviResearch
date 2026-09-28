const mongoose = require('mongoose');
const {
  AssetStatus,
  ConditionRating,
  Criticality,
  AssetCategory,
  DepartmentZone,
  QrStatus
} = require('../constants/enums');

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Asset category is required'],
      enum: {
        values: AssetCategory,
        message: '{VALUE} is not a valid AssetCategory'
      }
    },
    subType: {
      type: String,
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    status: {
      type: String,
      required: [true, 'Asset status is required'],
      enum: {
        values: AssetStatus,
        message: '{VALUE} is not a valid AssetStatus'
      },
      default: 'PLANNING'
    },
    criticality: {
      type: String,
      required: [true, 'Criticality level is required'],
      enum: {
        values: Criticality,
        message: '{VALUE} is not a valid Criticality'
      },
      default: 'MEDIUM'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates [longitude, latitude] are required'],
        validate: {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 &&
              val[1] >= -90 &&
              val[1] <= 90
            );
          },
          message: 'Coordinates must be [longitude, latitude] with valid geographic bounds'
        }
      },
      address: { type: String, trim: true },
      ward: { type: String, trim: true },
      zone: {
        type: String,
        enum: {
          values: DepartmentZone,
          message: '{VALUE} is not a valid DepartmentZone'
        }
      },
      pincode: { type: String, trim: true }
    },
    physicalAttributes: {
      yearConstructed: { type: Number },
      dimensions: { type: Object, default: {} },
      contractorName: { type: String, trim: true },
      specifications: { type: Object, default: {} }
    },
    condition: {
      score: {
        type: Number,
        min: [0, 'Score cannot be less than 0'],
        max: [100, 'Score cannot exceed 100'],
        default: 100
      },
      rating: {
        type: String,
        enum: {
          values: ConditionRating,
          message: '{VALUE} is not a valid ConditionRating'
        },
        default: 'EXCELLENT'
      },
      lastInspectedAt: { type: Date },
      nextInspectionDue: { type: Date }
    },
    financials: {
      procurementCost: { type: Number, default: 0, min: 0 },
      installationCost: { type: Number, default: 0, min: 0 },
      maintenanceCost: { type: Number, default: 0, min: 0 },
      repairCost: { type: Number, default: 0, min: 0 },
      upgradeCost: { type: Number, default: 0, min: 0 },
      replacementCostEstimate: { type: Number, default: 0, min: 0 },
      salvageValue: { type: Number, default: 0, min: 0 },
      usefulLifeYears: { type: Number, default: 30, min: 1 },
      annualDepreciation: { type: Number, default: 0, min: 0 },
      currentBookValue: { type: Number, default: 0, min: 0 },
      totalLifecycleCost: { type: Number, default: 0, min: 0 }
    },
    qrCode: {
      identifier: {
        type: String,
        required: [true, 'QR identifier is required'],
        unique: true
      },
      status: {
        type: String,
        enum: {
          values: QrStatus,
          message: '{VALUE} is not a valid QrStatus'
        },
        default: 'PENDING_ACTIVATION'
      },
      dataUrl: { type: String }
    },
    responsibleOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isAbandoned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'assets'
  }
);

// GeoJSON spatial index
assetSchema.index({ location: '2dsphere' });
assetSchema.index({ departmentId: 1, status: 1 });
assetSchema.index({ 'condition.score': 1 });
assetSchema.index({ 'condition.nextInspectionDue': 1 });

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
