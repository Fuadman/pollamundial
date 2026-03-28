import apiClient from './apiClient';
import type { User } from '../types';

export const authService = {
  getSession: () =>
    apiClient.get<{ user: User; token: string }>('/auth/session'),

  register: (data: { name: string; userId: string; email: string }) =>
    apiClient.post<User>('/auth/register', data),

  processPayment: (data: { paymentToken: string }) =>
    apiClient.post<{ success: boolean }>('/auth/payment', data),

  logout: () =>
    apiClient.post('/auth/logout'),

  refreshToken: () =>
    apiClient.post<{ token: string }>('/auth/refresh'),

  verifyDeadline: () =>
    apiClient.get<{ open: boolean; deadline: string }>('/auth/verify-deadline'),

  registrationStatus: () =>
    apiClient.get<{ registrationCompleted: boolean; paymentCompleted: boolean }>(
      '/auth/registration-status',
    ),
};
