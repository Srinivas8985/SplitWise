/**
 * Settlement Validators — Zod schemas
 *
 * Validation rules:
 * - paidToId: required, valid UUID
 * - amount: required, must be > 0
 *
 * Additional business rules enforced in service layer:
 * - Both users must be members of the group
 * - Cannot settle with yourself
 */

const { z } = require('zod');

const createSettlementSchema = z.object({
  paidToId: z
    .string({ required_error: 'Recipient user ID is required' })
    .uuid('Invalid recipient user ID'),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than 0'),
});

module.exports = { createSettlementSchema };
