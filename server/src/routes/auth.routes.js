/**
 * Auth Routes
 *
 * POST /api/v1/auth/register  → validate(registerSchema) → register controller
 * POST /api/v1/auth/login     → validate(loginSchema)    → login controller
 * GET  /api/v1/auth/me        → authenticate             → getMe controller
 *
 * Register and login are public routes (no JWT required).
 * The /me endpoint requires a valid JWT token.
 */

const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected route
router.get('/me', authenticate, getMe);

module.exports = router;
