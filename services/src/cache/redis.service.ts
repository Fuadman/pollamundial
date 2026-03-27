import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType, RedisModules } from 'redis';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Redis cache TTL policies for different data types
 */
export const CACHE_TTL = {
  // Session cache - 24 hours
  SESSION: 24 * 60 * 60,
  // Leaderboard cache - 5 minutes
  LEADERBOARD: 5 * 60,
  // Match schedule cache - 1 hour
  MATCH_SCHEDULE: 60 * 60,
  // User registration status - 30 minutes
  USER_REGISTRATION: 30 * 60,
  // Real-time match scores - 2 minutes
  MATCH_SCORES: 2 * 60,
  // Lockdown status - 30 minutes
  LOCKDOWN_STATUS: 30 * 60,
  // User scores - 10 minutes
  USER_SCORES: 10 * 60,
};

/**
 * Redis cache key prefixes
 */
export const CACHE_KEYS = {
  SESSION: 'session:',
  LEADERBOARD_ALL: 'leaderboard:all',
  LEADERBOARD_GROUP: 'leaderboard:group',
  LEADERBOARD_ELIMINATION: 'leaderboard:elimination',
  USER_SCORES: 'user:scores:',
  MATCH_SCORES: 'match:scores:',
  MATCH_LOCKED: 'match:locked:',
  USER_REGISTRATION: 'user:registration:',
  MATCH_SCHEDULE: 'match:schedule:',
};

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType<RedisModules>;
  private isConnected = false;
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000; // 3 seconds

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to Redis with connection pooling and retry logic
   */
  private async connect(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');

        this.client = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                this.logger.error('Redis reconnection failed after 10 attempts');
                return new Error('Redis max retries exceeded');
              }
              return retries * 50;
            },
            connectTimeout: 10000,
          },
        });

        // Set up event listeners
        this.client.on('error', (err) => {
          this.logger.error(`Redis error: ${err.message}`);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          this.logger.log('Redis connected');
          this.isConnected = true;
        });

        this.client.on('ready', () => {
          this.logger.log('Redis ready');
        });

        this.client.on('reconnecting', () => {
          this.logger.warn('Redis reconnecting...');
        });

        await this.client.connect();
        this.isConnected = true;
        this.logger.log('Redis connection established successfully');
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Redis connection attempt ${attempt}/${this.maxRetries} failed: ${lastError.message}`,
        );

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }

    this.isConnected = false;
    this.logger.error(
      `Failed to connect to Redis after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
    throw new Error(
      `Redis connection failed after ${this.maxRetries} retries: ${lastError?.message}`,
    );
  }

  /**
   * Disconnect from Redis
   */
  private async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.logger.log('Redis connection closed');
      } catch (error) {
        this.logger.error(`Error closing Redis connection: ${error}`);
      }
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot get key: ${key}`);
        return null;
      }

      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis: ${error}`);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot set key: ${key}`);
        return;
      }

      const serialized = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis: ${error}`);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot delete key: ${key}`);
        return;
      }

      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis: ${error}`);
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async deleteMany(keys: string[]): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot delete keys`);
        return;
      }

      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      this.logger.error(`Error deleting multiple keys from Redis: ${error}`);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot clear cache`);
        return;
      }

      await this.client.flushDb();
      this.logger.log('Redis cache cleared');
    } catch (error) {
      this.logger.error(`Error clearing Redis cache: ${error}`);
    }
  }

  /**
   * Add a member to a sorted set (for leaderboard)
   */
  async addToSortedSet(key: string, score: number, member: string): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot add to sorted set: ${key}`);
        return;
      }

      await this.client.zAdd(key, { score, value: member });
    } catch (error) {
      this.logger.error(`Error adding to sorted set ${key}: ${error}`);
    }
  }

  /**
   * Get range from sorted set (for leaderboard)
   */
  async getSortedSetRange(
    key: string,
    start: number,
    stop: number,
    reverse = true,
  ): Promise<Array<{ member: string; score: number }>> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot get sorted set range: ${key}`);
        return [];
      }

      const options = { REV: reverse };
      const members = await this.client.zRangeWithScores(key, start, stop, options);

      return members.map((item) => ({
        member: item.value,
        score: item.score,
      }));
    } catch (error) {
      this.logger.error(`Error getting sorted set range ${key}: ${error}`);
      return [];
    }
  }

  /**
   * Get rank of a member in sorted set
   */
  async getSortedSetRank(key: string, member: string, reverse = true): Promise<number | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot get sorted set rank: ${key}`);
        return null;
      }

      const rank = reverse
        ? await this.client.zRevRank(key, member)
        : await this.client.zRank(key, member);

      return rank !== null ? rank + 1 : null; // Convert 0-indexed to 1-indexed
    } catch (error) {
      this.logger.error(`Error getting sorted set rank ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Increment score in sorted set
   */
  async incrementSortedSetScore(key: string, member: string, increment: number): Promise<number> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot increment sorted set score: ${key}`);
        return 0;
      }

      const newScore = await this.client.zIncrBy(key, increment, member);
      return newScore;
    } catch (error) {
      this.logger.error(`Error incrementing sorted set score ${key}: ${error}`);
      return 0;
    }
  }

  /**
   * Get all members of a sorted set
   */
  async getAllSortedSetMembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis not connected, cannot get sorted set members: ${key}`);
        return [];
      }

      return await this.client.zRange(key, 0, -1);
    } catch (error) {
      this.logger.error(`Error getting sorted set members ${key}: ${error}`);
      return [];
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          message: 'Redis connection not established',
        };
      }

      await this.client.ping();
      return {
        status: 'healthy',
        message: 'Redis connection is active',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        message: `Redis health check failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get connection status
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Helper method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
