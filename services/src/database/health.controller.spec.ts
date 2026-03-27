import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DatabaseService } from './database.service';
import { RedisService } from '../cache/redis.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockRedisService: Partial<RedisService>;

  beforeEach(async () => {
    mockDatabaseService = {
      healthCheck: jest.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Database connection is active',
      }),
    };

    mockRedisService = {
      healthCheck: jest.fn().mockResolvedValue({
        status: 'healthy',
        message: 'Redis connection is active',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('checkDatabaseHealth', () => {
    it('should return database health status', async () => {
      const result = await controller.checkDatabaseHealth();

      expect(result.status).toBe('healthy');
      expect(mockDatabaseService.healthCheck).toHaveBeenCalled();
    });
  });

  describe('checkRedisHealth', () => {
    it('should return redis health status', async () => {
      const result = await controller.checkRedisHealth();

      expect(result.status).toBe('healthy');
      expect(mockRedisService.healthCheck).toHaveBeenCalled();
    });
  });

  describe('checkOverallHealth', () => {
    it('should return overall health status', async () => {
      const result = await controller.checkOverallHealth();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
    });

    it('should return error status when database is unhealthy', async () => {
      (mockDatabaseService.healthCheck as jest.Mock).mockResolvedValueOnce({
        status: 'unhealthy',
        message: 'Connection failed',
      });

      const result = await controller.checkOverallHealth();

      expect(result.status).toBe('error');
      expect(result.database.status).toBe('unhealthy');
    });
  });
});
