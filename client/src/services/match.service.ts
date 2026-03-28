import apiClient from './apiClient';
import type { Match, MatchPhase, MatchStatus } from '../types';

export interface MatchFilters {
  phase?: MatchPhase;
  status?: MatchStatus;
  group?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export const matchService = {
  getMatches: (filters?: MatchFilters) =>
    apiClient.get<Match[]>('/matches', { params: filters }),

  getMatch: (matchId: string, timezone?: string) =>
    apiClient.get<Match>(`/matches/${matchId}`, { params: { timezone } }),

  getGroupSchedule: () =>
    apiClient.get<Match[]>('/matches/schedule/group'),

  getEliminationSchedule: () =>
    apiClient.get<Match[]>('/matches/schedule/elimination'),
};
