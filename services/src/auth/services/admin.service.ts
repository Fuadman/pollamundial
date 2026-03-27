import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../../services/user.service';
import { User } from '../../entities/user.entity';

@Injectable()
export class AdminService {
  constructor(private userService: UserService) {}

  async checkAdminAccess(userId: string): Promise<boolean> {
    const user = await this.userService.getUserById(userId);
    return user.role === 'admin';
  }

  async enforceAdminAccess(userId: string): Promise<User> {
    const user = await this.userService.getUserById(userId);

    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return user;
  }

  async promoteUserToAdmin(userId: string): Promise<User> {
    const user = await this.userService.getUserById(userId);

    // Update user role to admin
    return this.userService.updateUserRole(userId, 'admin');
  }

  async demoteAdminToUser(userId: string): Promise<User> {
    const user = await this.userService.getUserById(userId);

    if (user.role !== 'admin') {
      throw new NotFoundException('User is not an admin');
    }

    // Update user role to user
    return this.userService.updateUserRole(userId, 'user');
  }

  async getUserRole(userId: string): Promise<string> {
    const user = await this.userService.getUserById(userId);
    return user.role;
  }

  async hasPermission(userId: string, requiredRole: string): Promise<boolean> {
    const user = await this.userService.getUserById(userId);
    return user.role === requiredRole;
  }
}
