import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UserService } from '../../services/user.service';
import { User } from '../../entities/user.entity';

describe('AdminService', () => {
  let service: AdminService;
  let userService: UserService;

  const mockAdminUser: User = {
    id: 'admin-user-id',
    googleId: 'google-123',
    email: 'admin@example.com',
    name: 'Admin User',
    registrationCompleted: true,
    paymentCompleted: true,
    registrationTimestamp: new Date(),
    paymentTimestamp: new Date(),
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    predictions: [],
    scores: [],
  };

  const mockRegularUser: User = {
    id: 'regular-user-id',
    googleId: 'google-456',
    email: 'user@example.com',
    name: 'Regular User',
    registrationCompleted: true,
    paymentCompleted: true,
    registrationTimestamp: new Date(),
    paymentTimestamp: new Date(),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    predictions: [],
    scores: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: UserService,
          useValue: {
            getUserById: jest.fn(),
            updateUserProfile: jest.fn(),
            updateUserRole: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userService = module.get<UserService>(UserService);
  });

  describe('checkAdminAccess', () => {
    it('should return true for admin user', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockAdminUser);

      const result = await service.checkAdminAccess('admin-user-id');

      expect(result).toBe(true);
    });

    it('should return false for regular user', async () => {
      jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(mockRegularUser);

      const result = await service.checkAdminAccess('regular-user-id');

      expect(result).toBe(false);
    });
  });

  describe('enforceAdminAccess', () => {
    it('should return user if admin', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockAdminUser);

      const result = await service.enforceAdminAccess('admin-user-id');

      expect(result).toEqual(mockAdminUser);
    });

    it('should throw ForbiddenException if not admin', async () => {
      jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(mockRegularUser);

      await expect(
        service.enforceAdminAccess('regular-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('promoteUserToAdmin', () => {
    it('should promote user to admin', async () => {
      jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(mockRegularUser);
      jest
        .spyOn(userService, 'updateUserRole')
        .mockResolvedValue({ ...mockRegularUser, role: 'admin' });

      const result = await service.promoteUserToAdmin('regular-user-id');

      expect(result.role).toBe('admin');
      expect(userService.updateUserRole).toHaveBeenCalledWith(
        'regular-user-id',
        'admin',
      );
    });
  });

  describe('demoteAdminToUser', () => {
    it('should demote admin to user', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockAdminUser);
      jest
        .spyOn(userService, 'updateUserRole')
        .mockResolvedValue({ ...mockAdminUser, role: 'user' });

      const result = await service.demoteAdminToUser('admin-user-id');

      expect(result.role).toBe('user');
      expect(userService.updateUserRole).toHaveBeenCalledWith(
        'admin-user-id',
        'user',
      );
    });

    it('should throw NotFoundException if user is not admin', async () => {
      jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(mockRegularUser);

      await expect(
        service.demoteAdminToUser('regular-user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRole', () => {
    it('should return user role', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockAdminUser);

      const result = await service.getUserRole('admin-user-id');

      expect(result).toBe('admin');
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has required role', async () => {
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockAdminUser);

      const result = await service.hasPermission('admin-user-id', 'admin');

      expect(result).toBe(true);
    });

    it('should return false if user does not have required role', async () => {
      jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(mockRegularUser);

      const result = await service.hasPermission('regular-user-id', 'admin');

      expect(result).toBe(false);
    });
  });
});
