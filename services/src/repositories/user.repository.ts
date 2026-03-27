import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findRegisteredUsers(): Promise<User[]> {
    return this.find({
      where: {
        registrationCompleted: true,
        paymentCompleted: true,
      },
    });
  }

  async findUnregisteredUsers(): Promise<User[]> {
    return this.find({
      where: [
        { registrationCompleted: false },
        { paymentCompleted: false },
      ],
    });
  }

  async updateRegistrationStatus(
    userId: string,
    registrationCompleted: boolean,
    registrationTimestamp?: Date,
  ): Promise<User> {
    await this.update(userId, {
      registrationCompleted,
      registrationTimestamp: registrationTimestamp || new Date(),
    });
    return this.findOneOrFail({ where: { id: userId } });
  }

  async updatePaymentStatus(
    userId: string,
    paymentCompleted: boolean,
    paymentTimestamp?: Date,
  ): Promise<User> {
    await this.update(userId, {
      paymentCompleted,
      paymentTimestamp: paymentTimestamp || new Date(),
    });
    return this.findOneOrFail({ where: { id: userId } });
  }

  async findWithPredictions(userId: string): Promise<User | null> {
    return this.findOne({
      where: { id: userId },
      relations: ['predictions', 'scores'],
    });
  }

  async deleteUserWithData(userId: string): Promise<void> {
    await this.delete(userId);
  }
}
