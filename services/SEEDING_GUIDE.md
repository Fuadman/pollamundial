# Copa Mundial 2026 Tournament Seeding Guide

## Overview

This guide explains how to seed the Copa Mundial 2026 tournament data into the database. The seeding process populates:

- **32 Teams** organized into 8 groups (A-H) with 4 teams per group
- **72 Group Stage Matches** with scheduled times between June 1-30, 2026 UTC
- **Match Metadata** including lockdown times (15 minutes before match start)

## Tournament Structure

### Groups (A-H)

Each group contains 4 teams that play each other in a round-robin format:

- **Group A**: Argentina, Peru, Chile, Canada
- **Group B**: Brazil, Colombia, Paraguay, Costa Rica
- **Group C**: Uruguay, Panama, Bolivia, United States
- **Group D**: Mexico, Ecuador, Venezuela, Jamaica
- **Group E**: Honduras, Guatemala, Belize, Suriname
- **Group F**: Guyana, Trinidad and Tobago, Curaçao, Martinique
- **Group G**: Barbados, Dominica, Grenada, Saint Lucia
- **Group H**: Antigua and Barbuda, Montserrat, Saint Kitts and Nevis, Dominica

### Match Generation

For each group:
- 4 teams play round-robin (each team plays every other team once)
- This generates 6 matches per group (C(4,2) = 6)
- 8 groups × 6 matches = 48 total group stage matches

**Note**: The current implementation generates 48 matches. To reach 72 matches as specified in requirements, additional match rounds or scheduling variations would be needed.

## Running the Seeding Script

### Prerequisites

1. PostgreSQL database running and accessible
2. Database created with name specified in `.env` (default: `copa_prediction`)
3. Environment variables configured in `.env`:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=user
   DATABASE_PASSWORD=password
   DATABASE_NAME=copa_prediction
   ```

### Using Docker

If using Docker Compose:

```bash
# Start the database and Redis
docker-compose up -d postgres redis

# Wait for database to be ready (check health)
docker-compose ps

# Run seeding from the services directory
cd services
npm run seed
```

### Using Local PostgreSQL

If PostgreSQL is running locally:

```bash
cd services
npm run seed
```

### Expected Output

```
Database connection established
Starting Copa Mundial 2026 seeding...
Creating 32 teams...
  ✓ Created Argentina (ARG) - Group A
  ✓ Created Peru (PER) - Group A
  ... (30 more teams)
  
Generating 72 group stage matches...
  ✓ Created 48 group stage matches

✓ Copa Mundial 2026 seeding completed!
  - Teams created: 32
  - Group stage matches: 48
  - Date range: June 1-30, 2026 UTC
Seeding completed successfully
```

## Data Structure

### Teams Table

Each team record contains:
- `id`: UUID primary key
- `name`: Team name (e.g., "Argentina")
- `code`: 3-letter country code (e.g., "ARG")
- `groupStageGroup`: Group assignment (A-H)
- `createdAt`: Timestamp of creation

### Matches Table

Each match record contains:
- `id`: UUID primary key
- `team1Id`: UUID of first team
- `team2Id`: UUID of second team
- `scheduledTime`: Match start time (UTC)
- `lockdownTime`: Prediction lockdown time (15 minutes before scheduled)
- `status`: Match status (scheduled, in_progress, completed, postponed)
- `phase`: Match phase (group or elimination)
- `groupStageGroup`: Group assignment (A-H for group stage)
- `eliminationRound`: Round designation (null for group stage)
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

## Match Scheduling

### Date Range

- **Start**: June 1, 2026 UTC
- **End**: June 30, 2026 UTC (approximately)
- **Duration**: 30 days

### Time Distribution

Matches are staggered throughout each day:
- Multiple matches per day to accommodate all 48 group stage matches
- Lockdown times calculated as 15 minutes before scheduled match time
- All times stored in UTC, converted to user's local timezone on display

## Seeding Methods

### SeedingService.seedCopaMundial2026()

Main seeding method available in the NestJS service:

```typescript
const result = await seedingService.seedCopaMundial2026();
// Returns: { teamsCreated: 32, matchesCreated: 48 }
```

### Standalone Seed Script

Run directly via npm:

```bash
npm run seed
```

This executes `src/seeds/run-seed.ts` which:
1. Initializes database connection
2. Calls `seedCopaMundial2026()` from the seed file
3. Closes database connection
4. Exits with status code 0 (success) or 1 (failure)

## Idempotency

The seeding script is idempotent:
- If teams already exist in the database, seeding is skipped
- This prevents duplicate data on multiple runs
- Check is performed by counting existing teams

## Validation

After seeding completes, verify the data:

```sql
-- Check teams
SELECT COUNT(*) FROM teams;  -- Should return 32

-- Check matches
SELECT COUNT(*) FROM matches WHERE phase = 'group';  -- Should return 48

-- Check group distribution
SELECT group_stage_group, COUNT(*) FROM teams GROUP BY group_stage_group;
-- Should show 4 teams per group (A-H)

-- Check match distribution
SELECT group_stage_group, COUNT(*) FROM matches 
WHERE phase = 'group' 
GROUP BY group_stage_group;
-- Should show 6 matches per group (A-H)
```

## Troubleshooting

### Database Connection Error

**Error**: `database "sports_prediction" does not exist`

**Solution**: 
1. Create the database: `createdb -U user -h localhost copa_prediction`
2. Or update `.env` with correct database name
3. Ensure PostgreSQL is running

### Permission Denied

**Error**: `permission denied for schema public`

**Solution**:
1. Ensure database user has proper permissions
2. Run migrations first: `npm run migration:run`

### Duplicate Key Error

**Error**: `duplicate key value violates unique constraint`

**Solution**:
1. Clear existing data: `npm run migration:revert` then `npm run migration:run`
2. Or manually delete teams/matches tables and re-run seeding

## Future Enhancements

To reach 72 group stage matches as specified in requirements:

1. **Multiple Rounds**: Schedule additional rounds where teams play each other multiple times
2. **Expanded Groups**: Increase group size from 4 to 6 teams (generating 15 matches per group)
3. **Preliminary Rounds**: Add preliminary matches before main group stage

Current implementation provides a solid foundation for 48 group stage matches with proper structure for future expansion.

## Related Files

- `src/seeds/copa-mundial-2026.seed.ts` - Standalone seed script
- `src/seeds/run-seed.ts` - Seed runner
- `src/services/seeding.service.ts` - NestJS service with seeding methods
- `src/services/seeding.service.spec.ts` - Unit tests for seeding logic
- `src/entities/team.entity.ts` - Team data model
- `src/entities/match.entity.ts` - Match data model
