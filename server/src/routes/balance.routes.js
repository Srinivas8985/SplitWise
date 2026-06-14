/**
 * Balance Routes
 *
 * GET /api/v1/balances/dashboard            → overall balances
 * GET /api/v1/groups/:groupId/balances      → group-level balances (mounted separately)
 */

const express = require('express');
const router = express.Router({ mergeParams: true });

const { getGroupBalances, getDashboardBalances } = require('../controllers/balance.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Dashboard-level route (mounted at /api/v1/balances)
router.get('/dashboard', getDashboardBalances);

// Group-level route (mounted at /api/v1/groups/:groupId/balances)
router.get('/', getGroupBalances);

module.exports = router;
