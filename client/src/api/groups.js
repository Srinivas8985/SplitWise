/**
 * Groups API Service
 */

import api from './axios';

export const getGroups = () => api.get('/groups');

export const getGroup = (groupId) => api.get(`/groups/${groupId}`);

export const createGroup = (data) => api.post('/groups', data);

export const deleteGroup = (groupId) => api.delete(`/groups/${groupId}`);

export const addMember = (groupId, email) => api.post(`/groups/${groupId}/members`, { email });

export const removeMember = (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`);

export const leaveGroup = (groupId) => api.post(`/groups/${groupId}/leave`);
