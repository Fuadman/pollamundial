import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { HealthController } from './health.controller';
import { LoggerService } from '../common/logger/logger.service';
import { RedisService } from '../cache/redis.service';
import {
  User,
  Team,
  Match,
  MatchResult,
  Prediction,
  UserScore,
  NewsArticle,
  SimulationData,
} from '../entities';

const isDatabaseSslEnabled = (value?: string): boolean => value === 'true';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'user'),
        password: configService.get('DATABASE_PASSWORD', 'password'),
        database: configService.get('DATABASE_NAME', 'copa_prediction'),
        entities: [User, Team, Match, MatchResult, Prediction, UserScore, NewsArticle, SimulationData],
        migrations: ['src/migrations/*.ts'],
        migrationsTableName: 'typeorm_migrations',
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: isDatabaseSslEnabled(configService.get<string>('DATABASE_SSL'))
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    TypeOrmModule.forFeature([User, Team, Match, MatchResult, Prediction, UserScore, NewsArticle, SimulationData]),
  ],
  providers: [DatabaseService, LoggerService, RedisService],
  controllers: [HealthController],
  exports: [DatabaseService, RedisService, TypeOrmModule],
})
export class DatabaseModule {}
