// ─── Auth / User ────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  registrationCompleted: boolean;
  paymentCompleted: boolean;
  registrationTimestamp: string | null;
  paymentTimestamp: string | null;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  code: string;
  groupStageGroup?: string | null;
  flagUrl?: string;
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'postponed';
export type MatchPhase = 'group' | 'elimination';
export type EliminationRound = 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL';

export interface TimeInfo {
  utcTime: string;
  localTime: string;
  offsetMinutes: number;
  abbreviation: string;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  scheduledTime: TimeInfo;
  lockdownTime: TimeInfo;
  predictionsBlocked?: boolean;
  status: MatchStatus;
  phase: MatchPhase;
  groupStageGroup?: string | null;
  eliminationRound?: EliminationRound | null;
  result?: MatchResult;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchResult {
  id: string;
  matchId: string;
  team1Score: number;
  team2Score: number;
  winnerId: string | null;
  isDraw: boolean;
  publishedTimestamp: string;
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export type PredictionStatus = 'pending' | 'locked' | 'completed';

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  predictedTeam1Score: number;
  predictedTeam2Score: number;
  predictedWinnerId: string | null;
  predictedDraw: boolean;
  submissionTimestamp: string;
  lockedTimestamp: string | null;
  pointsEarned: number | null;
  status?: PredictionStatus;
  match?: Match;
}

export interface SubmitPredictionDto {
  matchId: string;
  predictedTeam1Score: number;
  predictedTeam2Score: number;
  predictedWinnerId: string | null;
  predictedDraw: boolean;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export type LeaderboardPhase = 'all' | 'group' | 'elimination';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  totalPoints: number;
  groupStagePoints: number;
  eliminationPoints: number;
  registrationTimestamp: string;
}

// ─── Notifications (UI) ──────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

// ─── News ────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  publishedTimestamp: string;
  modifiedTimestamp: string | null;
  archived: boolean;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
