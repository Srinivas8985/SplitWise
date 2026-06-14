/**
 * Settlement Controller
 *
 * POST /api/v1/groups/:groupId/settlements — record a settlement
 * GET  /api/v1/groups/:groupId/settlements — settlement history
 */

const settlementService = require('../services/settlement.service');
const { sendSuccess } = require('../utils/response');

async function createSettlement(req, res, next) {
  try {
    const settlement = await settlementService.createSettlement(
      req.params.groupId,
      req.user.id,
      req.body
    );
    sendSuccess(res, { settlement }, 201);
  } catch (error) {
    next(error);
  }
}

async function getGroupSettlements(req, res, next) {
  try {
    const settlements = await settlementService.getGroupSettlements(
      req.params.groupId,
      req.user.id
    );
    sendSuccess(res, { settlements });
  } catch (error) {
    next(error);
  }
}

module.exports = { createSettlement, getGroupSettlements };
