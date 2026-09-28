const crypto = require('crypto');
const Asset = require('../models/Asset');
const Department = require('../models/Department');
const User = require('../models/User');
const LifecycleEvent = require('../models/LifecycleEvent');
const { getConditionRating } = require('../services/conditionService');
const { transitionAssetLifecycle } = require('../services/assetLifecycleService');
const { recordEvent } = require('../services/auditService');
const { applyDepartmentScope } = require('../middleware/scope');
const { validateAssetCreate, validateAssetUpdate } = require('../validators/assetValidator');

/**
 * Generate unique, non-sequential, non-guessable QR identifier.
 * Format: IAMS-<random-hex>
 */
const generateQrIdentifier = () => {
  return `IAMS-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
};

/**
 * Register a new municipal asset
 * POST /api/v1/assets
 */
const createAsset = async (req, res, next) => {
  try {
    const user = req.user;
    const data = { ...req.body };

    // Enforce department boundary for non-ADMIN users
    if (user.role !== 'ADMIN') {
      data.departmentId = user.departmentId;
    }

    // Run semantic validation
    validateAssetCreate(data);

    // Verify department exists
    const department = await Department.findById(data.departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: `Department with ID '${data.departmentId}' does not exist.`
        }
      });
    }

    // Check unique assetTag
    const normalizedTag = data.assetTag.toUpperCase().trim();
    const existing = await Asset.findOne({ assetTag: normalizedTag });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ASSET_TAG',
          message: `An asset with tag '${normalizedTag}' already exists in the municipal ledger.`,
          details: { duplicateTag: normalizedTag }
        }
      });
    }

    // Ensure responsible officer belongs to department if provided
    if (data.responsibleOfficerId) {
      const officer = await User.findById(data.responsibleOfficerId);
      if (!officer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'OFFICER_NOT_FOUND',
            message: `Responsible officer '${data.responsibleOfficerId}' does not exist.`
          }
        });
      }
    }

    // Set QR code foundation
    const qrIdentifier = generateQrIdentifier();
    const initialConditionScore = data.condition && data.condition.score !== undefined ? Number(data.condition.score) : 100;
    const conditionRating = getConditionRating(initialConditionScore);

    const asset = new Asset({
      ...data,
      assetTag: normalizedTag,
      status: 'PLANNING', // Default initial status
      isAbandoned: false,
      condition: {
        score: initialConditionScore,
        rating: conditionRating,
        lastInspectedAt: data.condition?.lastInspectedAt || null,
        nextInspectionDue: data.condition?.nextInspectionDue || null
      },
      qrCode: {
        identifier: qrIdentifier,
        status: 'PENDING_ACTIVATION',
        dataUrl: data.qrCode?.dataUrl || ''
      }
    });

    await asset.save();

    // Create AuditLog
    await recordEvent({
      entityName: 'ASSET',
      entityId: asset._id,
      action: 'CREATE',
      performedById: user.id,
      performerRole: user.role,
      ipAddress: req.ip,
      delta: {
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        departmentId: asset.departmentId,
        status: asset.status
      },
      justification: `Asset registered by ${user.role} (${user.email})`
    });

    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List assets with filters, search, sorting and pagination
 * GET /api/v1/assets
 */
const getAssets = async (req, res, next) => {
  try {
    const {
      status,
      category,
      criticality,
      conditionRating,
      departmentId,
      isAbandoned,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const baseFilter = {};

    // Do not show abandoned assets by default unless explicitly asked
    if (isAbandoned !== undefined) {
      baseFilter.isAbandoned = isAbandoned === 'true';
    } else {
      baseFilter.isAbandoned = false;
    }

    if (status) baseFilter.status = status;
    if (category) baseFilter.category = category;
    if (criticality) baseFilter.criticality = criticality;
    if (conditionRating) baseFilter['condition.rating'] = conditionRating;

    // Apply Departmental Scoping
    // If user is scoped (Director/Manager/Inspector), applyDepartmentScope forces their department
    let scopedFilter = applyDepartmentScope(req, baseFilter);

    // If ADMIN requested specific departmentId, allow it
    if (req.user.role === 'ADMIN' && departmentId) {
      scopedFilter.departmentId = departmentId;
    }

    // Search query support
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      scopedFilter.$or = [
        { assetTag: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { 'location.address': { $regex: term, $options: 'i' } },
        { 'location.ward': { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'assetTag', 'condition.score', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Asset.find(scopedFilter)
        .populate('departmentId', 'name code zone annualBudgetInr')
        .populate('responsibleOfficerId', 'name email role phone')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Asset.countDocuments(scopedFilter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get complete Asset Passport
 * GET /api/v1/assets/:id
 */
const getAssetById = async (req, res, next) => {
  try {
    const user = req.user;

    // Contractors do not have general asset view rights in Phase 2
    if (user.role === 'CONTRACTOR') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Contractors cannot access general asset passport details without an assigned work order.'
        }
      });
    }

    const asset = await Asset.findById(req.params.id)
      .populate('departmentId', 'name code zone annualBudgetInr')
      .populate('responsibleOfficerId', 'name email role phone');

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: `Asset '${req.params.id}' was not found.`
        }
      });
    }

    // Check departmental access for non-ADMIN / non-AUDITOR
    if (!['ADMIN', 'AUDITOR'].includes(user.role)) {
      const userDept = user.departmentId ? user.departmentId.toString() : null;
      const assetDept = asset.departmentId ? asset.departmentId._id.toString() : null;
      if (!userDept || userDept !== assetDept) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'DEPARTMENT_ACCESS_DENIED',
            message: 'Access denied: You cannot view assets belonging to another department.'
          }
        });
      }
    }

    // Fetch recent lifecycle history
    const lifecycleHistory = await LifecycleEvent.find({ assetId: asset._id })
      .populate('triggeredById', 'name email role')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...asset.toObject(),
        lifecycleHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update asset metadata
 * PATCH /api/v1/assets/:id
 */
const updateAsset = async (req, res, next) => {
  try {
    const user = req.user;
    const updates = { ...req.body };

    // Validate update payload (blocks direct status mutation)
    validateAssetUpdate(updates);

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: `Asset '${req.params.id}' was not found.`
        }
      });
    }

    // Department boundary check
    if (user.role !== 'ADMIN') {
      const userDept = user.departmentId ? user.departmentId.toString() : null;
      const assetDept = asset.departmentId ? asset.departmentId.toString() : null;
      if (!userDept || userDept !== assetDept) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'DEPARTMENT_ACCESS_DENIED',
            message: 'Access denied: You cannot edit assets outside your assigned department.'
          }
        });
      }
    }

    const previousSnapshot = asset.toObject();

    // Recompute condition rating if score updated
    if (updates.condition && updates.condition.score !== undefined) {
      updates.condition.rating = getConditionRating(updates.condition.score);
    }

    // Prevent changing immutable identifiers
    delete updates.assetTag;
    delete updates.qrCode;

    Object.assign(asset, updates);
    await asset.save();

    // Record AuditLog
    await recordEvent({
      entityName: 'ASSET',
      entityId: asset._id,
      action: 'UPDATE',
      performedById: user.id,
      performerRole: user.role,
      ipAddress: req.ip,
      delta: {
        before: previousSnapshot,
        after: asset.toObject()
      },
      justification: `Asset metadata updated by ${user.role} (${user.email})`
    });

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive / Deactivate asset (Soft delete)
 * DELETE /api/v1/assets/:id
 */
const deleteAsset = async (req, res, next) => {
  try {
    const user = req.user;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: `Asset '${req.params.id}' was not found.`
        }
      });
    }

    // Department boundary check
    if (user.role !== 'ADMIN') {
      const userDept = user.departmentId ? user.departmentId.toString() : null;
      const assetDept = asset.departmentId ? asset.departmentId.toString() : null;
      if (!userDept || userDept !== assetDept) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'DEPARTMENT_ACCESS_DENIED',
            message: 'Access denied: You cannot archive assets outside your assigned department.'
          }
        });
      }
    }

    // Set isAbandoned = true; NEVER physically delete
    asset.isAbandoned = true;
    await asset.save();

    // Record ARCHIVE_ATTEMPT audit event
    await recordEvent({
      entityName: 'ASSET',
      entityId: asset._id,
      action: 'ARCHIVE_ATTEMPT',
      performedById: user.id,
      performerRole: user.role,
      ipAddress: req.ip,
      delta: { isAbandoned: true },
      justification: `Asset archived / deactivated by ${user.role} (${user.email})`
    });

    res.status(200).json({
      success: true,
      message: 'Asset successfully archived / deactivated.',
      data: {
        id: asset._id,
        assetTag: asset.assetTag,
        isAbandoned: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Transition asset lifecycle state
 * PATCH /api/v1/assets/:id/lifecycle
 */
const transitionLifecycle = async (req, res, next) => {
  try {
    const { toState, reason, evidenceDocumentUrls } = req.body;

    const result = await transitionAssetLifecycle({
      assetId: req.params.id,
      toState,
      reason,
      evidenceDocumentUrls,
      user: req.user,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Asset summary & aggregation for future dashboard
 * GET /api/v1/assets/summary
 */
const getAssetSummary = async (req, res, next) => {
  try {
    const baseFilter = { isAbandoned: false };
    const scopedFilter = applyDepartmentScope(req, baseFilter);

    const now = new Date();

    const [statusCounts, conditionCounts, totalAssets, overdueInspectionCount] = await Promise.all([
      Asset.aggregate([
        { $match: scopedFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Asset.aggregate([
        { $match: scopedFilter },
        { $group: { _id: '$condition.rating', count: { $sum: 1 } } }
      ]),
      Asset.countDocuments(scopedFilter),
      Asset.countDocuments({
        ...scopedFilter,
        'condition.nextInspectionDue': { $lt: now }
      })
    ]);

    const statusMap = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const conditionMap = conditionCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Critical assets: condition.score < 40 or status OUT_OF_SERVICE
    const criticalAssets = await Asset.countDocuments({
      ...scopedFilter,
      $or: [{ 'condition.score': { $lt: 40 } }, { status: 'OUT_OF_SERVICE' }]
    });

    res.status(200).json({
      success: true,
      data: {
        totalAssets,
        operationalAssets: statusMap['OPERATIONAL'] || 0,
        underInspection: statusMap['UNDER_INSPECTION'] || 0,
        needsRepair: statusMap['NEEDS_REPAIR'] || 0,
        underMaintenance: statusMap['UNDER_MAINTENANCE'] || 0,
        outOfService: statusMap['OUT_OF_SERVICE'] || 0,
        decommissioned: statusMap['DECOMMISSIONED'] || 0,
        disposed: statusMap['DISPOSED'] || 0,
        criticalAssets,
        overdueInspectionCount,
        conditionDistribution: {
          EXCELLENT: conditionMap['EXCELLENT'] || 0,
          GOOD: conditionMap['GOOD'] || 0,
          FAIR: conditionMap['FAIR'] || 0,
          POOR: conditionMap['POOR'] || 0,
          CRITICAL: conditionMap['CRITICAL'] || 0
        },
        statusDistribution: statusMap
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * QR Code Resolver Endpoint (Public / Field Safe)
 * GET /api/v1/assets/qr/:qrIdentifier
 */
const getAssetByQr = async (req, res, next) => {
  try {
    const { qrIdentifier } = req.params;
    const normalizedQr = qrIdentifier.trim().toUpperCase();

    const asset = await Asset.findOne({ 'qrCode.identifier': normalizedQr })
      .populate('departmentId', 'name code zone')
      .populate('responsibleOfficerId', 'name email role')
      .lean();

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QR_NOT_FOUND',
          message: `No municipal asset found registered with QR identifier '${normalizedQr}'.`
        }
      });
    }

    const qrStatus = asset.qrCode?.status || 'PENDING_ACTIVATION';
    const isFieldActive = qrStatus === 'ACTIVE';

    res.status(200).json({
      success: true,
      data: {
        qrStatus,
        fieldActive: isFieldActive,
        message: isFieldActive
          ? 'Asset Field-Active'
          : 'Asset Under Commissioning / Not Field-Active',
        asset: {
          id: asset._id,
          assetTag: asset.assetTag,
          name: asset.name,
          category: asset.category,
          subType: asset.subType,
          status: asset.status,
          criticality: asset.criticality,
          condition: asset.condition,
          department: asset.departmentId,
          location: asset.location,
          responsibleOfficer: asset.responsibleOfficerId,
          qrCode: asset.qrCode
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  getAssetByQr,
  updateAsset,
  deleteAsset,
  transitionLifecycle,
  getAssetSummary
};

