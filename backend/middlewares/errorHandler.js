const config = require("../config/env");

/**
 * Centralized Error Handling Middleware
 * Guarantees standard JSON structure: { success: false, message, errors?, stack? }
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || "Internal Server Error";
  let errors = err.errors || undefined;

  // Handle Mongoose CastError (bad ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for parameter: ${err.path}`;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "record";
    message = `A ${field} with this value already exists.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token. Please log in again.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired. Please refresh your session.";
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(!config.isProduction && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
