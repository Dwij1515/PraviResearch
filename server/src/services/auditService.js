const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Deterministic JSON stringifier to ensure consistent key ordering in hash calculation.
 */
const canonicalize = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalize).join(',')}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => `"${key}":${canonicalize(obj[key])}`);
  return `{${pairs.join(',')}}`;
};

/**
 * Calculates current SHA-256 hash using the previous hash and the event payload.
 */
const calculateHash = (previousHash, timestamp, entityId, action, delta) => {
  const timeStr = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const entityIdStr = entityId ? entityId.toString() : '';
  const deltaStr = canonicalize(delta || {});

  const dataPayload = `${previousHash}${timeStr}${entityIdStr}${action}${deltaStr}`;
  return crypto.createHash('sha256').update(dataPayload).digest('hex');
};

/**
 * Records an immutable, tamper-evident audit record chained to the previous record's hash.
 */
const recordEvent = async ({
  entityName,
  entityId,
  action,
  performedById = null,
  performerRole = null,
  ipAddress = '127.0.0.1',
  delta = {},
  justification = ''
}) => {
  try {
    // 1. Fetch latest audit log to obtain predecessor hash
    const latestRecord = await AuditLog.findOne().sort({ timestamp: -1, _id: -1 }).lean();
    const previousHash = latestRecord ? latestRecord.currentHash : GENESIS_HASH;

    const timestamp = new Date();
    const currentHash = calculateHash(previousHash, timestamp, entityId, action, delta);

    const auditEntry = new AuditLog({
      timestamp,
      entityName,
      entityId,
      action,
      performedById,
      performerRole,
      ipAddress,
      delta,
      justification,
      previousHash,
      currentHash
    });

    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('[AuditService] Failed to record audit event:', error.message);
    // Do not crash application on audit save failure in non-critical paths, but log prominently
    return null;
  }
};

/**
 * Walks the audit collection to verify cryptographic chain integrity.
 */
const verifyChain = async () => {
  const records = await AuditLog.find().sort({ timestamp: 1, _id: 1 }).lean();

  let previousHash = GENESIS_HASH;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (record.previousHash !== previousHash) {
      return {
        isValid: false,
        brokenIndex: i,
        recordId: record._id,
        expectedPreviousHash: previousHash,
        actualPreviousHash: record.previousHash
      };
    }

    const expectedCurrentHash = calculateHash(
      record.previousHash,
      record.timestamp,
      record.entityId,
      record.action,
      record.delta
    );

    if (record.currentHash !== expectedCurrentHash) {
      return {
        isValid: false,
        brokenIndex: i,
        recordId: record._id,
        expectedCurrentHash,
        actualCurrentHash: record.currentHash
      };
    }

    previousHash = record.currentHash;
  }

  return {
    isValid: true,
    totalRecords: records.length,
    message: 'Tamper-evident audit ledger is intact.'
  };
};

module.exports = {
  recordEvent,
  verifyChain,
  calculateHash,
  GENESIS_HASH
};
