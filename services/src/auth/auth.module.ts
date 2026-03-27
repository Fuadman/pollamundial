import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AdminController } from './admin.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserService } from '../services/user.service';
import { DataAccessModule } from '../data-access/data-access.module';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { LoggerService } from '../common/logger/logger.service';
import { PaymentService } from './services/payment.service';
import { RegistrationService } from './services/registration.service';
import { SessionService } from './services/session.service';
import { AdminService } from './services/admin.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRATION', '3600');
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: parseInt(expiresIn, 10),
          },
        };
      },
    }),
    DataAccessModule,
    CacheModule,
  ],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    UserService,
    LoggerService,
    PaymentService,
    RegistrationService,
    SessionService,
    AdminService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  controllers: [AuthController, AdminController],
  exports: [
    AuthService,
    JwtModule,
    PaymentService,
    RegistrationService,
    SessionService,
    AdminService,
  ],
})
export class AuthModule {}
