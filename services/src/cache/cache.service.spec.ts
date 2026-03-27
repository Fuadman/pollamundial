import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService, CACHE_TTL, CACHE_KEYS } from './redis.service';
import { LoggerService } from '../common/logger/logger.service';

describe('CacheService', () => {
  let service: CacheService;
  let redisService: RedisService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
            clear: jest.fn(),
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

    service = module.get<CacheService>(CacheService);
    redisService = module.get<RedisService>(RedisService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  describe('Leaderboard caching', () => {
    it('should cache leaderboard for all phase', async () => {
      const data = { entries: [] };
      await service.cacheLeaderboard('all', data);

      expect(redisService.set).toHaveBeenCalledWith(
        CACHE_KEYS.LEADERBOARD_ALL,
        data,
        CACHE_TTL.LEADERBOARD,
      );
    });

    it('should cache leaderboard for group phase', async () => {
      const data = { entries: [] };
      await service.cacheLeaderboard('group', data);

      expect(redisService.set).toHaveBeenCalledWith(
        CACHE_KEYS.LEADERBOARD_GROUP,
        data,
        CACHE_TTL.LEADERBOARD,
      );
    });

    it('should cache leaderboard for elimination phase', async () => {
      const data = { entries: [] };
      await service.cacheLeaderboard('elimination', data);

      expect(redisService.set).toHaveBeenCalledWith(
        CACHE_KEYS.LEADERBOARD_ELIMINATION,
        data,
        CACHE_TTL.LEADERBOARD,
      );
    });

    it('should get cached leaderboard', async () => {
      const data = { entries: [] };
      (redisService.get as jest.Mock).mockResolvedValueOnce(data);

      const result = await service.getLeaderboard('all');

      expect(result).toEqual(data);
      expect(redisService.get).toHaveBeenCalledWith(CACHE_KEYS.LEADERBOARD_ALL);
    });

    it('should invalidate specific leaderboard phase', async () => {
      await service.invalidateLeaderboard('group');

      expect(redisService.delete).toHaveBeenCalledWith(CACHE_KEYS.LEADERBOARD_GROUP);
    });

    it('should invalidate all leaderboard phases', async () => {
      await service.invalidateLeaderboard();

      expect(redisService.deleteMany).toHaveBeenCalledWith([
        CACHE_KEYS.LEADERBOARD_ALL,
        CACHE_KEYS.LEADERBOARD_GROUP,
        CACHE_KEYS.LEADERBOARD_ELIMINATION,
      ]);
    });
  });

  describe('User scores caching', () => {
    it('should cache user scores', async () => {
      const scores = { totalPoints: 100 };
      await service.cacheUserScores('user-123', scores);

      expect(redisService.set).toHaveBeenCalledWith(
        `${CACHE_KEYS.USER_SCORES}user-123`,
        scores,
        CACHE_TTL.USER_SCORES,
      );
    });

    it('should get cached user scores', async () => {
      const scores = { totalPoints: 100 };
      (redisService.get as jest.Mock).mockResolvedValueOnce(scores);

      const result = await service.getUserScores('user-123');

      expect(result).toEqual(scores);
    });

    it('should invalidate user scores', async () => {
      await service.invalidateUserScores('user-123');

      expect(redisService.delete).toHaveBeenCalledWith(`${CACHE_KEYS.USER_SCORES}user-123`);
    });
  });

  describe('Match schedule caching', () => {
    it('should cache match schedule for group phase', async () => {
      const schedule = { matches: [] };
      await service.cacheMatchSchedule('group', schedule);

      expect(redisService.set).toHaveBeenCalledWith(
        `${CACHE_KEYS.MATCH_SCHEDULE}group`,
        schedule,
        CACHE_TTL.MATCH_SCHEDULE,
      );
    });

    it('should cache match schedule for elimination phase', async () => {
      const schedule = { matches: [] };
      await service.cacheMatchSchedule('elimination', schedule);

      expect(redisService.set).toHaveBeenCalledWith(
        `${CACHE_KEYS.MATCH_SCHEDULE}elimination`,
        schedule,
        CACHE_TTL.MATCH_SCHEDULE,
      );
    });

    it('should get cached match schedule', async () => {
      const schedule = { matches: [] };
      (redisService.get as jest.Mock).mockResolvedValueOnce(schedule);

      const result = await service.getMatchSchedule('group');

      expect(result).toEqual(schedule);
    });

    it('should invalidate specific match schedule phase', async () => {
      await service.invalidateMatchSchedule('group');

      expect(redisService.delete).toHaveBeenCalledWith(`${CACHE_KEYS.MATCH_SCHEDULE}group`);
    });

    it('should invalidate all match schedules', async () => {
      await service.invalidateMatchSchedule();

      expect(redisService.deleteMany).toHaveBeenCalledWith([
        `${CACHE_KEYS.MATCH_SCHEDULE}group`,
        `${CACHE_KEYS.MATCH_SCHEDULE}elimination`,
      ]);
    });
  });

  describe('Match scores caching', () => {
    it('should cache match scores', async () => {
      const scores = { team1Score: 2, team2Score: 1 };
      await service.cacheMatchScores('match-123', scores);

      expect(redisService.set).toHaveBeenCalledWith(
        `${CACHE_KEYS.MATCH_SCORES}match-123`,
        scores,
        CACHE_TTL.MATCH_SCORES,
      );
    });

    it('should get cached match scores', async () => {
      const scores = { team1Score: 2, team2Score: 1 };
      (redisService.get as jest.Mock).mockResolvedValueOnce(scores);

      const result = await service.getMatchScores('match-123');

      expect(result).toEqual(scores);
    });

    it('should invalidate match scores', async () => {
      await service.invalidateMatchScores('match-123');

      expect(redisService.delete).toHaveBeenCalledWith(`${CACHE_KEYS.MATCH_SCORES}match-123`);
    });
  });

  describe('User registration caching', () => {
    it('should cache user registration status', async () => {
      const status = { completed: true };
      await service.cacheUserRegistration('user-123', status);

      expect(redisService.set).toHaveBeenCalledWith(
        `${CACHE_KEYS.USER_REGISTRATION}user-123`,
        status,
        CACHE_TTL.USER_REGISTRATION,
      );
    });

    it('should get cached user registration status', async () => {
      const status = { completed: true };
      (redisService.get as jest.Mock).mockResolvedValueOnce(status);

      const result = await service.getUserRegistration('user-123');

      expect(result).toEqual(status);
    });

    it('should invalidate user registration cache', async () => {
      await service.invalidateUserRegistration('user-123');

      expect(redisService.delete).toHaveBeenCalledWith(
        `${CACHE_KEYS.USER_REGISTRATION}user-123`,
      );
    });
  });

  describe('Match lockdown caching', () => {
    it('should cache match lockdown status', async () => {
      await service.cacheMatchLockdown('match-123', true);

      expect(redisService.set).toHaveBeenCalledWith(
        `${CACHE_KEYS.MATCH_LOCKED}match-123`,
        expect.objectContaining({ isLocked: true }),
        CACHE_TTL.LOCKDOWN_STATUS,
      );
    });

    it('should get cached match lockdown status', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce({ isLocked: true });

      const result = await service.getMatchLockdown('match-123');

      expect(result).toBe(true);
    });

    it('should return null when lockdown cache is empty', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getMatchLockdown('match-123');

      expect(result).toBeNull();
    });

    it('should invalidate match lockdown cache', async () => {
      await service.invalidateMatchLockdown('match-123');

      expect(redisService.delete).toHaveBeenCalledWith(`${CACHE_KEYS.MATCH_LOCKED}match-123`);
    });
  });

  describe('Clear all caches', () => {
    it('should clear all caches', async () => {
      await service.clearAll();

      expect(redisService.clear).toHaveBeenCalled();
      expect(loggerService.log).toHaveBeenCalledWith('All caches cleared');
    });

    it('should handle errors when clearing caches', async () => {
      (redisService.clear as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await service.clearAll();

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error clearing all caches'),
      );
    });
  });

  describe('Error handling', () => {
    it('should handle errors when caching leaderboard', async () => {
      (redisService.set as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await service.cacheLeaderboard('all', {});

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error caching leaderboard'),
      );
    });

    it('should handle errors when getting leaderboard', async () => {
      (redisService.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.getLeaderboard('all');

      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting leaderboard from cache'),
      );
    });
  });
});
