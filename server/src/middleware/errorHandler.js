/**
 * Centralized Error Handling Middleware for IAMS Backend
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`
    }
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal server error occurred.';
  let details = err.details || null;

  // Handle Validation Errors (Mongoose or custom)
  if (err.name === 'ValidationError') {
    statusCode = err.statusCode || 400;
    errorCode = err.code || 'VALIDATION_ERROR';
    message = err.message || 'Validation failed for one or more fields.';
    if (err.errors && typeof err.errors === 'object') {
      details = Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {});
    } else {
      details = err.details || null;
    }
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_IDENTIFIER';
    message = `Invalid format for field '${err.path}': ${err.value}`;
    details = { field: err.path, value: err.value };
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `A resource with ${field} '${val}' already exists.`;
    details = { duplicateField: field, duplicateValue: val };
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Authentication token is invalid.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired. Please log in again.';
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {})
    }
  };

  // Only include stack trace in non-production environments if unexpected 500
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    response.error.stack = err.stack;
  }

  if (statusCode === 500) {
    console.error('[ServerError]', err);
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
