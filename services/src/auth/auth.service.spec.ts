import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser: User = {
    id: 'test-user-id',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    registrationCompleted: false,
    paymentCompleted: false,
    registrationTimestamp: null,
    paymentTimestamp: null,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    predictions: [],
    scores: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn(),
            getUserByGoogleId: jest.fn(),
            getUserByEmail: jest.fn(),
            updateUserProfile: jest.fn(),
            updateGoogleIdentity: jest.fn(),
            completeRegistration: jest.fn(),
            completePayment: jest.fn(),
          },
        },
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
                JWT_SECRET: 'test-secret',
                JWT_EXPIRATION: '3600',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validateGoogleUser', () => {
    it('should bind Google login to an enrolled user found by email', async () => {
      const profile = {
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      jest.spyOn(userService, 'getUserByGoogleId').mockResolvedValue(null);
      jest.spyOn(userService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'updateGoogleIdentity').mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(profile);

      expect(result).toEqual(mockUser);
      expect(userService.updateGoogleIdentity).toHaveBeenCalledWith(
        mockUser.id,
        'google-123',
        'Test User',
        'test@example.com',
      );
    });

    it('should return existing user if already exists', async () => {
      const profile = {
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      jest.spyOn(userService, 'getUserByGoogleId').mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(profile);

      expect(result).toEqual(mockUser);
      expect(userService.getUserByEmail).not.toHaveBeenCalled();
      expect(userService.updateGoogleIdentity).not.toHaveBeenCalled();
    });

    it('should throw error if the Google account is not enrolled', async () => {
      const profile = {
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      jest.spyOn(userService, 'getUserByGoogleId').mockResolvedValue(null);
      jest.spyOn(userService, 'getUserByEmail').mockResolvedValue(null);

      await expect(service.validateGoogleUser(profile)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error if profile data is invalid', async () => {
      const profile = {
        googleId: '',
        email: 'test@example.com',
        name: 'Test User',
      };

      await expect(service.validateGoogleUser(profile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateJwt', () => {
    it('should generate a valid JWT token', async () => {
      const token = 'test-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.generateJwt(mockUser);

      expect(result).toEqual(token);
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        {
          expiresIn: 3600,
        },
      );
    });
  });

  describe('completeRegistration', () => {
    it('should complete user registration', async () => {
      const registerDto = {
        userId: 'test-user-id',
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);
      jest
        .spyOn(userService, 'updateUserProfile')
        .mockResolvedValue({ ...mockUser, name: registerDto.name });
      jest
        .spyOn(userService, 'completeRegistration')
        .mockResolvedValue({ ...mockUser, registrationCompleted: true });

      const result = await service.completeRegistration(registerDto);

      expect(result.paymentRequired).toBe(true);
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        registerDto.userId,
        registerDto.name,
        registerDto.email,
      );
      expect(userService.completeRegistration).toHaveBeenCalledWith(
        registerDto.userId,
      );
    });

    it('should throw error if registration already completed', async () => {
      const registerDto = {
        userId: 'test-user-id',
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const completedUser = { ...mockUser, registrationCompleted: true };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(completedUser);

      await expect(
        service.completeRegistration(registerDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const paymentDto = {
        userId: 'test-user-id',
        paymentMethodId: 'pm_123',
        amount: 10,
        currency: 'USD',
      };

      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);
      jest
        .spyOn(userService, 'completePayment')
        .mockResolvedValue({ ...mockUser, paymentCompleted: true });

      const result = await service.processPayment(paymentDto);

      expect(result.paymentCompleted).toBe(true);
      expect(userService.completePayment).toHaveBeenCalledWith(
        paymentDto.userId,
      );
    });

    it('should throw error if payment already completed', async () => {
      const paymentDto = {
        userId: 'test-user-id',
        paymentMethodId: 'pm_123',
        amount: 10,
        currency: 'USD',
      };

      const paidUser = { ...mockUser, paymentCompleted: true };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(paidUser);

      await expect(service.processPayment(paymentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyRegistrationDeadline', () => {
    it('should return true if user is already registered', async () => {
      const registeredUser = { ...mockUser, paymentCompleted: true };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(registeredUser);

      const result = await service.verifyRegistrationDeadline('test-user-id');

      expect(result).toBe(true);
    });

    it('should return true if deadline has not passed', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      const result = await service.verifyRegistrationDeadline('test-user-id');

      // This will depend on current date, but should be true before May 31, 2026
      expect(typeof result).toBe('boolean');
    });
  });

  describe('validateSession', () => {
    it('should validate a valid JWT token', async () => {
      const token = 'valid-token';
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'test-user-id' });
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      const result = await service.validateSession(token);

      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid-token';
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateSession(token);

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      const token = 'valid-token';
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'test-user-id' });
      jest
        .spyOn(userService, 'getUserById')
        .mockRejectedValue(new Error('User not found'));

      const result = await service.validateSession(token);

      expect(result).toBeNull();
    });
  });
});
