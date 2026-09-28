const mongoose = require('mongoose');
const { AIInsightType, RiskTier } = require('../constants/enums');

const aiInsightSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required']
    },
    insightType: {
      type: String,
      required: [true, 'Insight type is required'],
      enum: {
        values: AIInsightType,
        message: '{VALUE} is not a valid AIInsightType'
      }
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be less than 0'],
      max: [100, 'Score cannot exceed 100']
    },
    riskTier: {
      type: String,
      enum: {
        values: RiskTier,
        message: '{VALUE} is not a valid RiskTier'
      }
    },
    drivers: {
      type: [String],
      default: []
    },
    recommendationText: {
      type: String,
      default: ''
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    collection: 'ai_insights'
  }
);

aiInsightSchema.index({ assetId: 1, generatedAt: -1 });

const AIInsight = mongoose.model('AIInsight', aiInsightSchema);

module.exports = AIInsight;
