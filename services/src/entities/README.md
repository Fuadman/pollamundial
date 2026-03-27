# Database Entities

This directory contains all TypeORM entities for the Copa América 2024 Sports Prediction System.

## Entity Overview

### User Entity
- **Table**: `users`
- **Purpose**: Stores user account information
- **Key Fields**:
  - `id` (UUID): Primary key
  - `googleId` (string): Google OAuth ID (unique)
  - `email` (string): User email (unique)
  - `name` (string): User display name
  - `registrationCompleted` (boolean): Registration status
  - `paymentCompleted` (boolean): Payment status
  - `registrationTimestamp` (timestamp): When registration was completed
  - `paymentTimestamp` (timestamp): When payment was completed
- **Relationships**:
  - One-to-Many: predictions
  - One-to-Many: scores (UserScore)
- **Indexes**: email, googleId

### Team Entity
- **Table**: `teams`
- **Purpose**: Stores Copa América 2024 teams
- **Key Fields**:
  - `id` (UUID): Primary key
  - `name` (string): Team name
  - `code` (string): 3-letter team code (unique)
  - `groupStageGroup` (string): Group assignment (A-H)
- **Relationships**:
  - One-to-Many: matchesAsTeam1 (Match)
  - One-to-Many: matchesAsTeam2 (Match)
  - One-to-Many: wonMatches (MatchResult)
- **Indexes**: code

### Match Entity
- **Table**: `matches`
- **Purpose**: Stores tournament matches
- **Key Fields**:
  - `id` (UUID): Primary key
  - `team1Id` (UUID): First team ID (foreign key)
  - `team2Id` (UUID): Second team ID (foreign key)
  - `scheduledTime` (timestamp): Match start time (UTC)
  - `lockdownTime` (timestamp): Prediction lockdown time (15 min before start)
  - `status` (enum): scheduled, in_progress, completed, postponed
  - `phase` (enum): group or elimination
  - `groupStageGroup` (string): Group for group stage matches
  - `eliminationRound` (string): Round for elimination matches (R16, QF, SF, THIRD, FINAL)
- **Relationships**:
  - Many-to-One: team1 (Team)
  - Many-to-One: team2 (Team)
  - One-to-Many: predictions (Prediction)
  - One-to-One: result (MatchResult)
- **Indexes**: scheduledTime, status, phase, (team1Id, team2Id)
- **Constraints**: Foreign keys on team1Id and team2Id with RESTRICT on delete

### MatchResult Entity
- **Table**: `match_results`
- **Purpose**: Stores final match results
- **Key Fields**:
  - `id` (UUID): Primary key
  - `matchId` (UUID): Match ID (foreign key, unique)
  - `team1Score` (int): Team 1 final score
  - `team2Score` (int): Team 2 final score
  - `winnerId` (UUID): Winning team ID (nullable for draws)
  - `isDraw` (boolean): Whether match ended in draw
  - `publishedTimestamp` (timestamp): When result was published
- **Relationships**:
  - One-to-One: match (Match)
  - Many-to-One: winner (Team)
- **Indexes**: matchId
- **Constraints**: Foreign keys with CASCADE on match delete, SET NULL on team delete

### Prediction Entity
- **Table**: `predictions`
- **Purpose**: Stores user predictions for matches
- **Key Fields**:
  - `id` (UUID): Primary key
  - `userId` (UUID): User ID (foreign key)
  - `matchId` (UUID): Match ID (foreign key)
  - `predictedTeam1Score` (int): Predicted team 1 score (nullable)
  - `predictedTeam2Score` (int): Predicted team 2 score (nullable)
  - `predictedWinnerId` (UUID): Predicted winner ID (nullable)
  - `predictedDraw` (boolean): Whether user predicted a draw
  - `submissionTimestamp` (timestamp): When prediction was submitted
  - `lockedTimestamp` (timestamp): When prediction was locked (nullable)
  - `pointsEarned` (int): Points awarded for this prediction
- **Relationships**:
  - Many-to-One: user (User)
  - Many-to-One: match (Match)
