/**
 * Auth Controller — thin request handlers for auth endpoints.
 *
 * Each handler:
 * 1. Extracts validated data from req.body (already validated by Zod middleware)
 * 2. Calls the service layer
 * 3. Returns a standardized JSON response
 * 4. Passes errors to next() for the centralized error handler
 */

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/v1/auth/register
 * Creates a new user account and returns a JWT token.
 */
async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;
    const result = await authService.register({ fullName, email, password });

    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Authenticates a user and returns a JWT token.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 * Requires valid JWT (enforced by auth middleware).
 */
async function getMe(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe };
