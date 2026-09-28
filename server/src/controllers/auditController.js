const AuditLog = require('../models/AuditLog');
const { verifyChain } = require('../services/auditService');

/**
 * Query audit ledger
 * GET /api/v1/audit
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { entityName, entityId, action, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (entityName) filter.entityName = entityName;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = action;

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filter.timestamp.$lte = new Date(dateTo);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedById', 'name email role')
        .sort({ timestamp: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify cryptographic hash chain integrity
 * GET /api/v1/audit/verify
 */
const verifyLedgerIntegrity = async (req, res, next) => {
  try {
    const result = await verifyChain();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  verifyLedgerIntegrity
};
