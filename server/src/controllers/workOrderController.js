const crypto = require('crypto');
const WorkOrder = require('../models/WorkOrder');
const Asset = require('../models/Asset');
const { getConditionRating } = require('../services/conditionService');
const { recordEvent } = require('../services/auditService');

/**
 * List work orders with filters and pagination
 * GET /api/v1/work-orders
 */
const getWorkOrders = async (req, res, next) => {
  try {
    const { status, assetId, priority, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (assetId) filter.assetId = assetId;
    if (priority) filter.priority = priority;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));

    const [items, total] = await Promise.all([
      WorkOrder.find(filter)
        .populate('assetId', 'name assetTag category criticality status location departmentId')
        .populate('assignedContractorId', 'name email role')
        .populate('verifiedById', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(100, parseInt(limit, 10)))
        .lean(),
      WorkOrder.countDocuments(filter)
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
 * Create a new work order (Manual or from Inspection)
 * POST /api/v1/work-orders
 */
const createWorkOrder = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      assetId,
      inspectionId,
      title,
      description,
      priority = 'HIGH',
      assignedContractorId,
      targetCompletionDate,
      estimatedCostInr = 0
    } = req.body;

    if (!assetId || !title || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUIRED_FIELDS_MISSING', message: 'assetId, title, and description are required' }
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${assetId} not found` }
      });
    }

    const workOrderNumber = `WO-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const targetDate = targetCompletionDate ? new Date(targetCompletionDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const initialStatus = assignedContractorId ? 'ASSIGNED' : 'OPEN';

    const workOrder = new WorkOrder({
      workOrderNumber,
      assetId: asset._id,
      inspectionId: inspectionId || null,
      title,
      description,
      priority,
      status: initialStatus,
      assignedContractorId: assignedContractorId || null,
      targetCompletionDate: targetDate,
      preMaintenanceAssetStatus: asset.status,
      costBreakdown: {
        estimatedCostInr: Number(estimatedCostInr) || 0,
        laborCostInr: 0,
        partsCostInr: 0,
        totalApprovedCostInr: 0
      }
    });

    await workOrder.save();

    // Transition asset to UNDER_MAINTENANCE if it needs repair or is in service
    if (['NEEDS_REPAIR', 'OPERATIONAL'].includes(asset.status)) {
      asset.status = 'UNDER_MAINTENANCE';
      await asset.save();
    }

    // Audit Event
    await recordEvent({
      entityName: 'WORK_ORDER',
      entityId: workOrder._id,
      action: 'CREATE',
      performedById: user.id || user._id,
      performerRole: user.role,
      ipAddress: req.ip,
      delta: {
        workOrderNumber,
        assetTag: asset.assetTag,
        priority,
        status: initialStatus,
        assetStatus: asset.status
      },
      justification: `Work order dispatched: ${title}`
    });

    const populated = await WorkOrder.findById(workOrder._id)
      .populate('assetId', 'name assetTag category criticality status location departmentId')
      .populate('assignedContractorId', 'name email role');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update work order status & lifecycle progression
 * PATCH /api/v1/work-orders/:id/status
 */
const updateWorkOrderStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const {
      status: newStatus,
      assignedContractorId,
      resolutionNotes,
      actualCostInr,
      safetyClearanceVerified
    } = req.body;

    const workOrder = await WorkOrder.findById(id).populate('assetId');
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_NOT_FOUND', message: `Work order ${id} not found` }
      });
    }

    const prevStatus = workOrder.status;

    if (newStatus) {
      workOrder.status = newStatus;
    }

    if (assignedContractorId) {
      workOrder.assignedContractorId = assignedContractorId;
    }

    if (resolutionNotes) {
      workOrder.resolutionNotes = resolutionNotes;
    }

    if (actualCostInr !== undefined) {
      workOrder.costBreakdown.totalApprovedCostInr = Number(actualCostInr) || 0;
    }

    if (safetyClearanceVerified !== undefined) {
      workOrder.safetyClearanceVerified = !!safetyClearanceVerified;
    }

    // If verified or closed, set verifier and recover asset health!
    if (['VERIFIED', 'CLOSED'].includes(newStatus)) {
      workOrder.verifiedById = user.id || user._id;
      workOrder.actualCompletionDate = new Date();

      const asset = await Asset.findById(workOrder.assetId._id || workOrder.assetId);
      if (asset) {
        // Recovery logic: restore health score to healthy 85-90
        const restoredScore = Math.max(85, (asset.condition?.score || 40) + 40);
        const cappedScore = Math.min(restoredScore, 92);
        asset.condition.score = cappedScore;
        asset.condition.rating = getConditionRating(cappedScore);
        asset.status = 'OPERATIONAL';

        // Add repair cost to asset financials
        if (actualCostInr) {
          asset.financials = asset.financials || {};
          asset.financials.repairCost = (asset.financials.repairCost || 0) + Number(actualCostInr);
          asset.financials.totalLifecycleCost = (asset.financials.totalLifecycleCost || 0) + Number(actualCostInr);
        }

        await asset.save();
      }
    }

    await workOrder.save();

    // Audit Event
    await recordEvent({
      entityName: 'WORK_ORDER',
      entityId: workOrder._id,
      action: 'UPDATE',
      performedById: user.id || user._id,
      performerRole: user.role,
      ipAddress: req.ip,
      delta: {
        workOrderNumber: workOrder.workOrderNumber,
        fromStatus: prevStatus,
        toStatus: workOrder.status,
        resolutionNotes: workOrder.resolutionNotes
      },
      justification: `Work order transitioned from ${prevStatus} to ${workOrder.status}`
    });

    const populated = await WorkOrder.findById(workOrder._id)
      .populate('assetId', 'name assetTag category criticality status condition')
      .populate('assignedContractorId', 'name email role')
      .populate('verifiedById', 'name email role');

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrderStatus
};
