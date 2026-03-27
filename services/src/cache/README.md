# Redis Cache and Session Management

This module provides Redis-based caching and session management for the Copa América 2024 Sports Prediction System.

## Overview

The cache module implements:
- **Redis Connection Service**: Manages Redis connections with connection pooling and retry logic
- **Session Store**: Handles user session management with automatic expiration
- **Cache Service**: High-level caching operations for different data types with appropriate TTL policies

## Architecture

### RedisService

The `RedisService` provides low-level Redis operations with connection pooling and automatic reconnection.

**Features:**
- Connection pooling with configurable retry logic
- Automatic reconnection with exponential backoff
- Support for basic key-value operations
- Sorted set operations for leaderboard management
- Health checks and connection status monitoring

**Configuration:**
```env
REDIS_URL=redis://localhost:6379
```

### SessionStore

The `SessionStore` manages user sessions using Redis as the backend store.

**Features:**
- Session creation with automatic expiration (24 hours)
- Session validation and retrieval
- Session updates and refreshes
- Automatic cleanup of expired sessions
- Session data structure with user information and timestamps

**Session Data:**
```typescript
interface SessionData {
  userId: string;
  email: string;
  name: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}
```

### CacheService

The `CacheService` provides high-level caching operations for different data types with appropriate TTL policies.

## Cache TTL Policies

Different data types have different cache lifetimes optimized for their update frequency:

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Session | 24 hours | User sessions persist for a full day |
| Leaderboard | 5 minutes | Updated frequently as scores change |
| Match Schedule | 1 hour | Rarely changes during tournament |
| User Registration | 30 minutes | Checked periodically for registration status |
| Match Scores | 2 minutes | Real-time updates during matches |
| Lockdown Status | 30 minutes | Checked before prediction submission |
| User Scores | 10 minutes | Updated after each match result |

## Cache Keys

Cache keys use prefixes to organize data:

```
session:{token}                    - User session data
leaderboard:all                    - All-phase leaderboard
leaderboard:group                  - Group stage leaderboard
leaderboard:elimination            - Elimination phase leaderboard
user:scores:{userId}               - User's total and phase scores
match:scores:{matchId}             - Real-time match scores
match:locked:{matchId}             - Match lockdown status
user:registration:{userId}         - User registration status
match:schedule:{phase}             - Match schedule for phase
```

## Usage Examples

### Session Management

```typescript
import { SessionStore } from './cache';

// Create a session
await sessionStore.createSession(token, {
  userId: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
  token: 'jwt-token',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

// Retrieve a session
const session = await sessionStore.getSession(token);

// Validate a session
const isValid = await sessionStore.validateSession(token);

// Refresh session expiration
await sessionStore.refreshSession(token);

// Delete a session
await sessionStore.deleteSession(token);
```

### Caching Data

```typescript
import { CacheService } from './cache';

// Cache leaderboard
await cacheService.cacheLeaderboard('all', leaderboardData);

// Get cached leaderboard
const leaderboard = await cacheService.getLeaderboard('all');

// Invalidate leaderboard cache
await cacheService.invalidateLeaderboard('all');

// Cache user scores
await cacheService.cacheUserScores(userId, scoresData);

// Cache match schedule
await cacheService.cacheMatchSchedule('group', scheduleData);

// Cache real-time match scores
await cacheService.cacheMatchScores(matchId, scoresData);

// Cache match lockdown status
await cacheService.cacheMatchLockdown(matchId, true);

// Clear all caches
await cacheService.clearAll();
```

### Leaderboard Operations

```typescript
import { RedisService } from './cache';

// Add user to leaderboard sorted set
await redisService.addToSortedSet('leaderboard:all', 100, 'user-123');

// Get top 10 users
const topUsers = await redisService.getSortedSetRange('leaderboard:all', 0, 9);

// Get user's rank
const rank = await redisService.getSortedSetRank('leaderboard:all', 'user-123');

// Increment user's score
await redisService.incrementSortedSetScore('leaderboard:all', 'user-123', 10);
```

## Integration with NestJS

The cache module is integrated into the NestJS application through the `CacheModule`:

```typescript
import { CacheModule } from './cache';

@Module({
  imports: [CacheModule],
})
export class AppModule {}
```

All cache services are automatically available for dependency injection:

```typescript
import { RedisService, SessionStore, CacheService } from './cache';

@Injectable()
export class MyService {
  constructor(
    private redisService: RedisService,
    private sessionStore: SessionStore,
    private cacheService: CacheService,
  ) {}
}
```

## Health Checks

The cache module provides health check endpoints:

```
GET /health/redis     - Check Redis connection status
GET /health           - Check overall system health (includes Redis)
```

Response format:
```json
{
  "status": "healthy",
  "message": "Redis connection is active"
}
```

## Error Handling

The cache module gracefully handles errors:

- **Connection Failures**: Automatic retry with exponential backoff
- **Operation Failures**: Logged and returned as null/empty results
- **Expired Sessions**: Automatically cleaned up and return null
- **Disconnection**: Operations fail gracefully without throwing

## Performance Considerations

### Connection Pooling

Redis connections are pooled and reused to minimize overhead:
- Single client instance per service
- Automatic reconnection on failure
- Connection timeout: 10 seconds
- Reconnection strategy: exponential backoff (max 10 retries)

### Sorted Set Operations

Leaderboard operations use Redis sorted sets for O(log n) performance:
- Adding/updating scores: O(log n)
- Getting rank: O(log n)
- Getting range: O(log n + m) where m is result size

### Cache Invalidation

Strategic cache invalidation ensures data freshness:
- Leaderboard invalidated on score changes
- User scores invalidated on prediction scoring
- Match schedule invalidated on bracket configuration
- Session invalidated on logout

## Testing

The cache module includes comprehensive unit tests:

```bash
npm test -- --testPathPatterns="cache"
```

Test coverage includes:
- Redis connection and reconnection
- Session lifecycle (create, get, update, delete, refresh)
- Cache operations for all data types
- Error handling and edge cases
- TTL enforcement
- Sorted set operations

## Monitoring

Monitor Redis performance with these metrics:

- **Connection Status**: Check `isHealthy()` method
- **Operation Latency**: Monitor Redis command execution time
- **Memory Usage**: Monitor Redis memory consumption
- **Key Count**: Monitor number of cached keys
- **Eviction**: Monitor key eviction due to memory limits

## Troubleshooting

### Redis Connection Issues

1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL environment variable
3. Verify network connectivity to Redis server
4. Check Redis logs for errors

### Session Expiration Issues

1. Verify CACHE_TTL.SESSION is set correctly (24 hours)
2. Check Redis memory limits aren't causing eviction
3. Monitor Redis INFO stats for evicted keys

### Cache Invalidation Issues

1. Ensure cache invalidation is called after data updates
2. Verify cache keys match between set and get operations
3. Check for race conditions in concurrent operations

## Future Enhancements

- [ ] Redis Cluster support for high availability
- [ ] Cache warming strategies for frequently accessed data
- [ ] Distributed cache invalidation across multiple instances
- [ ] Cache statistics and monitoring dashboard
- [ ] Automatic cache key expiration policies
- [ ] Redis Streams for real-time event processing
