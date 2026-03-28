import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private dataSource: DataSource,
  ) {}

  async createUser(
    googleId: string,
    email: string,
    name: string,
  ): Promise<User> {
    const existingUser = await this.userRepository.findByGoogleId(googleId);
    if (existingUser) {
      return existingUser;
    }

    const user = this.userRepository.create({
      id: uuid(),
      googleId,
      email,
      name,
      registrationCompleted: false,
      paymentCompleted: false,
    });

    return this.userRepository.save(user);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findByGoogleId(googleId);
  }

  async updateUserProfile(
    userId: string,
    name: string,
    email: string,
  ): Promise<User> {
    const user = await this.getUserById(userId);

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('Email is already in use');
      }
    }

    user.name = name;
    user.email = email;

    return this.userRepository.save(user);
  }

  async updateGoogleIdentity(
    userId: string,
    googleId: string,
    name: string,
    email: string,
  ): Promise<User> {
    const user = await this.getUserById(userId);

    if (email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already in use');
      }
    }

    user.googleId = googleId;
    user.name = name;
    user.email = email;

    return this.userRepository.save(user);
  }

  async completeRegistration(userId: string): Promise<User> {
    const user = await this.getUserById(userId);

    if (user.registrationCompleted) {
      throw new BadRequestException('User registration is already completed');
    }

    return this.userRepository.updateRegistrationStatus(
      userId,
      true,
      new Date(),
    );
  }

  async completePayment(userId: string): Promise<User> {
    const user = await this.getUserById(userId);

    if (user.paymentCompleted) {
      throw new BadRequestException('User payment is already completed');
    }

    return this.userRepository.updatePaymentStatus(userId, true, new Date());
  }

  async isUserRegistered(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user.registrationCompleted;
  }

  async getRegisteredUsers(): Promise<User[]> {
    return this.userRepository.findRegisteredUsers();
  }

  async getUnregisteredUsers(): Promise<User[]> {
    return this.userRepository.findUnregisteredUsers();
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);

    // Use transaction to ensure cascading deletes work properly
    await this.dataSource.transaction(async (manager) => {
      await manager.remove(user);
    });
  }

  async getUserWithPredictions(userId: string): Promise<User> {
    const user = await this.userRepository.findWithPredictions(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async countRegisteredUsers(): Promise<number> {
    return this.userRepository.count({
      where: {
        registrationCompleted: true,
      },
    });
  }

  async countTotalUsers(): Promise<number> {
    return this.userRepository.count();
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const user = await this.getUserById(userId);
    user.role = role;
    return this.userRepository.save(user);
  }
}
