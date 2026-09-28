const Asset = require('../models/Asset');
const AIInsight = require('../models/AIInsight');

/**
 * Deterministic Explainable Risk Calculation (PADI)
 */
const calculateAssetRisk = (asset) => {
  const score = asset.condition?.score !== undefined ? asset.condition.score : 80;
  const isOverdue = asset.condition?.nextInspectionDue && new Date(asset.condition.nextInspectionDue) < new Date();
  const criticality = asset.criticality || 'MEDIUM';
  const status = asset.status || 'OPERATIONAL';

  // 1. Condition deficit factor (0-40)
  const conditionDeficit = Math.round((100 - score) * 0.4);

  // 2. Criticality factor (0-30)
  const critMap = { CRITICAL: 30, HIGH: 20, MEDIUM: 10, LOW: 5 };
  const critFactor = critMap[criticality] || 10;

  // 3. Overdue inspection factor (0-15)
  const overdueFactor = isOverdue ? 15 : 0;

  // 4. Operational status factor (0-15)
  const statusMap = {
    OUT_OF_SERVICE: 15,
    NEEDS_REPAIR: 12,
    UNDER_MAINTENANCE: 8,
    UNDER_INSPECTION: 5,
    OPERATIONAL: 0
  };
  const statusFactor = statusMap[status] !== undefined ? statusMap[status] : 0;

  const totalRiskScore = Math.min(100, Math.max(5, conditionDeficit + critFactor + overdueFactor + statusFactor));

  // Determine Risk Tier
  let riskTier = 'LOW';
  if (totalRiskScore >= 70) riskTier = 'CRITICAL';
  else if (totalRiskScore >= 50) riskTier = 'HIGH';
  else if (totalRiskScore >= 30) riskTier = 'MEDIUM';

  // Explainable drivers
  const drivers = [];
  if (score < 60) {
    drivers.push(`Structural health index degraded to ${score}/100`);
  } else {
    drivers.push(`Structural integrity evaluated at ${score}/100`);
  }

  if (criticality === 'CRITICAL' || criticality === 'HIGH') {
    drivers.push(`Classified as ${criticality} municipal asset priority`);
  }

  if (isOverdue) {
    drivers.push('Mandatory statutory inspection overdue');
  }

  if (['OUT_OF_SERVICE', 'NEEDS_REPAIR'].includes(status)) {
    drivers.push(`Active operational disruption: status is ${status.replace('_', ' ')}`);
  }

  // Actionable advisory recommendation
  let recommendationText = 'Continue routine municipal telemetry and quarterly surveillance.';
  if (totalRiskScore >= 70) {
    recommendationText = 'Immediate structural remediation and contractor work-order dispatch advised.';
  } else if (totalRiskScore >= 50) {
    recommendationText = 'Schedule priority engineering inspection and monitor vibration/wear telemetry.';
  } else if (isOverdue) {
    recommendationText = 'Schedule field inspection clearance to verify operational safety baseline.';
  }

  return {
    riskScore: totalRiskScore,
    riskTier,
    drivers,
    recommendationText,
    breakdown: {
      conditionDeficit,
      critFactor,
      overdueFactor,
      statusFactor
    }
  };
};

/**
 * List explainable AI risk assessments across assets
 * GET /api/v1/ai/insights
 */
const getAiInsights = async (req, res, next) => {
  try {
    const assets = await Asset.find({ isAbandoned: false })
      .populate('departmentId', 'name code')
      .sort({ 'condition.score': 1 })
      .lean();

    const assessments = assets.map((asset) => {
      const risk = calculateAssetRisk(asset);
      return {
        assetId: asset._id,
        name: asset.name,
        assetTag: asset.assetTag,
        category: asset.category,
        department: asset.departmentId?.name || 'AMC',
        location: asset.location?.ward || 'Ahmedabad',
        status: asset.status,
        conditionScore: asset.condition?.score || 0,
        conditionRating: asset.condition?.rating || 'UNRATED',
        criticality: asset.criticality,
        ...risk
      };
    });

    // Sort by highest risk score first
    assessments.sort((a, b) => b.riskScore - a.riskScore);

    res.status(200).json({
      success: true,
      data: {
        totalEvaluated: assessments.length,
        highRiskCount: assessments.filter((a) => a.riskScore >= 50).length,
        items: assessments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Persist AI evaluation for specific asset
 * POST /api/v1/ai/evaluate/:assetId
 */
const evaluateAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${assetId} not found` }
      });
    }

    const risk = calculateAssetRisk(asset);

    const insight = new AIInsight({
      assetId: asset._id,
      insightType: 'DETERIORATION_RISK',
      score: risk.riskScore,
      riskTier: risk.riskTier,
      drivers: risk.drivers,
      recommendationText: risk.recommendationText
    });

    await insight.save();

    res.status(200).json({
      success: true,
      data: {
        insight,
        evaluation: risk
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAiInsights,
  evaluateAsset
};
