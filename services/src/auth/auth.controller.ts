import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegistrationService } from './services/registration.service';
import { SessionService } from './services/session.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dtos/register.dto';
import { PaymentDto } from './dtos/payment.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private registrationService: RegistrationService,
    private sessionService: SessionService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // This route is handled by Passport
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const user = await this.authService.validateGoogleUser(req.user);
      const { accessToken, refreshToken, expiresIn } =
        await this.sessionService.createSession(user);

      const requiresRegistration = !user.registrationCompleted;

      // In production, redirect to frontend with token
      // For now, return JSON response
      return res.json({
        accessToken,
        refreshToken,
        expiresIn,
        user,
        requiresRegistration,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.registrationService.completeRegistrationStep(
      registerDto,
    );
    return {
      user,
      paymentRequired: true,
    };
  }

  @Post('payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(@Body() paymentDto: PaymentDto) {
    const user = await this.registrationService.completePaymentStep(
      paymentDto,
    );
    const { accessToken, refreshToken, expiresIn } =
      await this.sessionService.createSession(user);

    return {
      success: true,
      user,
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async getSession(@Req() req: any) {
    const sessionInfo = await this.sessionService.getSessionInfo(req.user.id);

    return {
      user: req.user,
      sessionInfo,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    await this.sessionService.destroySession(req.user.id);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    const result = await this.sessionService.refreshSession(body.refreshToken);

    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return result;
  }

  @Get('verify-deadline')
  @UseGuards(JwtAuthGuard)
  async verifyDeadline(@Req() req: any) {
    const canRegister =
      await this.registrationService.verifyRegistrationDeadline();

    return {
      canRegister,
      deadline: '2026-05-31T00:00:00Z',
    };
  }

  @Get('registration-status')
  @UseGuards(JwtAuthGuard)
  async getRegistrationStatus(@Req() req: any) {
    return this.registrationService.getRegistrationStatus(req.user.id);
  }
}
