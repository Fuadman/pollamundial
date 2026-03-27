import { Injectable } from '@nestjs/common';
import { RedisService, CACHE_TTL, CACHE_KEYS } from './redis.service';
import { LoggerService } from '../common/logger/logger.service';

/**
 * High-level cache service for managing different data types with appropriate TTL policies
 */
@Injectable()
export class CacheService {
  constructor(
    private redisService: RedisService,
    private logger: LoggerService,
  ) {}

  /**
   * Cache leaderboard data
   */
  async cacheLeaderboard(phase: 'all' | 'group' | 'elimination', data: any): Promise<void> {
    try {
      const key =
        phase === 'all'
          ? CACHE_KEYS.LEADERBOARD_ALL
          : phase === 'group'
            ? CACHE_KEYS.LEADERBOARD_GROUP
            : CACHE_KEYS.LEADERBOARD_ELIMINATION;

      await this.redisService.set(key, data, CACHE_TTL.LEADERBOARD);
      this.logger.log(`Leaderboard cached for phase: ${phase}`);
    } catch (error) {
      this.logger.error(`Error caching leaderboard: ${error}`);
    }
  }

  /**
   * Get cached leaderboard data
   */
  async getLeaderboard(phase: 'all' | 'group' | 'elimination'): Promise<any | null> {
    try {
      const key =
        phase === 'all'
          ? CACHE_KEYS.LEADERBOARD_ALL
          : phase === 'group'
            ? CACHE_KEYS.LEADERBOARD_GROUP
            : CACHE_KEYS.LEADERBOARD_ELIMINATION;

      return await this.redisService.get(key);
    } catch (error) {
      this.logger.error(`Error getting leaderboard from cache: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate leaderboard cache
   */
  async invalidateLeaderboard(phase?: 'all' | 'group' | 'elimination'): Promise<void> {
    try {
      if (phase) {
        const key =
          phase === 'all'
            ? CACHE_KEYS.LEADERBOARD_ALL
            : phase === 'group'
              ? CACHE_KEYS.LEADERBOARD_GROUP
              : CACHE_KEYS.LEADERBOARD_ELIMINATION;
        await this.redisService.delete(key);
      } else {
        // Invalidate all leaderboard caches
        await this.redisService.deleteMany([
          CACHE_KEYS.LEADERBOARD_ALL,
          CACHE_KEYS.LEADERBOARD_GROUP,
          CACHE_KEYS.LEADERBOARD_ELIMINATION,
        ]);
      }
      this.logger.log(`Leaderboard cache invalidated${phase ? ` for phase: ${phase}` : ''}`);
    } catch (error) {
      this.logger.error(`Error invalidating leaderboard cache: ${error}`);
    }
  }

  /**
   * Cache user scores
   */
  async cacheUserScores(userId: string, scores: any): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_SCORES}${userId}`;
      await this.redisService.set(key, scores, CACHE_TTL.USER_SCORES);
      this.logger.log(`User scores cached for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error caching user scores: ${error}`);
    }
  }

  /**
   * Get cached user scores
   */
  async getUserScores(userId: string): Promise<any | null> {
    try {
      const key = `${CACHE_KEYS.USER_SCORES}${userId}`;
      return await this.redisService.get(key);
    } catch (error) {
      this.logger.error(`Error getting user scores from cache: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate user scores cache
   */
  async invalidateUserScores(userId: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_SCORES}${userId}`;
      await this.redisService.delete(key);
      this.logger.log(`User scores cache invalidated for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating user scores cache: ${error}`);
    }
  }

  /**
   * Cache match schedule
   */
  async cacheMatchSchedule(phase: 'group' | 'elimination', data: any): Promise<void> {
    try {
      const key = `${CACHE_KEYS.MATCH_SCHEDULE}${phase}`;
      await this.redisService.set(key, data, CACHE_TTL.MATCH_SCHEDULE);
      this.logger.log(`Match schedule cached for phase: ${phase}`);
    } catch (error) {
      this.logger.error(`Error caching match schedule: ${error}`);
    }
  }

  /**
   * Get cached match schedule
   */
  async getMatchSchedule(phase: 'group' | 'elimination'): Promise<any | null> {
    try {
      const key = `${CACHE_KEYS.MATCH_SCHEDULE}${phase}`;
      return await this.redisService.get(key);
    } catch (error) {
      this.logger.error(`Error getting match schedule from cache: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate match schedule cache
   */
  async invalidateMatchSchedule(phase?: 'group' | 'elimination'): Promise<void> {
    try {
      if (phase) {
        const key = `${CACHE_KEYS.MATCH_SCHEDULE}${phase}`;
        await this.redisService.delete(key);
      } else {
        // Invalidate all match schedule caches
        await this.redisService.deleteMany([
          `${CACHE_KEYS.MATCH_SCHEDULE}group`,
          `${CACHE_KEYS.MATCH_SCHEDULE}elimination`,
        ]);
      }
      this.logger.log(`Match schedule cache invalidated${phase ? ` for phase: ${phase}` : ''}`);
    } catch (error) {
      this.logger.error(`Error invalidating match schedule cache: ${error}`);
    }
  }

  /**
   * Cache real-time match scores
   */
  async cacheMatchScores(matchId: string, scores: any): Promise<void> {
    try {
      const key = `${CACHE_KEYS.MATCH_SCORES}${matchId}`;
      await this.redisService.set(key, scores, CACHE_TTL.MATCH_SCORES);
      this.logger.log(`Match scores cached for match: ${matchId}`);
    } catch (error) {
      this.logger.error(`Error caching match scores: ${error}`);
    }
  }

  /**
   * Get cached match scores
   */
  async getMatchScores(matchId: string): Promise<any | null> {
    try {
      const key = `${CACHE_KEYS.MATCH_SCORES}${matchId}`;
      return await this.redisService.get(key);
    } catch (error) {
      this.logger.error(`Error getting match scores from cache: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate match scores cache
   */
  async invalidateMatchScores(matchId: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.MATCH_SCORES}${matchId}`;
      await this.redisService.delete(key);
      this.logger.log(`Match scores cache invalidated for match: ${matchId}`);
    } catch (error) {
      this.logger.error(`Error invalidating match scores cache: ${error}`);
    }
  }

  /**
   * Cache user registration status
   */
  async cacheUserRegistration(userId: string, status: any): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_REGISTRATION}${userId}`;
      await this.redisService.set(key, status, CACHE_TTL.USER_REGISTRATION);
      this.logger.log(`User registration status cached for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error caching user registration status: ${error}`);
    }
  }

  /**
   * Get cached user registration status
   */
  async getUserRegistration(userId: string): Promise<any | null> {
    try {
      const key = `${CACHE_KEYS.USER_REGISTRATION}${userId}`;
      return await this.redisService.get(key);
    } catch (error) {
      this.logger.error(`Error getting user registration status from cache: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate user registration cache
   */
  async invalidateUserRegistration(userId: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_REGISTRATION}${userId}`;
      await this.redisService.delete(key);
      this.logger.log(`User registration cache invalidated for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating user registration cache: ${error}`);
    }
  }

  /**
   * Cache match lockdown status
   */
  async cacheMatchLockdown(matchId: string, isLocked: boolean): Promise<void> {
    try {
      const key = `${CACHE_KEYS.MATCH_LOCKED}${matchId}`;
      await this.redisService.set(key, { isLocked, timestamp: new Date() }, CACHE_TTL.LOCKDOWN_STATUS);
      this.logger.log(`Match lockdown status cached for match: ${matchId}`);
    } catch (error) {
      this.logger.error(`Error caching match lockdown status: ${error}`);
    }
  }

  /**
   * Get cached match lockdown status
   */
  async getMatchLockdown(matchId: string): Promise<boolean | null> {
    try {
      const key = `${CACHE_KEYS.MATCH_LOCKED}${matchId}`;
      const data = await this.redisService.get<{ isLocked: boolean }>(key);
      return data?.isLocked ?? null;
    } catch (error) {
      this.logger.error(`Error getting match lockdown status from cache: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate match lockdown cache
   */
  async invalidateMatchLockdown(matchId: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.MATCH_LOCKED}${matchId}`;
      await this.redisService.delete(key);
      this.logger.log(`Match lockdown cache invalidated for match: ${matchId}`);
    } catch (error) {
      this.logger.error(`Error invalidating match lockdown cache: ${error}`);
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    try {
      await this.redisService.clear();
      this.logger.log('All caches cleared');
    } catch (error) {
      this.logger.error(`Error clearing all caches: ${error}`);
    }
  }
}
