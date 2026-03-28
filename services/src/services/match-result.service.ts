import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { MatchRepository } from '../repositories/match.repository';
import { TeamRepository } from '../repositories/team.repository';
import { MatchResult } from '../entities/match-result.entity';
import { MatchStatus } from '../entities/match.entity';
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
    publishedBy?: string,
  ): Promise<MatchResult> {
    // Validate match exists
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    // Validate score format
    this.validateScoreFormat(team1Score, team2Score);

    // Check if result already exists (duplicate prevention)
    const existingResult = await this.matchResultRepository.findByMatchId(matchId);
    if (existingResult) {
      throw new BadRequestException(
        `Result already published for match ${matchId}`,
      );
    }

    // Determine winner
    let winnerId: string | null = null;
    const isDraw = team1Score === team2Score;

    if (!isDraw) {
      winnerId =
        team1Score > team2Score ? match.team1Id : match.team2Id;
    }

    const result = this.matchResultRepository.create({
      id: uuid(),
      matchId,
      team1Score,
      team2Score,
      winnerId,
      isDraw,
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
    editedBy?: string,
  ): Promise<MatchResult> {
    const result = await this.getResultByMatchId(matchId);
    if (!result) {
      throw new NotFoundException(`No result found for match ${matchId}`);
    }

    // Validate score format
    this.validateScoreFormat(team1Score, team2Score);

    // Store previous scores for audit trail
    const previousScores = {
      team1Score: result.team1Score,
      team2Score: result.team2Score,
    };

    // Determine new winner
    let winnerId: string | null = null;
    const isDraw = team1Score === team2Score;

    if (!isDraw) {
      const match = await this.matchRepository.findOne({ where: { id: matchId } });
      if (!match) {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }
      winnerId = team1Score > team2Score ? match.team1Id : match.team2Id;
    }

    result.team1Score = team1Score;
    result.team2Score = team2Score;
    result.winnerId = winnerId;
    result.isDraw = isDraw;

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
   * Get pending results (completed matches without published results)
   * Requirement 5.2, 26.1: Display list of completed matches awaiting result entry
   */
  async getPendingResults(): Promise<any[]> {
    const completedMatches = await this.matchRepository.findCompletedWithoutResult();
    return completedMatches.map((match) => ({
      matchId: match.id,
      team1: match.team1,
      team2: match.team2,
      scheduledTime: match.scheduledTime,
      status: match.status,
      predictionsBlocked: match.predictionsBlocked,
      phase: match.phase,
      group: match.groupStageGroup,
      eliminationRound: match.eliminationRound,
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
