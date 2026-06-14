/**
 * Balances API Service
 */

import api from './axios';

export const getDashboardBalances = () => api.get('/balances/dashboard');

export const getGroupBalances = (groupId) => api.get(`/groups/${groupId}/balances`);
