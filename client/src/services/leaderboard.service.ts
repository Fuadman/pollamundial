import apiClient from './apiClient';
import type { LeaderboardEntry, LeaderboardPhase } from '../types';

export const leaderboardService = {
  getLeaderboard: (phase?: LeaderboardPhase, page = 1, limit = 50) =>
    apiClient.get<{ data: LeaderboardEntry[]; total: number }>('/leaderboard', {
      params: { phase, page, limit },
    }),

  getUserEntry: (userId: string) =>
    apiClient.get<LeaderboardEntry>(`/leaderboard/user/${userId}`),
};
