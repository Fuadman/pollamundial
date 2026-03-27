import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { SessionStore } from './session.store';
import { CacheService } from './cache.service';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  providers: [RedisService, SessionStore, CacheService, LoggerService],
  exports: [RedisService, SessionStore, CacheService],
})
export class CacheModule {}
