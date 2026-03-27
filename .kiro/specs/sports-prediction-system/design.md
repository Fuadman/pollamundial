# Design Document: Copa Mundial 2026 Sports Prediction System

## Overview

The Copa Mundial 2026 Sports Prediction System is a full-stack web application enabling users to predict match outcomes across 104 Copa Mundial 2026 matches (72 group stage + 32 elimination). The system manages the complete tournament lifecycle from group stage through finals, with real-time scoring, dynamic bracket configuration, and competitive leaderboards.

**Key Design Goals:**
- Support concurrent predictions from multiple users with sub-second lockdown enforcement
- Accurate multi-tier scoring (3/2/1 points) with no double-counting
- Real-time leaderboard updates and user dashboards
- Admin control over match results publication and bracket configuration
- Comprehensive testing/simulation capabilities with dummy data generation
- Timezone-aware operations (UTC for storage, user's local timezone for display)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Pages   │  │ User Pages   │  │ Admin Panel  │      │
│  │ (OAuth)      │  │ (Dashboard,  │  │ (Results,    │      │
│  │              │  │  Predictions)│  │  Bracket)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Redux Store (Redux Toolkit)                                │
│  ├── Auth Slice (user, token, session)                      │
│  ├── Predictions Slice (user predictions, status)           │
│  ├── Matches Slice (schedule, results)                      │
│  ├── Leaderboard Slice (rankings, scores)                   │
│  └── UI Slice (modals, notifications, filters)              │
│                                                              │
│  Socket.io Client (Real-time updates)                       │
└─────────────────────────────────────────────────────────────┘
                    ↓ (REST API + WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                  Backend (NestJS)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Module  │  │ Prediction   │  │ Scoring      │      │
│  │ (OAuth)      │  │ Module       │  │ Module       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Match Module │  │ Admin Module │  │ Leaderboard  │      │
│  │              │  │              │  │ Module       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bracket      │  │ Simulation   │  │ WebSocket    │      │
│  │ Module       │  │ Module       │  │ Gateway      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Pipes & Guards (Validation, Auth)                          │
│  Interceptors (Logging, Error Handling)                     │
│  Decorators (Custom validation, roles)                      │
└─────────────────────────────────────────────────────────────┘
                    ↓ (TypeORM + SQL)
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ Redis Cache  │  │ Message      │      │
│  │ (Primary DB) │  │ (Leaderboard)│  │ Queue (Bull) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript for type-safe UI
- Redux Toolkit for state management
- Redux Thunk for async actions
- React Router for navigation
- Socket.io client for real-time updates
- Axios for HTTP requests
- OAuth 2.0 client library for Google authentication
- Tailwind CSS or Material-UI for styling
- Jest and React Testing Library for testing

**Backend:**
- NestJS framework with TypeScript
- PostgreSQL for persistent data
- TypeORM for database ORM
- Redis for caching and real-time leaderboards
- Socket.io for real-time WebSocket updates
- Bull for job queues (score calculation)
- Passport.js for Google OAuth 2.0 authentication
- Class-validator for request validation
- Swagger/OpenAPI for API documentation

**External Services:**
- Google OAuth 2.0 for authentication
- Payment processor (Stripe/PayPal) for registration fees

## Components and Interfaces

### 1. Authentication Service

**Responsibilities:**
- Google OAuth 2.0 integration
- Session management
- User registration completion
- Payment verification

**Key Interfaces:**

```typescript
interface AuthService {
  initiateGoogleAuth(): Promise<AuthToken>;
  completeRegistration(userId: string, userDetails: UserDetails): Promise<User>;
  processPayment(userId: string, paymentInfo: PaymentInfo): Promise<PaymentResult>;
  verifyRegistrationDeadline(userId: string): Promise<boolean>;
  validateSession(token: string): Promise<User | null>;
}

interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  registrationCompleted: boolean;
  paymentCompleted: boolean;
  registrationTimestamp: Date;
  paymentTimestamp?: Date;
}
```

### 2. Prediction Service

**Responsibilities:**
- Prediction submission and validation
- Prediction editing with lockdown enforcement
- Prediction retrieval and history

**Key Interfaces:**

```typescript
interface PredictionService {
  submitPrediction(userId: string, matchId: string, prediction: Prediction): Promise<Prediction>;
  editPrediction(userId: string, predictionId: string, prediction: Prediction): Promise<Prediction>;
  getPrediction(userId: string, matchId: string): Promise<Prediction | null>;
  getUserPredictions(userId: string, filters?: PredictionFilters): Promise<Prediction[]>;
  checkLockdownStatus(matchId: string): Promise<boolean>;
  validatePrediction(prediction: Prediction, match: Match): Promise<ValidationResult>;
}

interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  predictedScore?: { team1: number; team2: number };
  predictedWinner?: string; // team ID or 'draw'
  submissionTimestamp: Date;
  lockedTimestamp?: Date;
  pointsEarned?: number;
}

interface PredictionFilters {
  phase?: 'group' | 'elimination';
  status?: 'pending' | 'locked' | 'completed';
  dateRange?: { start: Date; end: Date };
}
```

### 3. Scoring Engine

**Responsibilities:**
- Calculate points for each prediction based on match result
- Handle multi-tier scoring (3/2/1 points)
- Prevent double-counting
- Batch score calculations

**Key Interfaces:**

```typescript
interface ScoringEngine {
  calculateScore(prediction: Prediction, result: MatchResult): Promise<number>;
  calculateAllScores(matchId: string): Promise<ScoreUpdate[]>;
  validateScoringRules(prediction: Prediction, result: MatchResult): Promise<ScoringBreakdown>;
}

interface MatchResult {
  matchId: string;
  team1Score: number;
  team2Score: number;
  winner: string; // team ID or 'draw'
  publishedTimestamp: Date;
}

interface ScoringBreakdown {
  exactScore: boolean; // 3 points
  correctWinnerWithDifference: boolean; // 2 points
  correctWinnerOrDraw: boolean; // 1 point
  totalPoints: number;
  advancement?: boolean; // 1 point for elimination
}
```

### 4. Match Service

**Responsibilities:**
- Match scheduling and management
- Match status tracking
- Real-time score updates
- Match result publication

**Key Interfaces:**

```typescript
interface MatchService {
  getMatch(matchId: string): Promise<Match>;
  getMatches(filters?: MatchFilters): Promise<Match[]>;
  publishResult(matchId: string, result: MatchResult): Promise<void>;
  updateMatchStatus(matchId: string, status: MatchStatus): Promise<void>;
  getMatchesByPhase(phase: 'group' | 'elimination'): Promise<Match[]>;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  scheduledTime: Date; // UTC
  lockdownTime: Date; // 15 minutes before scheduled
  status: MatchStatus;
  result?: MatchResult;
  phase: 'group' | 'elimination';
  group?: string; // for group stage
  round?: string; // for elimination (R16, QF, SF, etc)
}

type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'postponed';

interface MatchFilters {
  phase?: 'group' | 'elimination';
  status?: MatchStatus;
  dateRange?: { start: Date; end: Date };
  group?: string;
}
```

### 5. Bracket Service

**Responsibilities:**
- Dynamic elimination bracket configuration
- Team advancement tracking
- Bracket validation

**Key Interfaces:**

```typescript
interface BracketService {
  configureRound16(teams: Team[]): Promise<Match[]>;
  configureQuarterfinals(advancedTeams: Team[]): Promise<Match[]>;
  configureSemifinals(advancedTeams: Team[]): Promise<Match[]>;
  configureFinal(finalists: Team[]): Promise<Match>;
  validateBracketConfiguration(teams: Team[], round: string): Promise<boolean>;
}
```

### 6. Leaderboard Service

**Responsibilities:**
- Real-time leaderboard calculation and caching
- User ranking and score aggregation
- Leaderboard filtering and sorting

**Key Interfaces:**

```typescript
interface LeaderboardService {
  getLeaderboard(filters?: LeaderboardFilters): Promise<LeaderboardEntry[]>;
  getUserRank(userId: string): Promise<number>;
  updateUserScore(userId: string, pointsEarned: number): Promise<void>;
  recalculateLeaderboard(): Promise<void>;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalPoints: number;
  registrationTimestamp: Date;
  phase?: 'group' | 'elimination' | 'all';
}

interface LeaderboardFilters {
  phase?: 'group' | 'elimination' | 'all';
  limit?: number;
  offset?: number;
}
```

### 7. Admin Service

**Responsibilities:**
- News management
- Match result entry
- User prediction viewing
- System configuration

**Key Interfaces:**

```typescript
interface AdminService {
  publishNews(article: NewsArticle): Promise<NewsArticle>;
  editNews(articleId: string, updates: Partial<NewsArticle>): Promise<NewsArticle>;
  deleteNews(articleId: string): Promise<void>;
  getUserPredictions(userId: string): Promise<Prediction[]>;
  getSystemStats(): Promise<SystemStats>;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  publishedTimestamp: Date;
  modifiedTimestamp?: Date;
  archived: boolean;
}

interface SystemStats {
  totalUsers: number;
  registeredUsers: number;
  totalPredictions: number;
  completedMatches: number;
  averagePointsPerUser: number;
}
```

### 8. Simulation Service

**Responsibilities:**
- Dummy data generation
- Test scenario execution
- Simulation reporting

**Key Interfaces:**

```typescript
interface SimulationService {
  generateDummyUsers(count: number): Promise<User[]>;
  generateDummyPredictions(userIds: string[], matchIds: string[]): Promise<Prediction[]>;
  generateDummyResults(matchIds: string[]): Promise<MatchResult[]>;
  clearSimulationData(): Promise<void>;
  getSimulationReport(): Promise<SimulationReport>;
}

interface SimulationReport {
  usersCreated: number;
  predictionsGenerated: number;
  resultsGenerated: number;
  scoreDistribution: { [points: number]: number };
  leaderboardSnapshot: LeaderboardEntry[];
}
```

## Data Models

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  registration_completed BOOLEAN DEFAULT FALSE,
  payment_completed BOOLEAN DEFAULT FALSE,
  registration_timestamp TIMESTAMP,
  payment_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(3) UNIQUE NOT NULL,
  group_stage_group VARCHAR(1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  team1_id UUID NOT NULL REFERENCES teams(id),
  team2_id UUID NOT NULL REFERENCES teams(id),
  scheduled_time TIMESTAMP NOT NULL,
  lockdown_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  phase VARCHAR(50) NOT NULL, -- 'group' or 'elimination'
  group_stage_group VARCHAR(1),
  elimination_round VARCHAR(50), -- 'R16', 'QF', 'SF', 'THIRD', 'FINAL'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scheduled_time (scheduled_time),
  INDEX idx_status (status),
  INDEX idx_phase (phase)
);

-- Match Results table
CREATE TABLE match_results (
  id UUID PRIMARY KEY,
  match_id UUID NOT NULL UNIQUE REFERENCES matches(id),
  team1_score INT NOT NULL,
  team2_score INT NOT NULL,
  winner_id UUID REFERENCES teams(id),
  is_draw BOOLEAN DEFAULT FALSE,
  published_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_id UUID NOT NULL REFERENCES matches(id),
  predicted_team1_score INT,
  predicted_team2_score INT,
  predicted_winner_id UUID REFERENCES teams(id),
  predicted_draw BOOLEAN DEFAULT FALSE,
  submission_timestamp TIMESTAMP NOT NULL,
  locked_timestamp TIMESTAMP,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id),
  INDEX idx_user_id (user_id),
  INDEX idx_match_id (match_id),
  INDEX idx_locked_timestamp (locked_timestamp)
);

-- User Scores table
CREATE TABLE user_scores (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  total_points INT DEFAULT 0,
  group_stage_points INT DEFAULT 0,
  elimination_points INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_total_points (total_points)
);

-- News Articles table
CREATE TABLE news_articles (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published_timestamp TIMESTAMP NOT NULL,
  modified_timestamp TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simulation Data Flag table
CREATE TABLE simulation_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  prediction_id UUID REFERENCES predictions(id),
  match_result_id UUID REFERENCES match_results(id),
  is_test_data BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Redis Cache Schema

```
-- Leaderboard (sorted set)
leaderboard:all -> {userId: totalPoints}
leaderboard:group -> {userId: groupPoints}
leaderboard:elimination -> {userId: eliminationPoints}

-- User scores (hash)
user:scores:{userId} -> {totalPoints, groupPoints, eliminationPoints}

-- Match lockdown status (set)
match:locked:{matchId} -> boolean

-- Real-time scores (hash)
match:scores:{matchId} -> {team1Score, team2Score, status}

-- Session cache (string)
session:{token} -> {userId, expiresAt}
```



## API Endpoints

### Authentication Endpoints

```
POST /api/auth/google
  Request: { code: string }
  Response: { token: string, user: User, requiresRegistration: boolean }
  
POST /api/auth/register
  Request: { userId: string, userDetails: UserDetails }
  Response: { user: User, paymentRequired: boolean }
  
POST /api/auth/payment
  Request: { userId: string, paymentInfo: PaymentInfo }
  Response: { success: boolean, user: User }
  
GET /api/auth/session
  Response: { user: User | null }
  
POST /api/auth/logout
  Response: { success: boolean }
```

### Prediction Endpoints

```
POST /api/predictions
  Request: { matchId: string, prediction: Prediction }
  Response: { prediction: Prediction }
  
GET /api/predictions/:matchId
  Response: { prediction: Prediction | null }
  
PUT /api/predictions/:predictionId
  Request: { prediction: Prediction }
  Response: { prediction: Prediction }
  
GET /api/predictions/user/:userId
  Query: { phase?: string, status?: string, dateRange?: string }
  Response: { predictions: Prediction[] }
  
GET /api/predictions/match/:matchId/all
  Response: { predictions: Prediction[] }
```

### Match Endpoints

```
GET /api/matches
  Query: { phase?: string, status?: string, group?: string }
  Response: { matches: Match[] }
  
GET /api/matches/:matchId
  Response: { match: Match }
  
POST /api/matches/:matchId/result
  Request: { result: MatchResult }
  Response: { match: Match, scoresUpdated: number }
  
GET /api/matches/schedule/group
  Response: { matches: Match[] }
  
GET /api/matches/schedule/elimination
  Response: { matches: Match[] }
```

### Leaderboard Endpoints

```
GET /api/leaderboard
  Query: { phase?: string, limit?: number, offset?: number }
  Response: { entries: LeaderboardEntry[], userRank: number }
  
GET /api/leaderboard/user/:userId
  Response: { entry: LeaderboardEntry, rank: number }
```

### Admin Endpoints

```
POST /api/admin/news
  Request: { article: NewsArticle }
  Response: { article: NewsArticle }
  
PUT /api/admin/news/:articleId
  Request: { updates: Partial<NewsArticle> }
  Response: { article: NewsArticle }
  
DELETE /api/admin/news/:articleId
  Response: { success: boolean }
  
GET /api/admin/users/:userId/predictions
  Response: { predictions: Prediction[] }
  
POST /api/admin/bracket/round16
  Request: { teams: Team[] }
  Response: { matches: Match[] }
  
POST /api/admin/bracket/quarterfinals
  Request: { teams: Team[] }
  Response: { matches: Match[] }
  
POST /api/admin/bracket/semifinals
  Request: { teams: Team[] }
  Response: { matches: Match[], thirdPlaceMatch: Match }
  
GET /api/admin/stats
  Response: { stats: SystemStats }
```

### Simulation Endpoints

```
POST /api/simulation/generate-users
  Request: { count: number }
  Response: { users: User[] }
  
POST /api/simulation/generate-predictions
  Request: { userIds: string[], matchIds: string[] }
  Response: { predictions: Prediction[] }
  
POST /api/simulation/generate-results
  Request: { matchIds: string[] }
  Response: { results: MatchResult[] }
  
POST /api/simulation/clear
  Response: { success: boolean }
  
GET /api/simulation/report
  Response: { report: SimulationReport }
```

### WebSocket Events

```
Real-time Updates:
  match:score-update -> { matchId, team1Score, team2Score }
  leaderboard:update -> { userId, newRank, newPoints }
  prediction:locked -> { matchId, lockdownTime }
  result:published -> { matchId, result: MatchResult }
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authenticated users bypass login

For any authenticated user accessing the login page, the system should redirect them to the dashboard instead of displaying the login page.

**Validates: Requirements 1.5**

### Property 2: Registration deadline enforcement

For any user without completed registration and payment before June 11, 2026 at 00:00 UTC-4, the system should reject all prediction submissions.

**Validates: Requirements 2.4**

### Property 3: Unregistered users cannot predict

For any user who has not completed registration and payment, attempting to access prediction features should display a message directing them to complete these steps.

**Validates: Requirements 2.5**

### Property 4: Profile data persistence

For any user profile update, the updated data should be persisted to the database and retrievable on subsequent profile page access.

**Validates: Requirements 3.3**

### Property 5: Account deletion removes all data

For any deleted user account, all associated predictions, scores, and personal data should be removed from the system.

**Validates: Requirements 3.4**

### Property 6: News article visibility

For any published news article, it should appear in the news feed for all users until deleted or archived.

**Validates: Requirements 4.3**

### Property 7: News article audit trail

For any edited news article, the modification timestamp should be recorded and the updated content should be persisted.

**Validates: Requirements 4.4**

### Property 8: Completed matches appear in results list

For any match that has concluded without a published result, it should appear in the admin's pending results list.

**Validates: Requirements 5.2**

### Property 9: Result publication triggers scoring

For any published match result, automatic score calculation should be triggered for all user predictions on that match.

**Validates: Requirements 5.4**

### Property 10: Leaderboard updates after scoring

For any user whose score changes due to a published result, their leaderboard position should update to reflect the new total points.

**Validates: Requirements 5.5**

### Property 11: Duplicate result prevention

For any match that already has a published result, attempting to publish another result should be prevented with a warning message.

**Validates: Requirements 5.6**

### Property 12: Result publication timestamp recording

For any published match result, the timestamp of publication should be recorded in the system.

**Validates: Requirements 5.7**

### Property 13: Prediction format validation

For any prediction submission, the format should be validated (valid score or winner selection) before acceptance.

**Validates: Requirements 7.2**

### Property 14: Valid predictions are persisted

For any valid prediction submission, it should be stored with user ID, match ID, prediction details, and submission timestamp.

**Validates: Requirements 7.3**

### Property 15: Pre-lockdown predictions accepted

For any prediction submitted before the lockdown time, the system should accept and store it.

**Validates: Requirements 7.4**

### Property 16: Post-lockdown predictions rejected

For any prediction submitted after the lockdown time, the system should reject it with an error message.

**Validates: Requirements 7.5**

### Property 17: Concluded match predictions rejected

For any prediction submitted for a match that has already concluded, the system should reject it with an error message.

**Validates: Requirements 7.6**

### Property 18: Unlocked predictions show edit button

For any prediction that is not locked, the system should display an "Edit" button when the user views it.

**Validates: Requirements 8.1**

### Property 19: Edit form pre-population

For any prediction edit action, the prediction form should be pre-populated with the user's current prediction data.

**Validates: Requirements 8.2**

### Property 20: Pre-lockdown edits update prediction

For any prediction modified and resubmitted before lockdown, the stored prediction should be updated with the new values.

**Validates: Requirements 8.3**

### Property 21: Lockdown prevents edits

For any prediction at or after the lockdown time, the system should prevent all modifications.

**Validates: Requirements 8.4**

### Property 22: Lockdown timestamp recording

For any prediction that transitions to locked status, the lockdown timestamp should be recorded.

**Validates: Requirements 8.6**

### Property 23: Lockdown time calculation

For any match, the lockdown time should be exactly 15 minutes before the scheduled match start time.

**Validates: Requirements 9.1**

### Property 24: Lockdown state transition

For any prediction, when the current time reaches the lockdown time, the prediction status should transition to locked.

**Validates: Requirements 9.2**

### Property 25: Locked predictions prevent modifications

For any locked prediction, any modification attempt should be prevented.

**Validates: Requirements 9.3**

### Property 26: Post-lockdown submission rejection

For any prediction submitted after lockdown, the system should reject it with an error message.

**Validates: Requirements 9.4**

### Property 27: Rescheduled match lockdown recalculation

For any match that is rescheduled, the lockdown time should be recalculated based on the new scheduled start time.

**Validates: Requirements 9.5**

### Property 28: Exact score awards 3 points

For any prediction that matches the exact final score (both teams' goals), the system should award 3 points to that user.

**Validates: Requirements 10.2**

### Property 29: Non-exact predictions don't earn 3 points

For any prediction that does not match the exact score, the system should not award 3 points.

**Validates: Requirements 10.3**

### Property 30: Multiple exact predictions each earn 3 points

For any multiple users with identical exact score predictions, each should independently receive 3 points.

**Validates: Requirements 10.4**

### Property 31: Goal difference calculation

For any match result, the goal difference should be calculated as the absolute difference between the two teams' goals.

**Validates: Requirements 11.1**

### Property 32: Winner with correct difference awards 2 points

For any prediction matching both the correct winner and goal difference, the system should award 2 points.

**Validates: Requirements 11.2**

### Property 33: Wrong difference prevents 2 points

For any prediction matching the winner but not the goal difference, the system should not award 2 points.

**Validates: Requirements 11.3**

### Property 34: Wrong winner prevents 2 points

For any prediction not matching the winner, the system should not award 2 points regardless of goal difference.

**Validates: Requirements 11.4**

### Property 35: Draw goal difference is zero

For any match result that is a draw, the goal difference should be calculated as 0.

**Validates: Requirements 11.5 (edge-case)**

### Property 36: Correct winner awards 1 point

For any prediction matching the correct winner (regardless of exact score), the system should award 1 point.

**Validates: Requirements 12.2**

### Property 37: Correct draw awards 1 point

For any prediction correctly forecasting a draw, the system should award 1 point.

**Validates: Requirements 12.3**

### Property 38: Incorrect prediction earns no points

For any prediction not matching the winner or draw, the system should not award 1 point.

**Validates: Requirements 12.4**

### Property 39: No double-counting for exact scores

For any prediction earning 3 points for exact score, the system should not also award 1 point for correct winner.

**Validates: Requirements 12.5**

### Property 40: Group stage displays 72 matches

For any group stage schedule, the system should display exactly 72 matches scheduled between June 11-27, 2026.

**Validates: Requirements 14.1**

### Property 41: Match times display in La Paz timezone

For any match time displayed to a user, it should be converted from UTC to La Paz timezone (UTC-4).

**Validates: Requirements 14.3, 16.2**

### Property 42: Leaderboard ranks users by points

For any leaderboard, users should be ranked by total accumulated points in descending order.

**Validates: Requirements 18.1**

### Property 43: Leaderboard highlights user entry

For any user viewing the leaderboard, their own entry should be highlighted or visually distinguished.

**Validates: Requirements 18.6**

### Property 44: User predictions are retrievable

For any user, all their submitted predictions should be retrievable and displayable with match details and outcomes.

**Validates: Requirements 19.1**

### Property 45: Admin can view any user's predictions

For any user, an admin should be able to view all predictions submitted by that user.

**Validates: Requirements 19.2.2**

### Property 46: Tournament structure validation

For any tournament configuration, the system should validate that the correct number of matches are scheduled (72 group + 32 elimination = 104 total).

**Validates: Requirements 21.1-21.6**

### Property 47: Prediction validation before acceptance

For any prediction submission, the system should validate that the match exists, is scheduled, the prediction format is correct, the current time is before lockdown, and the user has completed registration.

**Validates: Requirements 22.1-22.5**

### Property 48: Score calculation applies correct point values

For any match result publication, the scoring engine should apply the correct point values (3 for exact, 2 for winner+difference, 1 for winner/draw) without double-counting.

**Validates: Requirements 23.2-23.3**

### Property 49: Prediction persistence before confirmation

For any prediction submission, the system should persist it to the database before confirming to the user.

**Validates: Requirements 24.1**

### Property 50: Result persistence before leaderboard update

For any match result publication, the system should persist it to the database before updating leaderboards.

**Validates: Requirements 24.2**

### Property 51: Score updates persist to database

For any user score update, the changes should be persisted to the database.

**Validates: Requirements 24.3**

### Property 52: Timezone conversion accuracy

For any UTC time, the conversion to La Paz timezone (UTC-4) should be accurate and consistent.

**Validates: Requirements 16.1-16.5**

### Property 53: Real-time score updates within 30 seconds

For any in-progress match, score changes should be reflected in the system within 30 seconds.

**Validates: Requirements 17.2**

### Property 54: Dummy data generation creates realistic predictions

For any dummy prediction generation, the system should create varied prediction types (exact scores, winners, draws) simulating realistic betting patterns.

**Validates: Requirements 27.1.3**

### Property 55: Simulation data is separate from production

For any simulation data generated, it should be clearly marked as test data and not affect production leaderboards or user scores.

**Validates: Requirements 27.1.10**

### Property 56: Simulation mode indicator displays

For any system in testing mode, a clear "TEST MODE" indicator should display on all pages.

**Validates: Requirements 27.1.11**



## Error Handling

### Prediction Submission Errors

```typescript
enum PredictionError {
  MATCH_NOT_FOUND = "Match does not exist",
  PREDICTION_LOCKED = "Predictions for this match are locked",
  MATCH_CONCLUDED = "Cannot predict on concluded matches",
  INVALID_FORMAT = "Prediction format is invalid",
  USER_NOT_REGISTERED = "User must complete registration and payment",
  DUPLICATE_PREDICTION = "User already has a prediction for this match",
  UNAUTHORIZED = "User is not authenticated"
}
```

### Result Publication Errors

```typescript
enum ResultError {
  MATCH_NOT_FOUND = "Match does not exist",
  RESULT_ALREADY_EXISTS = "Result already published for this match",
  INVALID_SCORE_FORMAT = "Score format is invalid",
  UNAUTHORIZED = "User does not have admin privileges",
  SCORING_FAILED = "Score calculation failed, result not published"
}
```

### Authentication Errors

```typescript
enum AuthError {
  GOOGLE_AUTH_FAILED = "Google authentication failed",
  PAYMENT_FAILED = "Payment processing failed",
  SESSION_EXPIRED = "Session has expired",
  INVALID_TOKEN = "Invalid or malformed token",
  REGISTRATION_INCOMPLETE = "User registration is incomplete"
}
```

### Error Recovery Strategy

1. **Prediction Submission Failure**: Log error, display user-friendly message, allow retry without data loss
2. **Result Publication Failure**: Rollback score calculations, prevent partial updates, allow admin retry
3. **Payment Processing Failure**: Preserve registration data, allow retry with same payment method
4. **Database Errors**: Log with full context, display generic error to user, trigger alert to ops team
5. **Scoring Calculation Failure**: Quarantine affected predictions, log for manual review, prevent leaderboard corruption

## Testing Strategy

### Unit Testing Approach

**Prediction Validation Tests:**
- Valid prediction formats (exact score, winner, draw)
- Invalid prediction formats (negative scores, invalid teams)
- Lockdown enforcement (before/at/after lockdown time)
- Registration deadline enforcement
- Duplicate prediction prevention

**Scoring Engine Tests:**
- Exact score calculation (3 points)
- Winner with goal difference (2 points)
- Correct winner/draw (1 point)
- No double-counting scenarios
- Edge cases (draws, zero scores, large goal differences)

**Timezone Conversion Tests:**
- UTC to UTC-4 conversion accuracy
- Daylight saving time handling
- Lockdown time calculation with timezone
- Match time display in La Paz timezone

**Bracket Configuration Tests:**
- Round of 16 generation (16 matches from 16 teams)
- Quarterfinals generation (8 matches from 8 teams)
- Semifinals generation (2 matches + 1 third place from 4 teams)
- Final generation (1 match from 2 teams)
- Invalid team count rejection

**Leaderboard Tests:**
- Correct ranking by total points
- Tiebreaker by registration timestamp
- Real-time updates after score changes
- Phase-specific filtering (group/elimination/all)

### Property-Based Testing Approach

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: sports-prediction-system, Property {number}: {property_text}`

**Property Test Examples:**

```typescript
// Property 28: Exact score awards 3 points
describe('Scoring Engine - Exact Score Property', () => {
  it('should award 3 points for exact score predictions', () => {
    fc.assert(
      fc.property(
        fc.record({
          team1Score: fc.integer({ min: 0, max: 5 }),
          team2Score: fc.integer({ min: 0, max: 5 })
        }),
        (result) => {
          const prediction = {
            predictedScore: { team1: result.team1Score, team2: result.team2Score }
          };
          const score = scoringEngine.calculateScore(prediction, result);
          expect(score).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 39: No double-counting for exact scores
describe('Scoring Engine - No Double-Counting Property', () => {
  it('should not award both 3 and 1 points for exact score', () => {
    fc.assert(
      fc.property(
        fc.record({
          team1Score: fc.integer({ min: 0, max: 5 }),
          team2Score: fc.integer({ min: 0, max: 5 })
        }),
        (result) => {
          const prediction = {
            predictedScore: { team1: result.team1Score, team2: result.team2Score }
          };
          const breakdown = scoringEngine.validateScoringRules(prediction, result);
          if (breakdown.exactScore) {
            expect(breakdown.totalPoints).toBe(3);
            expect(breakdown.correctWinnerOrDraw).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 23: Lockdown time calculation
describe('Match Service - Lockdown Time Calculation Property', () => {
  it('should calculate lockdown as 15 minutes before match start', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-06-11'), max: new Date('2026-07-19') }),
        (scheduledTime) => {
          const match = { scheduledTime };
          const lockdownTime = matchService.calculateLockdownTime(match);
          const expectedLockdown = new Date(scheduledTime.getTime() - 15 * 60 * 1000);
          expect(lockdownTime).toEqual(expectedLockdown);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 52: Timezone conversion accuracy
describe('Timezone Service - UTC to La Paz Conversion Property', () => {
  it('should accurately convert UTC to UTC-4', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-06-11'), max: new Date('2026-07-19') }),
        (utcTime) => {
          const laPazTime = timezoneService.convertToLaPaz(utcTime);
          const expectedOffset = -4 * 60 * 60 * 1000;
          const actualOffset = laPazTime.getTime() - utcTime.getTime();
          expect(actualOffset).toBe(expectedOffset);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing Approach

**End-to-End Workflows:**
1. User registration → payment → prediction submission → result publication → score calculation → leaderboard update
2. Admin bracket configuration → match scheduling → prediction lockdown → result entry → scoring
3. Simulation mode → dummy data generation → result publication → report generation

**Real-Time Update Testing:**
- WebSocket connection establishment
- Score update propagation to multiple clients
- Leaderboard update consistency across clients
- Lockdown notification delivery

### Performance Testing

**Load Testing Scenarios:**
- 1000 concurrent users viewing leaderboard
- 500 concurrent prediction submissions (pre-lockdown)
- 100 concurrent result publications
- Real-time score updates to 10,000 connected clients

**Benchmark Targets:**
- Prediction submission: < 200ms
- Leaderboard query: < 100ms
- Score calculation (single match): < 500ms
- Lockdown enforcement: < 50ms

## Implementation Considerations

### Concurrency and Race Conditions

**Prediction Lockdown:**
- Use database-level timestamp comparison to prevent race conditions
- Implement optimistic locking on prediction updates
- Use Redis for distributed lockdown state

**Score Calculation:**
- Use database transactions to ensure atomicity
- Implement idempotent score updates (safe to retry)
- Use job queue to serialize score calculations per match

**Leaderboard Updates:**
- Use Redis sorted sets for O(log n) ranking updates
- Implement eventual consistency model
- Batch leaderboard recalculation during off-peak hours

### Scalability

**Database Optimization:**
- Index on (user_id, match_id) for prediction lookups
- Index on (match_id, status) for match queries
- Partition predictions table by match_id for large datasets
- Archive completed predictions after tournament ends

**Caching Strategy:**
- Cache match schedules (rarely changes)
- Cache leaderboard (update on score changes)
- Cache user registration status (update on payment)
- TTL: 5 minutes for most caches, 1 hour for schedules

**API Rate Limiting:**
- 100 requests/minute per user for prediction endpoints
- 10 requests/minute for admin endpoints
- 1000 requests/minute for public leaderboard

### Security

**Authentication:**
- Validate Google OAuth tokens server-side
- Implement CSRF protection for state-changing operations
- Use secure session cookies (HttpOnly, Secure, SameSite)

**Authorization:**
- Verify user ownership before allowing prediction edits
- Verify admin role before allowing result publication
- Implement row-level security for user data

**Data Protection:**
- Encrypt payment information in transit (TLS 1.3)
- Hash sensitive user data
- Implement audit logging for admin actions
- Regular security audits and penetration testing

### Monitoring and Observability

**Metrics to Track:**
- Prediction submission rate and latency
- Score calculation duration and success rate
- Leaderboard update frequency and consistency
- WebSocket connection count and message throughput
- Database query performance and connection pool usage

**Alerting:**
- Alert on prediction submission errors > 1%
- Alert on score calculation failures
- Alert on database connection pool exhaustion
- Alert on WebSocket disconnection spikes

**Logging:**
- Log all prediction submissions with user ID and match ID
- Log all result publications with admin ID and timestamp
- Log all score calculations with breakdown details
- Log all authentication events



## Real-Time Update Mechanisms

### WebSocket Architecture

**Connection Management:**
- Establish WebSocket connection on user login
- Maintain persistent connection throughout session
- Implement automatic reconnection with exponential backoff
- Clean up connections on logout or timeout

**Event Broadcasting:**
```typescript
// Score updates during matches
io.to(`match:${matchId}`).emit('score-update', {
  matchId,
  team1Score,
  team2Score,
  timestamp
});

// Leaderboard updates after scoring
io.to('leaderboard').emit('leaderboard-update', {
  userId,
  newRank,
  newPoints,
  timestamp
});

// Lockdown notifications
io.to(`match:${matchId}`).emit('prediction-locked', {
  matchId,
  lockdownTime,
  timestamp
});

// Result publication
io.to('all-users').emit('result-published', {
  matchId,
  result: { team1Score, team2Score, winner },
  timestamp
});
```

**Fallback to Polling:**
- If WebSocket unavailable, fall back to HTTP polling
- Poll interval: 5 seconds for leaderboard, 10 seconds for match scores
- Implement exponential backoff on polling failures

### Real-Time Leaderboard

**Update Strategy:**
1. When score is calculated, update Redis sorted set
2. Broadcast leaderboard-update event to all connected clients
3. Clients update their local leaderboard view
4. Periodic full leaderboard sync every 5 minutes

**Consistency Guarantees:**
- All clients see consistent ranking within 1 second
- Tiebreaker (registration timestamp) applied consistently
- No race conditions in ranking calculation

## Scoring Calculation Engine

### Scoring Algorithm

```typescript
function calculateScore(prediction: Prediction, result: MatchResult): ScoringBreakdown {
  const breakdown: ScoringBreakdown = {
    exactScore: false,
    correctWinnerWithDifference: false,
    correctWinnerOrDraw: false,
    totalPoints: 0,
    advancement: false
  };

  // Check exact score (3 points)
  if (prediction.predictedScore &&
      prediction.predictedScore.team1 === result.team1Score &&
      prediction.predictedScore.team2 === result.team2Score) {
    breakdown.exactScore = true;
    breakdown.totalPoints += 3;
    return breakdown; // No further scoring if exact match
  }

  // Determine actual winner
  const actualWinner = result.team1Score > result.team2Score ? 'team1' :
                       result.team2Score > result.team1Score ? 'team2' : 'draw';
  
  // Determine predicted winner
  const predictedWinner = prediction.predictedWinner || 
                         (prediction.predictedScore ? 
                          (prediction.predictedScore.team1 > prediction.predictedScore.team2 ? 'team1' :
                           prediction.predictedScore.team2 > prediction.predictedScore.team1 ? 'team2' : 'draw') :
                          null);

  // Check correct winner with goal difference (2 points)
  if (predictedWinner === actualWinner) {
    const actualDifference = Math.abs(result.team1Score - result.team2Score);
    const predictedDifference = prediction.predictedScore ?
      Math.abs(prediction.predictedScore.team1 - prediction.predictedScore.team2) : null;
    
    if (predictedDifference === actualDifference) {
      breakdown.correctWinnerWithDifference = true;
      breakdown.totalPoints += 2;
      return breakdown;
    }
  }

  // Check correct winner or draw (1 point)
  if (predictedWinner === actualWinner) {
    breakdown.correctWinnerOrDraw = true;
    breakdown.totalPoints += 1;
  }

  return breakdown;
}
```

### Batch Score Calculation

```typescript
async function calculateAllScores(matchId: string): Promise<void> {
  const match = await getMatch(matchId);
  const result = await getMatchResult(matchId);
  const predictions = await getPredictionsForMatch(matchId);

  // Use transaction to ensure atomicity
  await db.transaction(async (trx) => {
    for (const prediction of predictions) {
      const breakdown = calculateScore(prediction, result);
      
      // Update prediction with points
      await trx('predictions')
        .where({ id: prediction.id })
        .update({ points_earned: breakdown.totalPoints });
      
      // Update user score
      await trx('user_scores')
        .where({ user_id: prediction.user_id })
        .increment('total_points', breakdown.totalPoints);
      
      // Update phase-specific score
      if (match.phase === 'group') {
        await trx('user_scores')
          .where({ user_id: prediction.user_id })
          .increment('group_stage_points', breakdown.totalPoints);
      } else {
        await trx('user_scores')
          .where({ user_id: prediction.user_id })
          .increment('elimination_points', breakdown.totalPoints);
      }
    }
  });

  // Update Redis leaderboard
  for (const prediction of predictions) {
    const userScore = await getUserScore(prediction.user_id);
    await redis.zadd('leaderboard:all', userScore.total_points, prediction.user_id);
  }

  // Broadcast leaderboard update
  io.emit('leaderboard-update', { matchId, timestamp: new Date() });
}
```

## Testing and Simulation Mode

### Dummy Data Generation

**User Generation:**
```typescript
function generateDummyUsers(count: number): User[] {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: uuid(),
      googleId: `test-${i}@example.com`,
      email: `test-${i}@example.com`,
      name: `Test User ${i}`,
      registrationCompleted: true,
      paymentCompleted: true,
      registrationTimestamp: new Date(),
      paymentTimestamp: new Date(),
      isTestData: true
    });
  }
  return users;
}
```

**Prediction Generation:**
```typescript
function generateDummyPredictions(userIds: string[], matchIds: string[]): Prediction[] {
  const predictions = [];
  const predictionTypes = ['exact', 'winner', 'draw'];
  
  for (const userId of userIds) {
    for (const matchId of matchIds) {
      const type = predictionTypes[Math.floor(Math.random() * predictionTypes.length)];
      let prediction: Prediction;
      
      if (type === 'exact') {
        prediction = {
          id: uuid(),
          userId,
          matchId,
          predictedScore: {
            team1: Math.floor(Math.random() * 6),
            team2: Math.floor(Math.random() * 6)
          },
          submissionTimestamp: new Date(),
          isTestData: true
        };
      } else if (type === 'winner') {
        prediction = {
          id: uuid(),
          userId,
          matchId,
          predictedWinner: Math.random() > 0.5 ? 'team1' : 'team2',
          submissionTimestamp: new Date(),
          isTestData: true
        };
      } else {
        prediction = {
          id: uuid(),
          userId,
          matchId,
          predictedDraw: true,
          submissionTimestamp: new Date(),
          isTestData: true
        };
      }
      
      predictions.push(prediction);
    }
  }
  
  return predictions;
}
```

**Result Generation:**
```typescript
function generateDummyResults(matchIds: string[]): MatchResult[] {
  const results = [];
  
  for (const matchId of matchIds) {
    const team1Score = Math.floor(Math.random() * 6);
    const team2Score = Math.floor(Math.random() * 6);
    
    results.push({
      id: uuid(),
      matchId,
      team1Score,
      team2Score,
      winner: team1Score > team2Score ? 'team1' : team2Score > team1Score ? 'team2' : 'draw',
      isDraw: team1Score === team2Score,
      publishedTimestamp: new Date(),
      isTestData: true
    });
  }
  
  return results;
}
```

### Simulation Workflow

**Complete Simulation:**
```typescript
async function runSimulation(config: SimulationConfig): Promise<SimulationReport> {
  // 1. Generate dummy users
  const users = generateDummyUsers(config.userCount);
  await saveDummyUsers(users);
  
  // 2. Generate dummy predictions
  const predictions = generateDummyPredictions(
    users.map(u => u.id),
    config.matchIds
  );
  await saveDummyPredictions(predictions);
  
  // 3. Generate dummy results
  const results = generateDummyResults(config.matchIds);
  
  // 4. Publish results and calculate scores
  for (const result of results) {
    await publishResult(result.matchId, result);
    await calculateAllScores(result.matchId);
  }
  
  // 5. Generate report
  const report = await generateSimulationReport();
  
  return report;
}
```

### Simulation Report

```typescript
interface SimulationReport {
  usersCreated: number;
  predictionsGenerated: number;
  resultsGenerated: number;
  scoreDistribution: {
    [points: number]: number; // e.g., { 0: 50, 1: 100, 2: 75, 3: 25 }
  };
  leaderboardSnapshot: LeaderboardEntry[];
  averagePointsPerUser: number;
  maxPoints: number;
  minPoints: number;
  executionTime: number; // milliseconds
}
```

## Deployment and Operations

### Environment Configuration

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/copa_prediction
REDIS_URL=redis://host:6379

# Authentication
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
PAYMENT_API_KEY=xxx

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
TIMEZONE=America/La_Paz

# Feature Flags
ENABLE_TESTING_MODE=false
ENABLE_SIMULATION_API=false
```

