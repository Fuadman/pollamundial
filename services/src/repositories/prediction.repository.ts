import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { Prediction } from '../entities/prediction.entity';

@Injectable()
export class PredictionRepository extends Repository<Prediction> {
  constructor(private dataSource: DataSource) {
    super(Prediction, dataSource.createEntityManager());
  }

  async findByUserAndMatch(
    userId: string,
    matchId: string,
  ): Promise<Prediction | null> {
    return this.findOne({
      where: { userId, matchId },
      relations: ['user', 'match'],
    });
  }

  async findByUserId(userId: string): Promise<Prediction[]> {
    return this.find({
      where: { userId },
      relations: ['match', 'match.team1', 'match.team2'],
      order: { submissionTimestamp: 'DESC' },
    });
  }

  async findByMatchId(matchId: string): Promise<Prediction[]> {
    return this.find({
      where: { matchId },
      relations: ['user', 'match'],
    });
  }

  async findLockedPredictions(matchId: string): Promise<Prediction[]> {
    return this.createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .leftJoinAndSelect('prediction.user', 'user')
      .where('prediction.matchId = :matchId', { matchId })
      .andWhere('prediction.lockedTimestamp IS NOT NULL')
      .getMany();
  }

  async findUnlockedPredictions(matchId: string): Promise<Prediction[]> {
    return this.createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .leftJoinAndSelect('prediction.user', 'user')
      .where('prediction.matchId = :matchId', { matchId })
      .andWhere('prediction.lockedTimestamp IS NULL')
      .getMany();
  }

  async findUserPredictionsByPhase(
    userId: string,
    phase: 'group' | 'elimination',
  ): Promise<Prediction[]> {
    return this.createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .leftJoinAndSelect('match.team1', 'team1')
      .leftJoinAndSelect('match.team2', 'team2')
      .where('prediction.userId = :userId', { userId })
      .andWhere('match.phase = :phase', { phase })
      .orderBy('match.scheduledTime', 'ASC')
      .getMany();
  }

  async findUserPredictionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Prediction[]> {
    return this.createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .leftJoinAndSelect('match.team1', 'team1')
      .leftJoinAndSelect('match.team2', 'team2')
      .where('prediction.userId = :userId', { userId })
      .andWhere('match.scheduledTime BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .orderBy('match.scheduledTime', 'ASC')
      .getMany();
  }

  async findPendingPredictions(userId: string): Promise<Prediction[]> {
    return this.createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .leftJoinAndSelect('match.team1', 'team1')
      .leftJoinAndSelect('match.team2', 'team2')
      .where('prediction.userId = :userId', { userId })
      .andWhere('prediction.lockedTimestamp IS NULL')
      .andWhere('match.status = :status', { status: 'scheduled' })
      .orderBy('match.scheduledTime', 'ASC')
      .getMany();
  }

  async findCompletedPredictions(userId: string): Promise<Prediction[]> {
    return this.createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .leftJoinAndSelect('match.team1', 'team1')
      .leftJoinAndSelect('match.team2', 'team2')
      .where('prediction.userId = :userId', { userId })
      .andWhere('match.status = :status', { status: 'completed' })
      .orderBy('match.scheduledTime', 'DESC')
      .getMany();
  }

  async lockPrediction(predictionId: string): Promise<void> {
    await this.update(predictionId, {
      lockedTimestamp: new Date(),
    });
  }

  async lockPredictionsByMatch(matchId: string): Promise<void> {
    await this.createQueryBuilder()
      .update(Prediction)
      .set({ lockedTimestamp: new Date() })
      .where('matchId = :matchId', { matchId })
      .andWhere('lockedTimestamp IS NULL')
      .execute();
  }

  async updatePoints(predictionId: string, points: number): Promise<void> {
    await this.update(predictionId, { pointsEarned: points });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ where: { userId } });
  }

  async countByMatchId(matchId: string): Promise<number> {
    return this.count({ where: { matchId } });
  }

  async findWithHighestPoints(limit: number = 10): Promise<Prediction[]> {
    return this.find({
      relations: ['user', 'match'],
      order: { pointsEarned: 'DESC' },
      take: limit,
    });
  }

  async existsForUserAndMatch(
    userId: string,
    matchId: string,
  ): Promise<boolean> {
    const prediction = await this.findByUserAndMatch(userId, matchId);
    return !!prediction;
  }
}
