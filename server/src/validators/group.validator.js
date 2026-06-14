const { z } = require('zod');

const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100),
  description: z.string().trim().max(255).optional(),
});

const addMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

module.exports = { createGroupSchema, addMemberSchema };