### Database Migrations

**Initial Schema:**
- Create all tables with proper indexes
- Set up foreign key constraints
- Create views for leaderboard queries

**Maintenance:**
- Archive completed predictions after tournament
- Vacuum and analyze tables monthly
- Backup database daily

### Monitoring and Alerting

**Key Metrics:**
- Prediction submission latency (p50, p95, p99)
- Score calculation duration
- Leaderboard update frequency
- WebSocket connection count
- Database connection pool usage
- Error rates by endpoint

**Alerting Thresholds:**
- Prediction submission errors > 1%
- Score calculation > 5 seconds
- Database query > 1 second
- WebSocket disconnections > 5% of connections

## Conclusion

This design provides a comprehensive, scalable architecture for the Copa América 2024 Sports Prediction System. The system prioritizes:

1. **Correctness**: Multi-tier scoring with no double-counting, accurate timezone handling, and strict lockdown enforcement
2. **Scalability**: Efficient database queries, Redis caching, and real-time WebSocket updates
3. **Reliability**: Transaction-based score calculations, comprehensive error handling, and data consistency guarantees
4. **Testability**: Property-based testing for core logic, comprehensive unit tests, and simulation mode for end-to-end validation

The implementation should follow the API specifications, database schema, and correctness properties defined in this document to ensure a robust and user-friendly prediction platform.

