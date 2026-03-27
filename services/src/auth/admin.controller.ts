import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AuditLog } from './decorators/audit-log.decorator';
import { AdminService } from './services/admin.service';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('check-access')
  @AuditLog({ action: 'check_admin_access', resource: 'admin_panel' })
  async checkAdminAccess(@Req() req: any) {
    const hasAccess = await this.adminService.checkAdminAccess(req.user.id);

    return {
      hasAccess,
      role: req.user.role,
    };
  }

  @Post('promote/:userId')
  @AuditLog({ action: 'promote_user_to_admin', resource: 'user_management' })
  async promoteUserToAdmin(@Param('userId') userId: string, @Req() req: any) {
    // Verify that the requesting user is an admin
    await this.adminService.enforceAdminAccess(req.user.id);

    const user = await this.adminService.promoteUserToAdmin(userId);

    return {
      success: true,
      user,
      message: `User ${userId} has been promoted to admin`,
    };
  }

  @Post('demote/:userId')
  @AuditLog({ action: 'demote_admin_to_user', resource: 'user_management' })
  async demoteAdminToUser(@Param('userId') userId: string, @Req() req: any) {
    // Verify that the requesting user is an admin
    await this.adminService.enforceAdminAccess(req.user.id);

    const user = await this.adminService.demoteAdminToUser(userId);

    return {
      success: true,
      user,
      message: `User ${userId} has been demoted to regular user`,
    };
  }

  @Get('user/:userId/role')
  @AuditLog({ action: 'view_user_role', resource: 'user_management' })
  async getUserRole(@Param('userId') userId: string, @Req() req: any) {
    // Verify that the requesting user is an admin
    await this.adminService.enforceAdminAccess(req.user.id);

    const role = await this.adminService.getUserRole(userId);

    return {
      userId,
      role,
    };
  }

  @Get('verify-permission/:requiredRole')
  @AuditLog({ action: 'verify_permission', resource: 'admin_panel' })
  async verifyPermission(
    @Param('requiredRole') requiredRole: string,
    @Req() req: any,
  ) {
    const hasPermission = await this.adminService.hasPermission(
      req.user.id,
      requiredRole,
    );

    return {
      hasPermission,
      requiredRole,
      userRole: req.user.role,
    };
  }
}