- **Indexes**: userId, matchId, lockedTimestamp
- **Constraints**: Unique constraint on (userId, matchId), foreign keys with CASCADE on delete

### UserScore Entity
- **Table**: `user_scores`
- **Purpose**: Stores aggregated user scores
- **Key Fields**:
  - `id` (UUID): Primary key
  - `userId` (UUID): User ID (foreign key, unique)
  - `totalPoints` (int): Total points across all phases
  - `groupStagePoints` (int): Points from group stage predictions
  - `eliminationPoints` (int): Points from elimination phase predictions
  - `updatedAt` (timestamp): Last update time
- **Relationships**:
  - Many-to-One: user (User)
- **Indexes**: totalPoints (for leaderboard ranking)
- **Constraints**: Unique constraint on userId, foreign key with CASCADE on delete

### NewsArticle Entity
- **Table**: `news_articles`
- **Purpose**: Stores admin news articles
- **Key Fields**:
  - `id` (UUID): Primary key
  - `title` (string): Article title
  - `content` (text): Article content
  - `publishedTimestamp` (timestamp): Publication time
  - `modifiedTimestamp` (timestamp): Last modification time (nullable)
  - `archived` (boolean): Whether article is archived
- **Indexes**: publishedTimestamp, archived

### SimulationData Entity
- **Table**: `simulation_data`
- **Purpose**: Marks test data for simulation mode
- **Key Fields**:
  - `id` (UUID): Primary key
  - `userId` (UUID): Test user ID (nullable, foreign key)
  - `predictionId` (UUID): Test prediction ID (nullable, foreign key)
  - `matchResultId` (UUID): Test result ID (nullable, foreign key)
  - `isTestData` (boolean): Always true for simulation data
- **Relationships**:
  - Many-to-One: user (User)
  - Many-to-One: prediction (Prediction)
  - Many-to-One: matchResult (MatchResult)
- **Indexes**: userId, predictionId, matchResultId, isTestData
- **Constraints**: Foreign keys with CASCADE on delete

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
├─────────────────────────────────────────────────────────────┤
│ id (PK, UUID)                                               │
│ googleId (UNIQUE)                                           │
│ email (UNIQUE)                                              │
│ name                                                        │
│ registrationCompleted                                       │
│ paymentCompleted                                            │
│ registrationTimestamp                                       │
│ paymentTimestamp                                            │
│ createdAt, updatedAt                                        │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │ 1:N                                │ 1:N
         ▼                                    ▼
    ┌─────────────┐                  ┌──────────────────┐
    │ PREDICTIONS │                  │  USER_SCORES     │
    ├─────────────┤                  ├──────────────────┤
    │ id (PK)     │                  │ id (PK)          │
    │ userId (FK) │                  │ userId (FK, UQ)  │
    │ matchId (FK)│                  │ totalPoints      │
    │ predicted*  │                  │ groupStagePoints │
    │ submission* │                  │ eliminationPts   │
    │ locked*     │                  │ updatedAt        │
    │ pointsEarned│                  └──────────────────┘
    └─────────────┘
         │
         │ N:1
         ▼
    ┌──────────────────┐
    │     MATCHES      │
    ├──────────────────┤
    │ id (PK)          │
    │ team1Id (FK)     │
    │ team2Id (FK)     │
    │ scheduledTime    │
    │ lockdownTime     │
    │ status           │
    │ phase            │
    │ group/round      │
    │ createdAt, etc   │
    └──────────────────┘
         │ 1:1
         ▼
    ┌──────────────────┐
    │  MATCH_RESULTS   │
    ├──────────────────┤
    │ id (PK)          │
    │ matchId (FK, UQ) │
    │ team1Score       │
    │ team2Score       │
    │ winnerId (FK)    │
    │ isDraw           │
    │ publishedTime    │
    └──────────────────┘
         │
         └─────────────────┐
                           │ N:1
                           ▼
                      ┌──────────────┐
                      │    TEAMS     │
                      ├──────────────┤
                      │ id (PK)      │
                      │ name         │
                      │ code (UQ)    │
                      │ groupStage   │
                      │ createdAt    │
                      └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│            NEWS_ARTICLES                                     │
