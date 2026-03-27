import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../../services/user.service';
import { PaymentService } from './payment.service';
import { User } from '../../entities/user.entity';
import { RegisterDto } from '../dtos/register.dto';
import { PaymentDto } from '../dtos/payment.dto';

@Injectable()
export class RegistrationService {
  private readonly registrationDeadline = new Date('2026-05-31T00:00:00Z');

  constructor(
    private userService: UserService,
    private paymentService: PaymentService,
  ) {}

  async startRegistration(userId: string): Promise<User> {
    const user = await this.userService.getUserById(userId);

    if (user.registrationCompleted) {
      throw new BadRequestException('User registration is already completed');
    }

    return user;
  }

  async completeRegistrationStep(registerDto: RegisterDto): Promise<User> {
    const user = await this.userService.getUserById(registerDto.userId);

    if (user.registrationCompleted) {
      throw new BadRequestException('User registration is already completed');
    }

    // Validate registration deadline
    const now = new Date();
    if (now > this.registrationDeadline) {
      throw new BadRequestException(
        'Registration deadline has passed. No new registrations accepted.',
      );
    }

    // Update user profile with registration details
    const updatedUser = await this.userService.updateUserProfile(
      registerDto.userId,
      registerDto.name,
      registerDto.email,
    );

    // Mark registration as completed
    await this.userService.completeRegistration(registerDto.userId);

    return updatedUser;
  }

  async completePaymentStep(paymentDto: PaymentDto): Promise<User> {
    const user = await this.userService.getUserById(paymentDto.userId);

    if (!user.registrationCompleted) {
      throw new BadRequestException(
        'User must complete registration before payment',
      );
    }

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

    // Process payment
    const paymentResult = await this.paymentService.processPayment(
      paymentDto.paymentMethodId,
      paymentDto.amount,
      paymentDto.currency,
      paymentDto.userId,
    );

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

  async getRegistrationStatus(userId: string): Promise<{
    registrationCompleted: boolean;
    paymentCompleted: boolean;
    registrationTimestamp: Date | null;
    paymentTimestamp: Date | null;
    deadline: Date;
    canRegister: boolean;
  }> {
    const user = await this.userService.getUserById(userId);
    const now = new Date();
    const canRegister = now <= this.registrationDeadline;

    return {
      registrationCompleted: user.registrationCompleted,
      paymentCompleted: user.paymentCompleted,
      registrationTimestamp: user.registrationTimestamp,
      paymentTimestamp: user.paymentTimestamp,
      deadline: this.registrationDeadline,
      canRegister,
    };
  }

  async verifyRegistrationDeadline(): Promise<boolean> {
    const now = new Date();
    return now <= this.registrationDeadline;
  }
}
