/**
 * Settlement Routes
 *
 * Mounted at: /api/v1/groups/:groupId/settlements
 *
 * POST /  → validate(createSettlementSchema) → createSettlement
 * GET  /  → getGroupSettlements
 */

const express = require('express');
const router = express.Router({ mergeParams: true });

const { createSettlement, getGroupSettlements } = require('../controllers/settlement.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { createSettlementSchema } = require('../validators/settlement.validator');

router.use(authenticate);

router.post('/', validate(createSettlementSchema), createSettlement);
router.get('/', getGroupSettlements);

module.exports = router;
