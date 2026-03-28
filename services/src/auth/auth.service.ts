import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dtos/register.dto';
import { PaymentDto } from './dtos/payment.dto';

@Injectable()
export class AuthService {
  private readonly registrationDeadline = new Date('2026-05-31T00:00:00Z');

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async validateGoogleUser(profile: any): Promise<User> {
    const { googleId, email, name } = profile;

    if (!googleId || !email) {
      throw new BadRequestException('Invalid Google profile data');
    }

    let user = await this.userService.getUserByGoogleId(googleId);

    if (user) {
      return user;
    }

    user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Tu cuenta no esta inscrita. Solicita al administrador que te registre primero.',
      );
    }

    return this.userService.updateGoogleIdentity(user.id, googleId, name, email);
  }

  async generateJwt(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRATION', '3600');

    return this.jwtService.sign(payload, {
      expiresIn: parseInt(expiresIn, 10),
    });
  }

  async completeRegistration(
    registerDto: RegisterDto,
  ): Promise<{ user: User; paymentRequired: boolean }> {
    const user = await this.userService.getUserById(registerDto.userId);

    if (user.registrationCompleted) {
      throw new BadRequestException('User registration is already completed');
    }

    // Update user profile with registration details
    const updatedUser = await this.userService.updateUserProfile(
      registerDto.userId,
      registerDto.name,
      registerDto.email,
    );

    // Mark registration as completed
    await this.userService.completeRegistration(registerDto.userId);

    return {
      user: updatedUser,
      paymentRequired: true,
    };
  }

  async processPayment(paymentDto: PaymentDto): Promise<User> {
    const user = await this.userService.getUserById(paymentDto.userId);

    if (user.paymentCompleted) {
      throw new BadRequestException('User payment is already completed');
    }

    // Validate payment deadline
    const now = new Date();
    if (now > this.registrationDeadline) {
      throw new BadRequestException(
        'Registration deadline has passed. No new payments accepted.',
      );
    }

    // Process payment with payment processor
    const paymentResult = await this.processPaymentWithProvider(paymentDto);

    if (!paymentResult.success) {
      throw new BadRequestException(
        paymentResult.error || 'Payment processing failed',
      );
    }

    // Mark payment as completed
    const updatedUser = await this.userService.completePayment(
      paymentDto.userId,
    );

    return updatedUser;
  }

  async verifyRegistrationDeadline(userId: string): Promise<boolean> {
    const user = await this.userService.getUserById(userId);

    if (user.paymentCompleted) {
      return true;
    }

    const now = new Date();
    return now <= this.registrationDeadline;
  }

  async validateSession(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.getUserById(payload.sub);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  private async processPaymentWithProvider(
    paymentDto: PaymentDto,
  ): Promise<{ success: boolean; error?: string }> {
    // This is a placeholder for actual payment processor integration
    // In production, this would call Stripe, PayPal, or another payment provider
    try {
      // Simulate payment processing
      if (!paymentDto.paymentMethodId) {
        return { success: false, error: 'Invalid payment method' };
      }

      // In production, call actual payment API here
      // const result = await stripeClient.charges.create({...})

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }
}