├──────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ title                                                        │
│ content                                                      │
│ publishedTimestamp                                           │
│ modifiedTimestamp                                            │
│ archived                                                     │
│ createdAt, updatedAt                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│            SIMULATION_DATA                                   │
├──────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ userId (FK, nullable)                                        │
│ predictionId (FK, nullable)                                  │
│ matchResultId (FK, nullable)                                 │
│ isTestData                                                   │
│ createdAt                                                    │
└──────────────────────────────────────────────────────────────┘
```

## Key Constraints and Indexes

### Unique Constraints
- `users.googleId` - Ensures one account per Google ID
- `users.email` - Ensures one account per email
- `teams.code` - Ensures unique team codes
- `match_results.matchId` - One result per match
- `predictions(userId, matchId)` - One prediction per user per match
- `user_scores.userId` - One score record per user

### Foreign Keys
- `matches.team1Id` → `teams.id` (RESTRICT)
- `matches.team2Id` → `teams.id` (RESTRICT)
- `match_results.matchId` → `matches.id` (CASCADE)
- `match_results.winnerId` → `teams.id` (SET NULL)
- `predictions.userId` → `users.id` (CASCADE)
- `predictions.matchId` → `matches.id` (CASCADE)
- `user_scores.userId` → `users.id` (CASCADE)
- `simulation_data.userId` → `users.id` (CASCADE)
- `simulation_data.predictionId` → `predictions.id` (CASCADE)
- `simulation_data.matchResultId` → `match_results.id` (CASCADE)

### Performance Indexes
- `users(email)` - For user lookup by email
- `users(googleId)` - For OAuth user lookup
- `teams(code)` - For team lookup by code
- `matches(scheduledTime)` - For match schedule queries
- `matches(status)` - For filtering by match status
- `matches(phase)` - For filtering by tournament phase
- `matches(team1Id, team2Id)` - For finding matches between teams
- `match_results(matchId)` - For result lookup
- `predictions(userId)` - For user prediction queries
- `predictions(matchId)` - For match prediction queries
- `predictions(lockedTimestamp)` - For lockdown status queries
- `user_scores(totalPoints)` - For leaderboard ranking
- `news_articles(publishedTimestamp)` - For news feed ordering
- `news_articles(archived)` - For filtering archived articles
- `simulation_data(userId)` - For test data cleanup
- `simulation_data(predictionId)` - For test data cleanup
- `simulation_data(matchResultId)` - For test data cleanup
- `simulation_data(isTestData)` - For identifying test data

## Migration Strategy

The initial migration (`1000000000001-CreateInitialSchema.ts`) creates all tables with:
1. Proper column types and constraints
2. Foreign key relationships with appropriate cascade/restrict rules
3. Unique constraints for data integrity
4. Performance indexes for common queries
5. Timestamp columns for audit trails

### Running Migrations

```bash
# Show pending migrations
npm run migration:show

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Create new migration (after entity changes)
npm run migration:generate -- src/migrations/MigrationName
```

## Entity Relationships Summary

- **User** → Predictions (1:N) - User can have many predictions
- **User** → UserScore (1:1) - User has one score record
- **Team** → Matches (1:N) - Team plays in many matches
- **Match** → Predictions (1:N) - Match has many predictions
- **Match** → MatchResult (1:1) - Match has one result
- **MatchResult** → Team (N:1) - Result references winning team
- **SimulationData** → User/Prediction/MatchResult (N:1) - Marks test data

## Data Integrity Rules

1. **Prediction Uniqueness**: Only one prediction per user per match
2. **Result Uniqueness**: Only one result per match
3. **Score Tracking**: User scores updated when predictions are scored
4. **Cascade Deletion**: Deleting a user cascades to predictions and scores
5. **Referential Integrity**: Foreign keys prevent orphaned records
6. **Timestamp Tracking**: All entities track creation and modification times
