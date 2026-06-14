/**
 * JWT Utility — sign and verify tokens.
 *
 * Payload includes { id, email } — minimal claims for auth middleware.
 * Token expires in 7 days (sufficient for MVP demo usage).
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a JWT token for a user.
 * @param {{ id: string, email: string }} user
 * @returns {string} signed JWT
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {{ id: string, email: string }} decoded payload
 * @throws {JsonWebTokenError} if invalid or expired
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
