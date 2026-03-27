import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                PAYMENT_API_KEY: 'test-api-key',
                PAYMENT_PROVIDER: 'stripe',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const result = await service.processPayment(
        'pm_123',
        10,
        'USD',
        'user-123',
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
    });

    it('should throw error if payment method ID is missing', async () => {
      await expect(
        service.processPayment('', 10, 'USD', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if amount is invalid', async () => {
      await expect(
        service.processPayment('pm_123', 0, 'USD', 'user-123'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.processPayment('pm_123', -10, 'USD', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if currency is missing', async () => {
      await expect(
        service.processPayment('pm_123', 10, '', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const result = await service.verifyPayment('txn_123');

      expect(result).toBe(true);
    });

    it('should return false for invalid transaction ID', async () => {
      const result = await service.verifyPayment('');

      expect(result).toBe(false);
    });
  });
});
