import { Injectable, NotFoundException } from '@nestjs/common';
import { UserScoreRepository } from '../repositories/user-score.repository';
import { UserRepository } from '../repositories/user.repository';
import { UserScore } from '../entities/user-score.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UserScoreService {
  constructor(
    private userScoreRepository: UserScoreRepository,
    private userRepository: UserRepository,
  ) {}

  async createUserScore(userId: string): Promise<UserScore> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userScore = this.userScoreRepository.create({
      id: uuid(),
      userId,
      totalPoints: 0,
      groupStagePoints: 0,
      eliminationPoints: 0,
    });

    return this.userScoreRepository.save(userScore);
  }

  async getUserScore(userId: string): Promise<UserScore> {
    let userScore = await this.userScoreRepository.findByUserId(userId);

    if (!userScore) {
      userScore = await this.createUserScore(userId);
    }

    return userScore;
  }

  async getTopScores(limit: number = 100): Promise<UserScore[]> {
    return this.userScoreRepository.findTopScores(limit);
  }

  async getTopGroupStageScores(limit: number = 100): Promise<UserScore[]> {
    return this.userScoreRepository.findTopGroupStageScores(limit);
  }

  async getTopEliminationScores(limit: number = 100): Promise<UserScore[]> {
    return this.userScoreRepository.findTopEliminationScores(limit);
  }

  async addTotalPoints(userId: string, points: number): Promise<void> {
    await this.userScoreRepository.incrementTotalPoints(userId, points);
  }

  async addGroupStagePoints(userId: string, points: number): Promise<void> {
    await this.userScoreRepository.incrementGroupStagePoints(userId, points);
  }

  async addEliminationPoints(userId: string, points: number): Promise<void> {
    await this.userScoreRepository.incrementEliminationPoints(userId, points);
  }

  async setTotalPoints(userId: string, points: number): Promise<void> {
    await this.userScoreRepository.setTotalPoints(userId, points);
  }

  async setGroupStagePoints(userId: string, points: number): Promise<void> {
    await this.userScoreRepository.setGroupStagePoints(userId, points);
  }

  async setEliminationPoints(userId: string, points: number): Promise<void> {
    await this.userScoreRepository.setEliminationPoints(userId, points);
  }

  async getUserRank(userId: string): Promise<number | null> {
    return this.userScoreRepository.getUserRank(userId);
  }

  async getLeaderboardRank(userId: string): Promise<number | null> {
    return this.userScoreRepository.getLeaderboardRank(userId);
  }

  async getTotalScoresCount(): Promise<number> {
    return this.userScoreRepository.getTotalScoresCount();
  }

  async getAveragePoints(): Promise<number> {
    return this.userScoreRepository.getAveragePoints();
  }

  async getMaxPoints(): Promise<number> {
    return this.userScoreRepository.getMaxPoints();
  }

  async getMinPoints(): Promise<number> {
    return this.userScoreRepository.getMinPoints();
  }

  async deleteUserScore(userId: string): Promise<void> {
    const userScore = await this.userScoreRepository.findByUserId(userId);
    if (userScore) {
      await this.userScoreRepository.remove(userScore);
    }
  }

  async recalculateUserScore(userId: string): Promise<UserScore> {
    // This would be called after all predictions for a user are recalculated
    // For now, just return the current score
    return this.getUserScore(userId);
  }

  async getLeaderboardPage(
    phase: 'all' | 'group' | 'elimination',
    page: number,
    limit: number,
  ): Promise<{ rows: UserScore[]; total: number }> {
    return this.userScoreRepository.findLeaderboardPage(phase, page, limit);
  }
}
