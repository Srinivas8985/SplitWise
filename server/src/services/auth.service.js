/**
 * Auth Service — business logic for registration, login, and user lookup.
 *
 * Responsibilities:
 * - Hash passwords with bcrypt (cost factor 10)
 * - Check for duplicate emails
 * - Validate credentials on login
 * - Generate JWT tokens
 * - Fetch current user profile
 *
 * This layer owns all Prisma calls for auth. Controllers never touch the DB directly.
 */

const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');
const { createError } = require('../utils/response');

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Register a new user.
 * @param {{ fullName: string, email: string, password: string }} data
 * @returns {{ user: object, token: string }}
 */
async function register({ fullName, email, password }) {
  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createError('Email is already registered', 409);
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Create the user
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
}

/**
 * Login with email and password.
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, token: string }}
 */
async function login({ email, password }) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Generate JWT
  const token = generateToken(user);

  // Return user without passwordHash
  const { passwordHash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Get current user by ID (from JWT payload).
 * @param {string} userId
 * @returns {object} user profile
 */
async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
}

module.exports = { register, login, getCurrentUser };
