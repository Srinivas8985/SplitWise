const expenseService = require('../services/expense.service');
const { sendSuccess } = require('../utils/response');

async function createExpense(req, res, next) {
  try {
    const expense = await expenseService.createExpense(req.params.groupId, req.user.id, req.body);
    sendSuccess(res, { expense }, 201);
  } catch (error) {
    next(error);
  }
}

async function getGroupExpenses(req, res, next) {
  try {
    const expenses = await expenseService.getGroupExpenses(req.params.groupId, req.user.id);
    sendSuccess(res, { expenses });
  } catch (error) {
    next(error);
  }
}

async function getExpense(req, res, next) {
  try {
    const expense = await expenseService.getExpenseById(req.params.expenseId, req.user.id);
    sendSuccess(res, { expense });
  } catch (error) {
    next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    await expenseService.deleteExpense(req.params.expenseId, req.user.id);
    sendSuccess(res, { message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpense,
  deleteExpense
};
