import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { RedisService } from '../../cache/redis.service';
import { User } from '../../entities/user.entity';

describe('SessionService', () => {
  let service: SessionService;
  let jwtService: JwtService;
  let redisService: RedisService;

  const mockUser: User = {
    id: 'test-user-id',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    registrationCompleted: true,
    paymentCompleted: true,
    registrationTimestamp: new Date(),
    paymentTimestamp: new Date(),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    predictions: [],
    scores: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_EXPIRATION: '3600',
              };
              return config[key];
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
  });

  describe('createSession', () => {
    it('should create a session with access and refresh tokens', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(accessToken);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(refreshToken);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      const result = await service.createSession(mockUser);

      expect(result.accessToken).toEqual(accessToken);
      expect(result.refreshToken).toEqual(refreshToken);
      expect(result.expiresIn).toBe(3600);
      expect(redisService.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session', async () => {
      const token = 'valid-token';
      const payload = { sub: 'test-user-id', email: 'test@example.com' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValue(JSON.stringify({ userId: 'test-user-id' }));

      const result = await service.validateSession(token);

      expect(result).toEqual(payload);
    });

    it('should return null if session not found in Redis', async () => {
      const token = 'valid-token';
      const payload = { sub: 'test-user-id', email: 'test@example.com' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await service.validateSession(token);

      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid-token';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateSession(token);

      expect(result).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 'test-user-id', type: 'refresh' };
      const newAccessToken = 'new-access-token';

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(redisService, 'get').mockResolvedValue(refreshToken);
      jest.spyOn(jwtService, 'sign').mockReturnValue(newAccessToken);

      const result = await service.refreshSession(refreshToken);

      expect(result?.accessToken).toEqual(newAccessToken);
      expect(result?.expiresIn).toBe(3600);
    });

    it('should return null if refresh token type is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';
      const payload = { sub: 'test-user-id', type: 'access' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);

      const result = await service.refreshSession(refreshToken);

      expect(result).toBeNull();
    });

    it('should return null if refresh token not found in Redis', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 'test-user-id', type: 'refresh' };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await service.refreshSession(refreshToken);

      expect(result).toBeNull();
    });
  });

  describe('destroySession', () => {
    it('should destroy session', async () => {
      jest.spyOn(redisService, 'delete').mockResolvedValue(undefined);

      await service.destroySession('test-user-id');

      expect(redisService.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSessionInfo', () => {
    it('should get session info', async () => {
      const sessionInfo = { userId: 'test-user-id', email: 'test@example.com' };

      jest
        .spyOn(redisService, 'get')
        .mockResolvedValue(JSON.stringify(sessionInfo));

      const result = await service.getSessionInfo('test-user-id');

      expect(result).toEqual(sessionInfo);
    });

    it('should return null if session not found', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await service.getSessionInfo('test-user-id');

      expect(result).toBeNull();
    });
  });

  describe('isSessionActive', () => {
    it('should return true if session is active', async () => {
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValue(JSON.stringify({ userId: 'test-user-id' }));

      const result = await service.isSessionActive('test-user-id');

      expect(result).toBe(true);
    });

    it('should return false if session is not active', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await service.isSessionActive('test-user-id');

      expect(result).toBe(false);
    });
  });
});
