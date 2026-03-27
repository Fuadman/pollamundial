import { Controller, Get, Inject } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { RedisService } from '../cache/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private databaseService: DatabaseService,
    @Inject(RedisService) private redisService: RedisService,
  ) {}

  @Get('db')
  async checkDatabaseHealth() {
    return await this.databaseService.healthCheck();
  }

  @Get('redis')
  async checkRedisHealth() {
    return await this.redisService.healthCheck();
  }

  @Get()
  async checkOverallHealth() {
    const dbHealth = await this.databaseService.healthCheck();
    const redisHealth = await this.redisService.healthCheck();

    const overallStatus =
      dbHealth.status === 'healthy' && redisHealth.status === 'healthy' ? 'ok' : 'error';

    return {
      status: overallStatus,
      database: dbHealth,
      redis: redisHealth,
      timestamp: new Date().toISOString(),
    };
  }
}

