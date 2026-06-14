const express = require('express');
const router = express.Router({ mergeParams: true }); // Need mergeParams to access groupId if mounted under groups

const {
  createExpense,
  getGroupExpenses,
  getExpense,
  deleteExpense
} = require('../controllers/expense.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { createExpenseSchema } = require('../validators/expense.validator');

// All expense routes require authentication
router.use(authenticate);

// These routes expect to be mounted at /api/v1/groups/:groupId/expenses
router.post('/', validate(createExpenseSchema), createExpense);
router.get('/', getGroupExpenses);

// These routes expect to be mounted at /api/v1/expenses
router.get('/:expenseId', getExpense);
router.delete('/:expenseId', deleteExpense);

module.exports = router;
