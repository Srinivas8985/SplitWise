/**
 * Prisma Client Singleton
 *
 * Creates a single PrismaClient instance shared across the entire application.
 * This avoids the "too many connections" problem during development with nodemon
 * (which restarts the process frequently).
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
