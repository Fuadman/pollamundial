import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MatchResult } from '../entities/match-result.entity';

@Injectable()
export class MatchResultRepository extends Repository<MatchResult> {
  constructor(private dataSource: DataSource) {
    super(MatchResult, dataSource.createEntityManager());
  }

  async findByMatchId(matchId: string): Promise<MatchResult | null> {
    return this.findOne({
      where: { matchId },
      relations: ['match', 'winner'],
    });
  }

  async findByMatchIds(matchIds: string[]): Promise<MatchResult[]> {
    return this.find({
      where: { matchId: matchIds as any },
      relations: ['match', 'winner'],
    });
  }

  async findDrawMatches(): Promise<MatchResult[]> {
    return this.find({
      where: { isDraw: true },
      relations: ['match', 'winner'],
    });
  }

  async findByWinnerId(teamId: string): Promise<MatchResult[]> {
    return this.find({
      where: { winnerId: teamId },
      relations: ['match', 'winner'],
    });
  }

  async findRecentResults(limit: number = 10): Promise<MatchResult[]> {
    return this.find({
      relations: ['match', 'winner'],
      order: { publishedTimestamp: 'DESC' },
      take: limit,
    });
  }

  async findResultsInDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<MatchResult[]> {
    return this.createQueryBuilder('result')
      .leftJoinAndSelect('result.match', 'match')
      .leftJoinAndSelect('result.winner', 'winner')
      .where('result.publishedTimestamp BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .orderBy('result.publishedTimestamp', 'DESC')
      .getMany();
  }

  async existsForMatch(matchId: string): Promise<boolean> {
    const result = await this.findOne({ where: { matchId } });
    return !!result;
  }

  async getGoalDifference(matchId: string): Promise<number | null> {
    const result = await this.findByMatchId(matchId);
    if (!result) return null;
    return Math.abs(result.team1Score - result.team2Score);
  }
}
