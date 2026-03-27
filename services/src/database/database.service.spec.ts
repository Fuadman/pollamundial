import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { LoggerService } from '../common/logger/logger.service';
import { DataSource } from 'typeorm';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockDataSource: Partial<DataSource>;
  let mockLogger: Partial<LoggerService>;

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
      initialize: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  describe('healthCheck', () => {
    it('should return healthy status when connection is active', async () => {
      const result = await service.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('active');
    });

    it('should return unhealthy status when connection fails', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('failed');
    });

    it('should return unhealthy status when DataSource is not initialized', async () => {
      Object.defineProperty(mockDataSource, 'isInitialized', {
        value: false,
        writable: true,
      });

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('not initialized');
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', async () => {
      await service.healthCheck();
      const status = service.getHealthStatus();

      expect(typeof status).toBe('boolean');
    });
  });

  describe('getDataSource', () => {
    it('should return DataSource instance', () => {
      const dataSource = service.getDataSource();

      expect(dataSource).toBe(mockDataSource);
    });
  });

  describe('onModuleDestroy', () => {
    it('should destroy DataSource on module destroy', async () => {
      await service.onModuleDestroy();

      expect(mockDataSource.destroy).toHaveBeenCalled();
    });

    it('should not destroy if DataSource is not initialized', async () => {
      Object.defineProperty(mockDataSource, 'isInitialized', {
        value: false,
        writable: true,
      });

      await service.onModuleDestroy();

      expect(mockDataSource.destroy).not.toHaveBeenCalled();
    });
  });
});
