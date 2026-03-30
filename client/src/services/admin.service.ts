
import type { NewsArticle, MatchResult, Prediction, UserRole } from '../types';
import apiClient from './apiClient';


// Minimal type definitions for simulation/admin types (replace with real fields as needed)
export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type SimulationLeaderboardEntry = {
  userId: string;
  name: string;
  totalPoints: number;
  [key: string]: any;
};

export type SimulationUser = {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
};

export type SimulationMatchResult = {
  matchId: string;
  team1Score: number;
  team2Score: number;
  [key: string]: any;
};

export const adminService = {
  // Matches & Results
    getAllMatchesWithResults: () => apiClient.get('/matches'),
  getPendingResults: () => apiClient.get('/admin/matches/pending-results'),
  getResult: (matchId: string) => apiClient.get<MatchResult>(`/admin/matches/${matchId}/result`),
  publishResult: (
    matchId: string,
    data: { team1Score: number; team2Score: number; team1PenaltyScore?: number; team2PenaltyScore?: number }
  ) => apiClient.post<MatchResult>(`/admin/matches/${matchId}/result`, data),
  updateResult: (
    matchId: string,
    data: { team1Score: number; team2Score: number; team1PenaltyScore?: number; team2PenaltyScore?: number }
  ) => apiClient.put<MatchResult>(`/admin/matches/${matchId}/result`, data),
  blockPredictions: (matchId: string) =>
    apiClient.post<{ matchId: string; lockedExistingPredictions: number; message: string }>(
      `/admin/matches/${matchId}/block-predictions`
    ),
  unblockPredictions: (matchId: string) =>
    apiClient.post<{ matchId: string; unlockedPredictions: number; message: string }>(
      `/admin/matches/${matchId}/unblock-predictions`
    ),

  // News
  createArticle: (data: Pick<NewsArticle, 'title' | 'content'>) =>
    apiClient.post<NewsArticle>('/admin/news', data),
  updateArticle: (id: string, data: Partial<Pick<NewsArticle, 'title' | 'content'>>) =>
    apiClient.put<NewsArticle>(`/admin/news/${id}`, data),
  deleteArticle: (id: string) => apiClient.delete(`/admin/news/${id}`),

  // Bracket
  configureRound16: (teams: string[]) => apiClient.post('/admin/bracket/round16', { teams }),
  configureQuarterfinals: (teams: string[]) => apiClient.post('/admin/bracket/quarterfinals', { teams }),
  configureSemifinals: (teams: string[]) => apiClient.post('/admin/bracket/semifinals', { teams }),
  generateRound32: () => apiClient.post<{ createdMatches: number; matchIds: string[] }>('/admin/bracket/generate-round32'),
  getBracketPhaseReadiness: () =>
    apiClient.get<{
      round32AutoEnabled: boolean;
      round16Editable: boolean;
      quarterfinalsEditable: boolean;
      semifinalsEditable: boolean;
    }>('/admin/bracket/phase-readiness'),

  // Users / Roles
  listUsers: (q?: string, limit: number = 30) =>
    apiClient.get<{ users: AdminUserListItem[] }>('/admin/users', { params: { q, limit } }),
  switchUser: (userId: string) =>
    apiClient.post<{ message: string; user: AdminUserListItem; accessToken: string }>(
      `/admin/users/switch/${userId}`
    ),
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
    apiClient.get<{ totalUsers: number; totalPredictions: number; completedMatches: number }>('/admin/stats'),

  // User Predictions
  getUserPredictions: (userId: string) =>
    apiClient.get<Prediction[]>(`/admin/users/${userId}/predictions`),

  // Simulation
  getSimulationStatus: () => apiClient.get('/admin/simulation/status'),
  generateSimulationUsers: (count: number) =>
    apiClient.post('/admin/simulation/generate-users', { count }),
  generateSimulationPredictions: () =>
    apiClient.post('/admin/simulation/generate-predictions'),
  generateSimulationGroupResults: () =>
    apiClient.post('/admin/simulation/generate-group-results'),
  recalculatePositions: () =>
    apiClient.post('/admin/simulation/recalculate-positions'),
  getSimulationLeaderboard: () =>
    apiClient.get<{ leaderboard: SimulationLeaderboardEntry[] }>('/admin/simulation/leaderboard'),
  getSimulationUsers: () =>
    apiClient.get<{ users: SimulationUser[] }>('/admin/simulation/users'),
  getSimulationResults: () =>
    apiClient.get<{ results: SimulationMatchResult[] }>('/admin/simulation/results'),
  clearSimulationData: () => apiClient.delete('/admin/simulation/clear'),
  resetAllData: () => apiClient.delete('/admin/simulation/reset-all'),

  // Access
  checkAccess: () =>
    apiClient.get<{ hasAccess: boolean; role: UserRole }>('/admin/check-access'),
};
