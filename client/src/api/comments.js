import api from './axios';

export const getExpenseComments = (expenseId) =>
  api.get(`/expenses/${expenseId}/comments`);

export const addComment = (expenseId, message) =>
  api.post(`/expenses/${expenseId}/comments`, { message });
