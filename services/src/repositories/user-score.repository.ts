import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserScore } from '../entities/user-score.entity';

@Injectable()
export class UserScoreRepository extends Repository<UserScore> {
  constructor(private dataSource: DataSource) {
    super(UserScore, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<UserScore | null> {
    return this.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async findTopScores(limit: number = 100): Promise<UserScore[]> {
    return this.find({
      relations: ['user'],
      order: { totalPoints: 'DESC' },
      take: limit,
    });
  }

  async findTopGroupStageScores(limit: number = 100): Promise<UserScore[]> {
    return this.find({
      relations: ['user'],
      order: { groupStagePoints: 'DESC' },
      take: limit,
    });
  }

  async findTopEliminationScores(limit: number = 100): Promise<UserScore[]> {
    return this.find({
      relations: ['user'],
      order: { eliminationPoints: 'DESC' },
      take: limit,
    });
  }

  async incrementTotalPoints(userId: string, points: number): Promise<void> {
    await this.increment({ userId }, 'totalPoints', points);
  }

  async incrementGroupStagePoints(userId: string, points: number): Promise<void> {
    await this.increment({ userId }, 'groupStagePoints', points);
  }

  async incrementEliminationPoints(userId: string, points: number): Promise<void> {
    await this.increment({ userId }, 'eliminationPoints', points);
  }

  async setTotalPoints(userId: string, points: number): Promise<void> {
    await this.update({ userId }, { totalPoints: points });
  }

  async setGroupStagePoints(userId: string, points: number): Promise<void> {
    await this.update({ userId }, { groupStagePoints: points });
  }

  async setEliminationPoints(userId: string, points: number): Promise<void> {
    await this.update({ userId }, { eliminationPoints: points });
  }

  async getUserRank(userId: string): Promise<number | null> {
    const userScore = await this.findByUserId(userId);
    if (!userScore) return null;

    const higherScores = await this.count({
      where: { totalPoints: userScore.totalPoints },
    });

    return higherScores + 1;
  }

  async getLeaderboardRank(userId: string): Promise<number | null> {
    const userScore = await this.findByUserId(userId);
    if (!userScore) return null;

    const rank = await this.createQueryBuilder('score')
      .where('score.totalPoints > :points', { points: userScore.totalPoints })
      .orWhere(
        'score.totalPoints = :points AND score.updatedAt < :updatedAt',
        {
          points: userScore.totalPoints,
          updatedAt: userScore.updatedAt,
        },
      )
      .getCount();

    return rank + 1;
  }

  async getTotalScoresCount(): Promise<number> {
    return this.count();
  }

  async getAveragePoints(): Promise<number> {
    const result = await this.createQueryBuilder('score')
      .select('AVG(score.totalPoints)', 'average')
      .getRawOne();

    return result?.average || 0;
  }

  async getMaxPoints(): Promise<number> {
    const result = await this.createQueryBuilder('score')
      .select('MAX(score.totalPoints)', 'max')
      .getRawOne();

    return result?.max || 0;
  }

  async getMinPoints(): Promise<number> {
    const result = await this.createQueryBuilder('score')
      .select('MIN(score.totalPoints)', 'min')
      .getRawOne();

    return result?.min || 0;
  }
}
