/**
 * Expenses API Service
 */

import api from './axios';

export const createExpense = (groupId, data) => api.post(`/groups/${groupId}/expenses`, data);

export const getGroupExpenses = (groupId) => api.get(`/groups/${groupId}/expenses`);

export const getExpense = (expenseId) => api.get(`/expenses/${expenseId}`);

export const deleteExpense = (expenseId) => api.delete(`/expenses/${expenseId}`);
