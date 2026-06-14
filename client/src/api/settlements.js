/**
 * Settlements API Service
 */

import api from './axios';

export const createSettlement = (groupId, data) =>
  api.post(`/groups/${groupId}/settlements`, data);

export const getGroupSettlements = (groupId) =>
  api.get(`/groups/${groupId}/settlements`);
