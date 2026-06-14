/**
 * Standardized API Response Helpers
 */

const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

const sendError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Creates an error with a statusCode property for the error handler.
 */
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { sendSuccess, sendError, createError };
