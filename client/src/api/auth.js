/**
 * Auth API Service
 *
 * Maps to backend auth endpoints:
 * - POST /api/v1/auth/register → registerUser()
 * - POST /api/v1/auth/login    → loginUser()
 * - GET  /api/v1/auth/me       → getCurrentUser()
 */

import api from './axios';

export const registerUser = (data) =>
  api.post('/auth/register', data);

export const loginUser = (data) =>
  api.post('/auth/login', data);

export const getCurrentUser = () =>
  api.get('/auth/me');
