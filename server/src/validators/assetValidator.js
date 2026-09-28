/**
 * Municipal Infrastructure Asset Management System (IAMS)
 * Asset Input & Financial Validation Helper
 */

const { AssetCategory, Criticality } = require('../constants/enums');

class ValidationError extends Error {
  constructor(message, details = null, statusCode = 400, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates asset creation payload.
 */
const validateAssetCreate = (data) => {
  const { assetTag, name, category, departmentId, location, financials, condition } = data;

  if (!assetTag || typeof assetTag !== 'string' || assetTag.trim().length === 0) {
    throw new ValidationError('assetTag is required and must be a non-empty string.');
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Asset name is required.');
  }

  if (!category || !AssetCategory.includes(category)) {
    throw new ValidationError(
      `Invalid category '${category}'. Allowed categories: [${AssetCategory.join(', ')}]`
    );
  }

  if (!departmentId) {
    throw new ValidationError('departmentId is required.');
  }

  // Location validation (GeoJSON Point)
  if (!location || typeof location !== 'object') {
    throw new ValidationError('location object is required.');
  }

  if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    throw new ValidationError(
      'location.coordinates must be an array of two numbers: [longitude, latitude].'
    );
  }

  const [lng, lat] = location.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
    throw new ValidationError('Both longitude and latitude coordinates must be valid numbers.');
  }

  if (lng < -180 || lng > 180) {
    throw new ValidationError(`Longitude '${lng}' is out of geographic bounds [-180, 180].`);
  }

  if (lat < -90 || lat > 90) {
    throw new ValidationError(`Latitude '${lat}' is out of geographic bounds [-90, 90].`);
  }

  // Financial safety validation (Semantic HTTP 422 if negative)
  if (financials && typeof financials === 'object') {
    const monetaryFields = [
      'procurementCost',
      'installationCost',
      'maintenanceCost',
      'repairCost',
      'upgradeCost',
      'replacementCostEstimate',
      'salvageValue',
      'usefulLifeYears',
      'annualDepreciation',
      'currentBookValue',
      'totalLifecycleCost'
    ];

    for (const field of monetaryFields) {
      if (financials[field] !== undefined && financials[field] !== null) {
        const val = Number(financials[field]);
        if (isNaN(val) || val < 0) {
          throw new ValidationError(
            `Financial field '${field}' cannot be negative or invalid: ${financials[field]}`,
            { field, value: financials[field] },
            422,
            'NEGATIVE_FINANCIAL_VALUE'
          );
        }
      }
    }
  }

  // Condition validation
  if (condition && condition.score !== undefined) {
    const score = Number(condition.score);
    if (isNaN(score) || score < 0 || score > 100) {
      throw new ValidationError('condition.score must be a number between 0 and 100.');
    }
  }
};

/**
 * Validates asset update payload.
 */
const validateAssetUpdate = (data) => {
  // Direct status transition via PATCH /assets/:id is prohibited
  if (data.status !== undefined) {
    throw new ValidationError(
      'Direct updates to asset status are prohibited. Use PATCH /api/v1/assets/:id/lifecycle for state transitions.',
      { prohibitedField: 'status' },
      400,
      'DIRECT_STATUS_UPDATE_BLOCKED'
    );
  }

  // Location validation if supplied
  if (data.location && data.location.coordinates) {
    const [lng, lat] = data.location.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number' || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new ValidationError('Coordinates must be valid [longitude, latitude] within standard bounds.');
    }
  }

  // Financial validation if supplied
  if (data.financials && typeof data.financials === 'object') {
    for (const [key, val] of Object.entries(data.financials)) {
      if (val !== undefined && val !== null) {
        const num = Number(val);
        if (isNaN(num) || num < 0) {
          throw new ValidationError(
            `Financial field '${key}' cannot be negative: ${val}`,
            { field: key, value: val },
            422,
            'NEGATIVE_FINANCIAL_VALUE'
          );
        }
      }
    }
  }
};

module.exports = {
  validateAssetCreate,
  validateAssetUpdate,
  ValidationError
};
