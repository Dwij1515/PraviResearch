const crypto = require('crypto');
const Inspection = require('../models/Inspection');
const Asset = require('../models/Asset');
const { getConditionRating } = require('../services/conditionService');
const { recordEvent } = require('../services/auditService');

/**
 * List inspections with filters and pagination
 * GET /api/v1/inspections
 */
const getInspections = async (req, res, next) => {
  try {
    const { assetId, status, conditionRating, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (assetId) filter.assetId = assetId;
    if (status) filter.status = status;
    if (conditionRating) filter.conditionRating = conditionRating;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));

    const [items, total] = await Promise.all([
      Inspection.find(filter)
        .populate('assetId', 'name assetTag category criticality status location departmentId')
        .populate('inspectorId', 'name email role')
        .populate('reviewedById', 'name email role')
        .sort({ performedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Math.min(100, parseInt(limit, 10)))
        .lean(),
      Inspection.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit field inspection
 * POST /api/v1/inspections
 */
const createInspection = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      assetId,
      overallConditionScore,
      findings,
      defects = [],
      type = 'ROUTINE',
      nextInspectionDue,
      recommendation
    } = req.body;

    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: { code: 'ASSET_REQUIRED', message: 'assetId is required' }
      });
    }

    const score = Number(overallConditionScore);
    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SCORE', message: 'overallConditionScore must be a number between 0 and 100' }
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${assetId} not found` }
      });
    }

    const conditionRating = getConditionRating(score);
    const inspectionNumber = `INS-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Canonical enum normalization
    const VALID_TYPES = ['ROUTINE_QUARTERLY', 'SAFETY_AUDIT', 'POST_MONSOON', 'SPECIAL_COMPLAINT'];
    const normalizedType = VALID_TYPES.includes(type)
      ? type
      : (type === 'ROUTINE' ? 'ROUTINE_QUARTERLY' : 'ROUTINE_QUARTERLY');

    const normalizeSeverity = (s) => {
      const upper = String(s || '').toUpperCase();
      if (['CRITICAL', 'SEVERE', 'HIGH', 'EMERGENCY'].includes(upper)) return 'SEVERE';
      if (['MAJOR', 'MODERATE', 'MEDIUM'].includes(upper)) return 'MODERATE';
      return 'MINOR';
    };

    // Format defects if supplied
    const formattedDefects = defects.map((d) => ({
      description: typeof d === 'string' ? d : d.description || 'Structural or functional defect',
      severity: normalizeSeverity(typeof d === 'object' && d.severity ? d.severity : (score < 40 ? 'SEVERE' : score < 60 ? 'MODERATE' : 'MINOR')),
      photoUrls: (typeof d === 'object' && Array.isArray(d.photoUrls)) ? d.photoUrls : [],
      recommendedAction: recommendation || (typeof d === 'object' ? d.recommendedAction : 'Remediation requested')
    }));

    const inspection = new Inspection({
      inspectionNumber,
      assetId: asset._id,
      inspectorId: user.id || user._id,
      performedDate: new Date(),
      type: normalizedType,
      overallConditionScore: score,
      conditionRating,
      defects: formattedDefects,
      status: 'SUBMITTED',
      reviewNotes: findings || recommendation || ''
    });

    await inspection.save();

    // Update Asset health condition
    asset.condition.score = score;
    asset.condition.rating = conditionRating;
    asset.condition.lastInspectedAt = new Date();
    if (nextInspectionDue) {
      asset.condition.nextInspectionDue = new Date(nextInspectionDue);
    }

    // Context-aware lifecycle progression if defects detected
    const hasDefects = formattedDefects.length > 0 || score < 60;
    if (hasDefects && ['OPERATIONAL', 'UNDER_INSPECTION'].includes(asset.status)) {
      asset.status = 'NEEDS_REPAIR';
    } else if (!hasDefects && asset.status === 'UNDER_INSPECTION') {
      asset.status = 'OPERATIONAL';
    }

    await asset.save();

    // Audit Event
    await recordEvent({
      entityName: 'INSPECTION',
      entityId: inspection._id,
      action: 'CREATE',
      performedById: user.id || user._id,
      performerRole: user.role,
      ipAddress: req.ip,
      delta: {
        inspectionNumber,
        assetTag: asset.assetTag,
        conditionScore: score,
        conditionRating,
        defectsCount: formattedDefects.length,
        assetStatus: asset.status
      },
      justification: `Inspection completed: score ${score} (${conditionRating})`
    });

    const populated = await Inspection.findById(inspection._id)
      .populate('assetId', 'name assetTag category criticality status location departmentId')
      .populate('inspectorId', 'name email role');

    res.status(201).json({
      success: true,
      data: {
        inspection: populated,
        asset: {
          id: asset._id,
          status: asset.status,
          condition: asset.condition
        },
        defectDetected: hasDefects
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInspections,
  createInspection
};
