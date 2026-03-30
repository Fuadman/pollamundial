import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { MatchRepository } from '../repositories/match.repository';
import { TeamRepository } from '../repositories/team.repository';
import { MatchResult } from '../entities/match-result.entity';
import { MatchStatus, MatchPhase } from '../entities/match.entity';
import { v4 as uuid } from 'uuid';

export interface ResultPublicationAudit {
  matchId: string;
  publishedBy: string;
  publishedAt: Date;
  team1Score: number;
  team2Score: number;
  action: 'published' | 'edited';
  previousScores?: { team1Score: number; team2Score: number };
}

@Injectable()
export class MatchResultService {
  constructor(
    private matchResultRepository: MatchResultRepository,
    private matchRepository: MatchRepository,
    private teamRepository: TeamRepository,
    private dataSource: DataSource,
  ) {}

  /**
   * Validate score format
   * Requirement 5.3, 26.4: Validate that scores are non-negative integers
   */
  private validateScoreFormat(team1Score: number, team2Score: number): void {
    if (!Number.isInteger(team1Score) || !Number.isInteger(team2Score)) {
      throw new BadRequestException('Scores must be integers');
    }

    if (team1Score < 0 || team2Score < 0) {
      throw new BadRequestException('Scores cannot be negative');
    }
  }

  private validatePenaltyFormat(
    team1PenaltyScore?: number,
    team2PenaltyScore?: number,
  ): void {
    if (team1PenaltyScore === undefined && team2PenaltyScore === undefined) {
      return;
    }

    if (
      !Number.isInteger(team1PenaltyScore) ||
      !Number.isInteger(team2PenaltyScore)
    ) {
      throw new BadRequestException('Penalty scores must be integers');
    }

    if ((team1PenaltyScore as number) < 0 || (team2PenaltyScore as number) < 0) {
      throw new BadRequestException('Penalty scores cannot be negative');
    }
  }

  private resolveWinnerData(
    match: { team1Id: string; team2Id: string; phase: MatchPhase },
    team1Score: number,
    team2Score: number,
    team1PenaltyScore?: number,
    team2PenaltyScore?: number,
  ): {
    winnerId: string | null;
    isDraw: boolean;
    decidedByPenalties: boolean;
    normalizedTeam1PenaltyScore: number | null;
    normalizedTeam2PenaltyScore: number | null;
  } {
    const isDraw = team1Score === team2Score;

    if (!isDraw) {
      if (team1PenaltyScore !== undefined || team2PenaltyScore !== undefined) {
        throw new BadRequestException(
          'Penalty scores are only allowed when regular time ends in draw',
        );
      }

      return {
        winnerId: team1Score > team2Score ? match.team1Id : match.team2Id,
        isDraw: false,
        decidedByPenalties: false,
        normalizedTeam1PenaltyScore: null,
        normalizedTeam2PenaltyScore: null,
      };
    }

    if (match.phase === MatchPhase.GROUP) {
      if (team1PenaltyScore !== undefined || team2PenaltyScore !== undefined) {
        throw new BadRequestException(
          'Penalty scores are not allowed in group stage matches',
        );
      }

      return {
        winnerId: null,
        isDraw: true,
        decidedByPenalties: false,
        normalizedTeam1PenaltyScore: null,
        normalizedTeam2PenaltyScore: null,
      };
    }

    if (team1PenaltyScore === undefined || team2PenaltyScore === undefined) {
      throw new BadRequestException(
        'Penalty scores are required for drawn elimination matches',
      );
    }

    if (team1PenaltyScore === team2PenaltyScore) {
      throw new BadRequestException('Penalty scores cannot end in draw');
    }

    return {
      winnerId: team1PenaltyScore > team2PenaltyScore ? match.team1Id : match.team2Id,
      isDraw: true,
      decidedByPenalties: true,
      normalizedTeam1PenaltyScore: team1PenaltyScore,
      normalizedTeam2PenaltyScore: team2PenaltyScore,
    };
  }

  /**
   * Publish match result with validation and audit trail
   * Requirement 5.1-5.7: Admin can publish results within 5 minutes of match completion
   * Requirement 26.1-26.9: Results entry interface with validation
   * 
   * Property 53: Result publication records timestamp
   * Property 54: Duplicate result prevention
   * Property 55: Score validation (non-negative integers)
   */
  async publishResult(
    matchId: string,
    team1Score: number,
    team2Score: number,
    team1PenaltyScore?: number,
    team2PenaltyScore?: number,
    publishedBy?: string,
  ): Promise<MatchResult> {
    // Validate match exists
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    // Validate score format
    this.validateScoreFormat(team1Score, team2Score);
    this.validatePenaltyFormat(team1PenaltyScore, team2PenaltyScore);

    // Check if result already exists (duplicate prevention)
    const existingResult = await this.matchResultRepository.findByMatchId(matchId);
    if (existingResult) {
      throw new BadRequestException(
        `Result already published for match ${matchId}`,
      );
    }

    const winnerData = this.resolveWinnerData(
      match as { team1Id: string; team2Id: string; phase: MatchPhase },
      team1Score,
      team2Score,
      team1PenaltyScore,
      team2PenaltyScore,
    );

    const result = this.matchResultRepository.create({
      id: uuid(),
      matchId,
      team1Score,
      team2Score,
      team1PenaltyScore: winnerData.normalizedTeam1PenaltyScore,
      team2PenaltyScore: winnerData.normalizedTeam2PenaltyScore,
      winnerId: winnerData.winnerId,
      isDraw: winnerData.isDraw,
      decidedByPenalties: winnerData.decidedByPenalties,
      publishedTimestamp: new Date(),
    });

    const savedResult = await this.matchResultRepository.save(result);

    // Update match status to completed
    await this.matchRepository.updateStatus(matchId, MatchStatus.COMPLETED);

    // Log audit trail
    if (publishedBy) {
      this.logAuditTrail({
        matchId,
        publishedBy,
        publishedAt: new Date(),
        team1Score,
        team2Score,
        action: 'published',
      });
    }

    return savedResult;
  }

