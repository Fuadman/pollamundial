import { Test, TestingModule } from '@nestjs/testing';
import { SessionStore, SessionData } from './session.store';
import { RedisService, CACHE_TTL } from './redis.service';
import { LoggerService } from '../common/logger/logger.service';

describe('SessionStore', () => {
  let store: SessionStore;
  let redisService: RedisService;
  let loggerService: LoggerService;

  const mockSessionData: SessionData = {
    userId: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    token: 'test-token',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionStore,
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
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

    store = module.get<SessionStore>(SessionStore);
    redisService = module.get<RedisService>(RedisService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  describe('createSession', () => {
    it('should create a session with correct TTL', async () => {
      await store.createSession('test-token', mockSessionData);

      expect(redisService.set).toHaveBeenCalledWith(
        'session:test-token',
        mockSessionData,
        CACHE_TTL.SESSION,
      );
      expect(loggerService.log).toHaveBeenCalledWith('Session created for user: user-123');
    });

    it('should handle errors during session creation', async () => {
      (redisService.set as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(store.createSession('test-token', mockSessionData)).rejects.toThrow(
        'Redis error',
      );
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error creating session'),
      );
    });
  });

  describe('getSession', () => {
    it('should retrieve a valid session', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(mockSessionData);

      const result = await store.getSession('test-token');

      expect(result).toEqual(mockSessionData);
      expect(redisService.get).toHaveBeenCalledWith('session:test-token');
    });

    it('should return null for non-existent session', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await store.getSession('test-token');

      expect(result).toBeNull();
    });

    it('should return null for expired session', async () => {
      const expiredSession: SessionData = {
        ...mockSessionData,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      (redisService.get as jest.Mock).mockResolvedValueOnce(expiredSession);

      const result = await store.getSession('test-token');

      expect(result).toBeNull();
      expect(redisService.delete).toHaveBeenCalledWith('session:test-token');
    });

    it('should handle errors during session retrieval', async () => {
      (redisService.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      const result = await store.getSession('test-token');

      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting session'),
      );
    });
  });

  describe('updateSession', () => {
    it('should update an existing session', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(mockSessionData);

      await store.updateSession('test-token', { name: 'Updated User' });

      expect(redisService.set).toHaveBeenCalledWith(
        'session:test-token',
        expect.objectContaining({
          ...mockSessionData,
          name: 'Updated User',
        }),
        CACHE_TTL.SESSION,
      );
      expect(loggerService.log).toHaveBeenCalledWith('Session updated for user: user-123');
    });

    it('should warn when updating non-existent session', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);

      await store.updateSession('test-token', { name: 'Updated User' });

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Session not found for token: test-token',
      );
    });

    it('should handle errors during session update', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(mockSessionData);
      (redisService.set as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(store.updateSession('test-token', { name: 'Updated' })).rejects.toThrow(
        'Redis error',
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      await store.deleteSession('test-token');

      expect(redisService.delete).toHaveBeenCalledWith('session:test-token');
      expect(loggerService.log).toHaveBeenCalledWith('Session deleted for token: test-token');
    });

    it('should handle errors during session deletion', async () => {
      (redisService.delete as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(store.deleteSession('test-token')).rejects.toThrow('Redis error');
    });
  });

  describe('validateSession', () => {
    it('should return true for valid session', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(mockSessionData);

      const result = await store.validateSession('test-token');

      expect(result).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await store.validateSession('test-token');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (redisService.get as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      const result = await store.validateSession('test-token');

      expect(result).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should refresh session expiration', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(mockSessionData);

      await store.refreshSession('test-token');

      expect(redisService.set).toHaveBeenCalledWith(
        'session:test-token',
        expect.objectContaining({
          userId: 'user-123',
          expiresAt: expect.any(Date),
        }),
        CACHE_TTL.SESSION,
      );
      expect(loggerService.log).toHaveBeenCalledWith('Session refreshed for user: user-123');
    });

    it('should warn when refreshing non-existent session', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(null);

      await store.refreshSession('test-token');

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Cannot refresh non-existent session: test-token',
      );
    });

    it('should handle errors during session refresh', async () => {
      (redisService.get as jest.Mock).mockResolvedValueOnce(mockSessionData);
      (redisService.set as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));

      await expect(store.refreshSession('test-token')).rejects.toThrow('Redis error');
    });
  });;

  describe('getUserSessions', () => {
    it('should return empty array', async () => {
      const result = await store.getUserSessions('user-123');

      expect(result).toEqual([]);
      expect(loggerService.log).toHaveBeenCalledWith('Getting sessions for user: user-123');
    });
  });

  describe('invalidateUserSessions', () => {
    it('should invalidate user sessions', async () => {
      await store.invalidateUserSessions('user-123');

      expect(loggerService.log).toHaveBeenCalledWith(
        'Invalidated all sessions for user: user-123',
      );
    });
  });
});
