const { z } = require('zod');

const expenseSplitSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().min(0).optional()
});

const createExpenseSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(255),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().datetime().optional(), // ISO string
  splitType: z.enum(['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE']),
  paidById: z.string().uuid('Invalid payer user ID'),
  notes: z.string().trim().optional(),
  splits: z.array(expenseSplitSchema).min(1, 'At least one participant is required')
});

module.exports = { createExpenseSchema };
