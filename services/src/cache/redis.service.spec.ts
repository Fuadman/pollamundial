import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService, CACHE_TTL, CACHE_KEYS } from './redis.service';
import { LoggerService } from '../common/logger/logger.service';

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                REDIS_URL: 'redis://localhost:6379',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  describe('CACHE_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.SESSION).toBe(24 * 60 * 60); // 24 hours
      expect(CACHE_TTL.LEADERBOARD).toBe(5 * 60); // 5 minutes
      expect(CACHE_TTL.MATCH_SCHEDULE).toBe(60 * 60); // 1 hour
      expect(CACHE_TTL.USER_REGISTRATION).toBe(30 * 60); // 30 minutes
      expect(CACHE_TTL.MATCH_SCORES).toBe(2 * 60); // 2 minutes
      expect(CACHE_TTL.LOCKDOWN_STATUS).toBe(30 * 60); // 30 minutes
      expect(CACHE_TTL.USER_SCORES).toBe(10 * 60); // 10 minutes
    });
  });

  describe('CACHE_KEYS constants', () => {
    it('should have correct cache key prefixes', () => {
      expect(CACHE_KEYS.SESSION).toBe('session:');
      expect(CACHE_KEYS.LEADERBOARD_ALL).toBe('leaderboard:all');
      expect(CACHE_KEYS.LEADERBOARD_GROUP).toBe('leaderboard:group');
      expect(CACHE_KEYS.LEADERBOARD_ELIMINATION).toBe('leaderboard:elimination');
      expect(CACHE_KEYS.USER_SCORES).toBe('user:scores:');
      expect(CACHE_KEYS.MATCH_SCORES).toBe('match:scores:');
      expect(CACHE_KEYS.MATCH_LOCKED).toBe('match:locked:');
      expect(CACHE_KEYS.USER_REGISTRATION).toBe('user:registration:');
      expect(CACHE_KEYS.MATCH_SCHEDULE).toBe('match:schedule:');
    });
  });

  describe('healthCheck', () => {
    it('should return unhealthy status when not connected', async () => {
      const result = await service.healthCheck();
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Redis connection not established');
    });
  });

  describe('isHealthy', () => {
    it('should return false when not connected', () => {
      expect(service.isHealthy()).toBe(false);
    });
  });

  describe('get', () => {
    it('should return null when not connected', async () => {
      const result = await service.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should not throw when not connected', async () => {
      await expect(service.set('test-key', 'test-value')).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should not throw when not connected', async () => {
      await expect(service.delete('test-key')).resolves.not.toThrow();
    });
  });

  describe('deleteMany', () => {
    it('should not throw when not connected', async () => {
      await expect(service.deleteMany(['key1', 'key2'])).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should not throw when not connected', async () => {
      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe('addToSortedSet', () => {
    it('should not throw when not connected', async () => {
      await expect(service.addToSortedSet('test-key', 100, 'member')).resolves.not.toThrow();
    });
  });

  describe('getSortedSetRange', () => {
    it('should return empty array when not connected', async () => {
      const result = await service.getSortedSetRange('test-key', 0, 10);
      expect(result).toEqual([]);
    });
  });

  describe('getSortedSetRank', () => {
    it('should return null when not connected', async () => {
      const result = await service.getSortedSetRank('test-key', 'member');
      expect(result).toBeNull();
    });
  });

  describe('incrementSortedSetScore', () => {
    it('should return 0 when not connected', async () => {
      const result = await service.incrementSortedSetScore('test-key', 'member', 10);
      expect(result).toBe(0);
    });
  });

  describe('getAllSortedSetMembers', () => {
    it('should return empty array when not connected', async () => {
      const result = await service.getAllSortedSetMembers('test-key');
      expect(result).toEqual([]);
    });
  });
});
