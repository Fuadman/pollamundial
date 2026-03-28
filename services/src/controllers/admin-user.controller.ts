import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../auth/services/admin.service';
import { PredictionService } from '../services/prediction.service';
import { UserService } from '../services/user.service';
import type { User } from '../entities/user.entity';

export class EnrollUserDto {
  email!: string;
  name!: string;
  googleId?: string; // Optional: if not provided, can be filled when user first logs in
}

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUserController {
  constructor(
    private readonly adminService: AdminService,
    private readonly predictionService: PredictionService,
    private readonly userService: UserService,
  ) {}

  /**
   * Enroll a new user directly (admin only, no payment required)
   */
  @Post('enroll')
  async enrollUser(@Body() enrollDto: EnrollUserDto, @Req() req: any): Promise<{ user: User }> {
    // Check admin access
    await this.adminService.enforceAdminAccess(req.user.id);

    // Validate input
    if (!enrollDto.email || !enrollDto.name) {
      throw new BadRequestException('Email and name are required');
    }

    // Check if user already exists
    const existingUser = await this.userService.getUserByEmail(enrollDto.email);
    if (existingUser && existingUser.registrationCompleted) {
      throw new BadRequestException(`Usuario ${enrollDto.email} ya está registrado`);
    }

    // Create or update user and mark as registered
    let user = existingUser;
    if (!user) {
      // Create new user with minimal info (googleId can be null, will be filled on first OAuth login)
      user = await this.userService.createUser(
        enrollDto.googleId || `enrolled-${Date.now()}`,
        enrollDto.email,
        enrollDto.name,
      );
    } else {
      // Update existing user profile
      user = await this.userService.updateUserProfile(
        user.id,
        enrollDto.name,
        enrollDto.email,
      );
    }

    // Mark registration as completed (no payment needed for admin-enrolled users)
    user = await this.userService.completeRegistration(user.id);

    return { user };
  }

  @Get(':userId/predictions')
  async getUserPredictions(@Param('userId') userId: string, @Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    return this.predictionService.getUserPredictions(userId);
  }
}