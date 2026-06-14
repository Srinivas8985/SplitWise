/**
 * JWT Authentication Middleware
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it using the centralized JWT utility, and attaches
 * the decoded payload ({ id, email }) to `req.user`.
 *
 * If the token is missing, invalid, or expired, returns 401.
 */

const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = { authenticate };
