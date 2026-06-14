/**
 * Balance Controller
 *
 * GET /api/v1/groups/:groupId/balances — pairwise debts within a group
 * GET /api/v1/balances/dashboard       — overall balances across all groups
 */

const balanceService = require('../services/balance.service');
const { sendSuccess } = require('../utils/response');

async function getGroupBalances(req, res, next) {
  try {
    const data = await balanceService.getGroupBalances(req.params.groupId, req.user.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

async function getDashboardBalances(req, res, next) {
  try {
    const data = await balanceService.getDashboardBalances(req.user.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getGroupBalances, getDashboardBalances };
