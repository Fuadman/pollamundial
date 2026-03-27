import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between, In } from 'typeorm';
import { Match, MatchStatus, MatchPhase } from '../entities/match.entity';

@Injectable()
export class MatchRepository extends Repository<Match> {
  constructor(private dataSource: DataSource) {
    super(Match, dataSource.createEntityManager());
  }

  async findByPhase(phase: MatchPhase): Promise<Match[]> {
    return this.find({
      where: { phase },
      relations: ['team1', 'team2', 'result'],
      order: { scheduledTime: 'ASC' },
    });
  }

  async findByStatus(status: MatchStatus): Promise<Match[]> {
    return this.find({
      where: { status },
      relations: ['team1', 'team2', 'result'],
      order: { scheduledTime: 'ASC' },
    });
  }

  async findByGroup(group: string): Promise<Match[]> {
    return this.find({
      where: { groupStageGroup: group, phase: MatchPhase.GROUP },
      relations: ['team1', 'team2', 'result'],
      order: { scheduledTime: 'ASC' },
    });
  }

  async findByEliminationRound(round: string): Promise<Match[]> {
    return this.find({
      where: { eliminationRound: round, phase: MatchPhase.ELIMINATION },
      relations: ['team1', 'team2', 'result'],
      order: { scheduledTime: 'ASC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Match[]> {
    return this.find({
      where: {
        scheduledTime: Between(startDate, endDate),
      },
      relations: ['team1', 'team2', 'result'],
      order: { scheduledTime: 'ASC' },
    });
  }

  async findUpcomingMatches(beforeTime: Date): Promise<Match[]> {
    return this.find({
      where: {
        scheduledTime: Between(new Date(), beforeTime),
        status: MatchStatus.SCHEDULED,
      },
      relations: ['team1', 'team2'],
      order: { scheduledTime: 'ASC' },
    });
  }

  async findCompletedMatches(): Promise<Match[]> {
    return this.find({
      where: { status: MatchStatus.COMPLETED },
      relations: ['team1', 'team2', 'result'],
      order: { scheduledTime: 'DESC' },
    });
  }

  async findCompletedWithoutResult(): Promise<Match[]> {
    return this.createQueryBuilder('match')
      .leftJoinAndSelect('match.result', 'result')
      .leftJoinAndSelect('match.team1', 'team1')
      .leftJoinAndSelect('match.team2', 'team2')
      .where('match.status = :status', { status: MatchStatus.COMPLETED })
      .andWhere('result.id IS NULL')
      .orderBy('match.scheduledTime', 'DESC')
      .getMany();
  }

  async findMatchesNearLockdown(minutesBefore: number): Promise<Match[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + minutesBefore * 60 * 1000);

    return this.find({
      where: {
        lockdownTime: Between(now, futureTime),
        status: MatchStatus.SCHEDULED,
      },
      relations: ['team1', 'team2'],
      order: { lockdownTime: 'ASC' },
    });
  }

  async findWithPredictions(matchId: string): Promise<Match | null> {
    return this.findOne({
      where: { id: matchId },
      relations: ['team1', 'team2', 'result', 'predictions'],
    });
  }

  async countByPhase(phase: MatchPhase): Promise<number> {
    return this.count({ where: { phase } });
  }

  async countByStatus(status: MatchStatus): Promise<number> {
    return this.count({ where: { status } });
  }

  async updateStatus(matchId: string, status: MatchStatus): Promise<void> {
    await this.update(matchId, { status });
  }

  async updateLockdownTime(matchId: string, lockdownTime: Date): Promise<void> {
    await this.update(matchId, { lockdownTime });
  }
}