  async getResultByMatchId(matchId: string): Promise<MatchResult | null> {
    return this.matchResultRepository.findByMatchId(matchId);
  }

  async getResultsByMatchIds(matchIds: string[]): Promise<MatchResult[]> {
    if (matchIds.length === 0) {
      return [];
    }
    return this.matchResultRepository.findByMatchIds(matchIds);
  }

  async getDrawMatches(): Promise<MatchResult[]> {
    return this.matchResultRepository.findDrawMatches();
  }

  async getResultsByWinnerId(teamId: string): Promise<MatchResult[]> {
    return this.matchResultRepository.findByWinnerId(teamId);
  }

  async getRecentResults(limit: number = 10): Promise<MatchResult[]> {
    return this.matchResultRepository.findRecentResults(limit);
  }

  async getResultsInDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<MatchResult[]> {
    return this.matchResultRepository.findResultsInDateRange(startDate, endDate);
  }

  async resultExists(matchId: string): Promise<boolean> {
    return this.matchResultRepository.existsForMatch(matchId);
  }

  async getGoalDifference(matchId: string): Promise<number | null> {
    return this.matchResultRepository.getGoalDifference(matchId);
  }

  /**
   * Update published result with audit trail
   * Requirement 26.9: Allow admins to edit published results with audit trail
   * 
   * Property 56: Result editing records previous scores
   */
  async updateResult(
    matchId: string,
    team1Score: number,
    team2Score: number,
    team1PenaltyScore?: number,
    team2PenaltyScore?: number,
    editedBy?: string,
  ): Promise<MatchResult> {
    const result = await this.getResultByMatchId(matchId);
    if (!result) {
      throw new NotFoundException(`No result found for match ${matchId}`);
    }

    // Validate score format
    this.validateScoreFormat(team1Score, team2Score);
    this.validatePenaltyFormat(team1PenaltyScore, team2PenaltyScore);

    // Store previous scores for audit trail
    const previousScores = {
      team1Score: result.team1Score,
      team2Score: result.team2Score,
    };

    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const winnerData = this.resolveWinnerData(
      match as { team1Id: string; team2Id: string; phase: MatchPhase },
      team1Score,
      team2Score,
      team1PenaltyScore,
      team2PenaltyScore,
    );

    result.team1Score = team1Score;
    result.team2Score = team2Score;
    result.team1PenaltyScore = winnerData.normalizedTeam1PenaltyScore;
    result.team2PenaltyScore = winnerData.normalizedTeam2PenaltyScore;
    result.winnerId = winnerData.winnerId;
    result.isDraw = winnerData.isDraw;
    result.decidedByPenalties = winnerData.decidedByPenalties;

    const updatedResult = await this.matchResultRepository.save(result);

    // Log audit trail
    if (editedBy) {
      this.logAuditTrail({
        matchId,
        publishedBy: editedBy,
        publishedAt: new Date(),
        team1Score,
        team2Score,
        action: 'edited',
        previousScores,
      });
    }

    return updatedResult;
  }

  async deleteResult(matchId: string): Promise<void> {
    const result = await this.getResultByMatchId(matchId);
    if (!result) {
      throw new NotFoundException(`No result found for match ${matchId}`);
    }

    await this.matchResultRepository.remove(result);

    // Update match status back to scheduled
    await this.matchRepository.updateStatus(matchId, MatchStatus.SCHEDULED);
  }

  async countResults(): Promise<number> {
    return this.matchResultRepository.count();
  }

  /**
   * Get all matches for admin result management.
   * Includes matches with and without published results so admins can publish or edit anytime.
   */
  async getPendingResults(): Promise<any[]> {
    const matches = await this.matchRepository.find({
      relations: ['team1', 'team2', 'result'],
      order: { scheduledTime: 'ASC' },
    });

    return matches.map((match) => ({
      matchId: match.id,
      team1: match.team1,
      team2: match.team2,
      scheduledTime: match.scheduledTime,
      status: match.status,
      predictionsBlocked: match.predictionsBlocked,
      phase: match.phase,
      group: match.groupStageGroup,
      eliminationRound: match.eliminationRound,
      result: match.result
        ? {
            id: match.result.id,
            team1Score: match.result.team1Score,
            team2Score: match.result.team2Score,
            team1PenaltyScore: match.result.team1PenaltyScore,
            team2PenaltyScore: match.result.team2PenaltyScore,
            publishedTimestamp: match.result.publishedTimestamp,
          }
        : null,
    }));
  }

  /**
   * Log audit trail for result changes
   * Requirement 5.7, 26.9: Record publication timestamp and changes
   */
  private logAuditTrail(audit: ResultPublicationAudit): void {
    // In a production system, this would be persisted to an audit log table
    // For now, we log to console for demonstration
    console.log('[AUDIT TRAIL]', JSON.stringify(audit, null, 2));
  }
}
