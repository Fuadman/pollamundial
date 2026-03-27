import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { UserService } from '../../services/user.service';
import { PaymentService } from './payment.service';
import { User } from '../../entities/user.entity';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let userService: UserService;
  let paymentService: PaymentService;

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
        RegistrationService,
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn(),
            updateUserProfile: jest.fn(),
            completeRegistration: jest.fn(),
            completePayment: jest.fn(),
          },
        },
        {
          provide: PaymentService,
          useValue: {
            processPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    userService = module.get<UserService>(UserService);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  describe('startRegistration', () => {
    it('should start registration for new user', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      const result = await service.startRegistration('test-user-id');

      expect(result).toEqual(mockUser);
    });

    it('should throw error if registration already completed', async () => {
      const completedUser = { ...mockUser, registrationCompleted: true };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(completedUser);

      await expect(
        service.startRegistration('test-user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeRegistrationStep', () => {
    it('should complete registration step', async () => {
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

      const result = await service.completeRegistrationStep(registerDto);

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
        service.completeRegistrationStep(registerDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completePaymentStep', () => {
    it('should complete payment step', async () => {
      const paymentDto = {
        userId: 'test-user-id',
        paymentMethodId: 'pm_123',
        amount: 10,
        currency: 'USD',
      };

      const registeredUser = { ...mockUser, registrationCompleted: true };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(registeredUser);
      jest.spyOn(paymentService, 'processPayment').mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
      });
      jest
        .spyOn(userService, 'completePayment')
        .mockResolvedValue({ ...registeredUser, paymentCompleted: true });

      const result = await service.completePaymentStep(paymentDto);

      expect(paymentService.processPayment).toHaveBeenCalledWith(
        paymentDto.paymentMethodId,
        paymentDto.amount,
        paymentDto.currency,
        paymentDto.userId,
      );
      expect(userService.completePayment).toHaveBeenCalledWith(
        paymentDto.userId,
      );
    });

    it('should throw error if registration not completed', async () => {
      const paymentDto = {
        userId: 'test-user-id',
        paymentMethodId: 'pm_123',
        amount: 10,
        currency: 'USD',
      };

      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      await expect(
        service.completePaymentStep(paymentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if payment already completed', async () => {
      const paymentDto = {
        userId: 'test-user-id',
        paymentMethodId: 'pm_123',
        amount: 10,
        currency: 'USD',
      };

      const paidUser = {
        ...mockUser,
        registrationCompleted: true,
        paymentCompleted: true,
      };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(paidUser);

      await expect(
        service.completePaymentStep(paymentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if payment processing fails', async () => {
      const paymentDto = {
        userId: 'test-user-id',
        paymentMethodId: 'pm_123',
        amount: 10,
        currency: 'USD',
      };

      const registeredUser = { ...mockUser, registrationCompleted: true };
      jest.spyOn(userService, 'getUserById').mockResolvedValue(registeredUser);
      jest.spyOn(paymentService, 'processPayment').mockResolvedValue({
        success: false,
        error: 'Payment declined',
      });

      await expect(
        service.completePaymentStep(paymentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRegistrationStatus', () => {
    it('should return registration status', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      const result = await service.getRegistrationStatus('test-user-id');

      expect(result.registrationCompleted).toBe(false);
      expect(result.paymentCompleted).toBe(false);
      expect(result.deadline).toBeDefined();
      expect(result.canRegister).toBeDefined();
    });
  });

  describe('verifyRegistrationDeadline', () => {
    it('should verify registration deadline', async () => {
      const result = await service.verifyRegistrationDeadline();

      expect(typeof result).toBe('boolean');
    });
  });
});
