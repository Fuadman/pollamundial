# Entity Quick Reference Guide

## Quick Entity Overview

### User
```typescript
{
  id: UUID,
  googleId: string (unique),
  email: string (unique),
  name: string,
  registrationCompleted: boolean,
  paymentCompleted: boolean,
  registrationTimestamp: Date,
  paymentTimestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Team
```typescript
{
  id: UUID,
  name: string,
  code: string (unique, 3-letter),
  groupStageGroup: string (A-H),
  createdAt: Date
}
```

### Match
```typescript
{
  id: UUID,
  team1Id: UUID (FK),
  team2Id: UUID (FK),
  scheduledTime: Date (UTC),
  lockdownTime: Date (UTC, 15 min before scheduled),
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed',
  phase: 'group' | 'elimination',
  groupStageGroup: string (A-H, for group stage),
  eliminationRound: string (R16, QF, SF, THIRD, FINAL),
  createdAt: Date,
  updatedAt: Date
}
```

### MatchResult
```typescript
{
  id: UUID,
  matchId: UUID (FK, unique),
  team1Score: number,
  team2Score: number,
  winnerId: UUID (FK, nullable),
  isDraw: boolean,
  publishedTimestamp: Date,
  createdAt: Date
}
```

### Prediction
```typescript
{
  id: UUID,
  userId: UUID (FK),
  matchId: UUID (FK),
  predictedTeam1Score: number (nullable),
  predictedTeam2Score: number (nullable),
  predictedWinnerId: UUID (nullable),
  predictedDraw: boolean,
  submissionTimestamp: Date,
  lockedTimestamp: Date (nullable),
  pointsEarned: number,
  createdAt: Date,
  updatedAt: Date
}
```

### UserScore
```typescript
{
  id: UUID,
  userId: UUID (FK, unique),
  totalPoints: number,
  groupStagePoints: number,
  eliminationPoints: number,
  updatedAt: Date
}
```

### NewsArticle
```typescript
{
  id: UUID,
  title: string,
  content: string,
  publishedTimestamp: Date,
  modifiedTimestamp: Date (nullable),
  archived: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### SimulationData
```typescript
{
  id: UUID,
  userId: UUID (FK, nullable),
  predictionId: UUID (FK, nullable),
  matchResultId: UUID (FK, nullable),
  isTestData: boolean,
  createdAt: Date
}
```

## Common Queries

### Get user with predictions
```typescript
const user = await userRepository.findOne({
  where: { id: userId },
  relations: ['predictions', 'scores']
});
```

### Get match with teams and result
```typescript
const match = await matchRepository.findOne({
  where: { id: matchId },
  relations: ['team1', 'team2', 'result']
});
```

### Get user predictions for a match
```typescript
const prediction = await predictionRepository.findOne({
  where: { userId, matchId },
  relations: ['match', 'match.team1', 'match.team2']
});
```

### Get all predictions for a match
```typescript
const predictions = await predictionRepository.find({
  where: { matchId },
  relations: ['user']
});
```

### Get leaderboard (top 10)
```typescript
const leaderboard = await userScoreRepository.find({
  order: { totalPoints: 'DESC' },
  take: 10,
  relations: ['user']
});
```

### Get user's score
```typescript
const score = await userScoreRepository.findOne({
  where: { userId },
  relations: ['user']
});
```

### Get upcoming matches
```typescript
const matches = await matchRepository.find({
  where: {
    status: 'scheduled',
    scheduledTime: MoreThan(new Date())
  },
  relations: ['team1', 'team2'],
  order: { scheduledTime: 'ASC' }
});
```

### Get completed matches without results
```typescript
const completedMatches = await matchRepository.find({
  where: {
    status: 'completed',
    result: IsNull()
  },
  relations: ['team1', 'team2']
});
```

### Get test data for cleanup
```typescript
const testData = await simulationDataRepository.find({
  where: { isTestData: true },
  relations: ['user', 'prediction', 'matchResult']
});
```

## Indexes for Performance

### User Lookups
- `users(email)` - Fast email-based user lookup
- `users(googleId)` - Fast OAuth user lookup

### Match Queries
- `matches(scheduledTime)` - Sort matches by time
- `matches(status)` - Filter by match status
- `matches(phase)` - Filter by tournament phase
- `matches(team1Id, team2Id)` - Find matches between teams

### Prediction Queries
- `predictions(userId)` - Get user's predictions
- `predictions(matchId)` - Get all predictions for a match
- `predictions(lockedTimestamp)` - Check lockdown status

### Leaderboard
- `user_scores(totalPoints)` - Rank users by points

### News Feed
- `news_articles(publishedTimestamp)` - Order articles by date
- `news_articles(archived)` - Filter archived articles

### Test Data Cleanup
- `simulation_data(userId)` - Find test users
- `simulation_data(predictionId)` - Find test predictions
- `simulation_data(matchResultId)` - Find test results
- `simulation_data(isTestData)` - Identify all test data

## Constraints

### Unique Constraints
- `users.googleId` - One account per Google ID
- `users.email` - One account per email
- `teams.code` - Unique team codes
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

## Cascade Behavior

### When User is Deleted
- All predictions are deleted (CASCADE)
- User score is deleted (CASCADE)
- Simulation data referencing user is deleted (CASCADE)

### When Match is Deleted
- All predictions for match are deleted (CASCADE)
- Match result is deleted (CASCADE)
- Simulation data referencing result is deleted (CASCADE)

### When Prediction is Deleted
- Simulation data referencing prediction is deleted (CASCADE)

### When MatchResult is Deleted
- Simulation data referencing result is deleted (CASCADE)

## Timestamp Fields

### User
- `createdAt` - Account creation time
- `updatedAt` - Last profile update
- `registrationTimestamp` - When registration was completed
- `paymentTimestamp` - When payment was completed

### Match
- `createdAt` - When match was created
- `updatedAt` - When match was last updated
- `scheduledTime` - Match start time (UTC)
- `lockdownTime` - Prediction lockdown time (UTC)

### Prediction
- `submissionTimestamp` - When prediction was submitted
- `lockedTimestamp` - When prediction was locked
- `createdAt` - Record creation time
- `updatedAt` - Last update time

### MatchResult
- `publishedTimestamp` - When result was published
- `createdAt` - Record creation time

### UserScore
- `updatedAt` - Last score update

### NewsArticle
- `publishedTimestamp` - Publication time
- `modifiedTimestamp` - Last modification time
- `createdAt` - Record creation time
- `updatedAt` - Last update time

### SimulationData
- `createdAt` - When test data was created

## Enums

### MatchStatus
- `scheduled` - Match not yet started
- `in_progress` - Match is currently being played
- `completed` - Match has finished
- `postponed` - Match has been postponed

### MatchPhase
- `group` - Group stage match
- `elimination` - Knockout phase match

## Migration Commands

```bash
# Show pending migrations
npm run migration:show

# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Create new migration (after entity changes)
npm run migration:generate -- src/migrations/MigrationName
```

## Entity Import

```typescript
import {
  User,
  Team,
  Match,
  MatchResult,
  Prediction,
  UserScore,
  NewsArticle,
  SimulationData,
  MatchStatus,
  MatchPhase
} from '../entities';
```

## Repository Injection

```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

constructor(
  @InjectRepository(User) private userRepository: Repository<User>,
  @InjectRepository(Team) private teamRepository: Repository<Team>,
  @InjectRepository(Match) private matchRepository: Repository<Match>,
  @InjectRepository(MatchResult) private resultRepository: Repository<MatchResult>,
  @InjectRepository(Prediction) private predictionRepository: Repository<Prediction>,
  @InjectRepository(UserScore) private scoreRepository: Repository<UserScore>,
  @InjectRepository(NewsArticle) private newsRepository: Repository<NewsArticle>,
  @InjectRepository(SimulationData) private simulationRepository: Repository<SimulationData>,
) {}
```
