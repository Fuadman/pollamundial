import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerService } from './common/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { DataAccessModule } from './data-access/data-access.module';
import { SeedingModule } from './seeding/seeding.module';
import { AuthModule } from './auth/auth.module';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    CacheModule,
    DataAccessModule,
    SeedingModule,
    AuthModule,
    MatchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
