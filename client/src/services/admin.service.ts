import apiClient from './apiClient';
import type { NewsArticle, MatchResult, Prediction, UserRole } from '../types';

export const adminService = {
  checkAccess: () =>
    apiClient.get<{ hasAccess: boolean; role: UserRole }>('/admin/check-access'),

  // News
  createArticle: (data: Pick<NewsArticle, 'title' | 'content'>) =>
    apiClient.post<NewsArticle>('/admin/news', data),

  updateArticle: (id: string, data: Partial<Pick<NewsArticle, 'title' | 'content'>>) =>
    apiClient.put<NewsArticle>(`/admin/news/${id}`, data),

  deleteArticle: (id: string) =>
    apiClient.delete(`/admin/news/${id}`),

  // Results
  getPendingResults: () =>
    apiClient.get('/admin/matches/pending-results'),

  publishResult: (matchId: string, data: { team1Score: number; team2Score: number }) =>
    apiClient.post<MatchResult>(`/admin/matches/${matchId}/result`, data),

  getResult: (matchId: string) =>
    apiClient.get<MatchResult>(`/admin/matches/${matchId}/result`),

  updateResult: (matchId: string, data: { team1Score: number; team2Score: number }) =>
    apiClient.put<MatchResult>(`/admin/matches/${matchId}/result`, data),

  // Bracket
  configureRound16: (teams: string[]) =>
    apiClient.post('/admin/bracket/round16', { teams }),

  configureQuarterfinals: (teams: string[]) =>
    apiClient.post('/admin/bracket/quarterfinals', { teams }),

  configureSemifinals: (teams: string[]) =>
    apiClient.post('/admin/bracket/semifinals', { teams }),

  // Users / roles
  enrollUser: (data: { email: string; name: string }) =>
    apiClient.post<{ user: any }>('/admin/users/enroll', data),

  getUserRole: (userId: string) =>
    apiClient.get<{ userId: string; role: UserRole }>(`/admin/user/${userId}/role`),

  promoteUser: (userId: string) =>
    apiClient.post<{ success: boolean; message: string }>(`/admin/promote/${userId}`),

  demoteUser: (userId: string) =>
    apiClient.post<{ success: boolean; message: string }>(`/admin/demote/${userId}`),

  // Stats
  getStats: () =>
    apiClient.get<{
      totalUsers: number;
      totalPredictions: number;
      completedMatches: number;
    }>('/admin/stats'),

  // User predictions
  getUserPredictions: (userId: string) =>
    apiClient.get<Prediction[]>(`/admin/users/${userId}/predictions`),

  // Simulation
  getSimulationStatus: () =>
    apiClient.get('/admin/simulation/status'),

  generateSimulationUsers: (count: number) =>
    apiClient.post('/admin/simulation/generate-users', { count }),

  generateSimulationPredictions: () =>
    apiClient.post('/admin/simulation/generate-predictions'),

  getSimulationLeaderboard: () =>
    apiClient.get('/admin/simulation/leaderboard'),

  clearSimulationData: () =>
    apiClient.delete('/admin/simulation/clear'),
};
