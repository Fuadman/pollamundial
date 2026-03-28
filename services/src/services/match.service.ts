import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchRepository } from '../repositories/match.repository';
import { TeamRepository } from '../repositories/team.repository';
import { Match, MatchStatus, MatchPhase } from '../entities/match.entity';
import { TimezoneService } from './timezone.service';
import { MatchResponseDto, TimezoneInfoDto } from '../controllers/dtos/match.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class MatchService {
  constructor(
    private matchRepository: MatchRepository,
    private teamRepository: TeamRepository,
    private timezoneService: TimezoneService,
  ) {}

  async createMatch(
    team1Id: string,
    team2Id: string,
    scheduledTime: Date,
    phase: MatchPhase,
    groupStageGroup?: string,
    eliminationRound?: string,
  ): Promise<Match> {
    // Validate teams exist
    const team1 = await this.teamRepository.findOne({ where: { id: team1Id } });
    const team2 = await this.teamRepository.findOne({ where: { id: team2Id } });

    if (!team1 || !team2) {
      throw new NotFoundException('One or both teams not found');
    }

    if (team1Id === team2Id) {
      throw new BadRequestException('A team cannot play against itself');
    }

    // Calculate lockdown time (15 minutes before scheduled time)
    const lockdownTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000);

    const match = this.matchRepository.create({
      id: uuid(),
      team1Id,
      team2Id,
      scheduledTime,
      lockdownTime,
      phase,
      groupStageGroup,
      eliminationRound,
      status: MatchStatus.SCHEDULED,
    });

    return this.matchRepository.save(match);
  }

  async getMatchById(matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['team1', 'team2', 'result'],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    return match;
  }

  async getMatchesByPhase(phase: MatchPhase): Promise<Match[]> {
    return this.matchRepository.findByPhase(phase);
  }

  async getMatchesByStatus(status: MatchStatus): Promise<Match[]> {
    return this.matchRepository.findByStatus(status);
  }

  async getMatchesByGroup(group: string): Promise<Match[]> {
    return this.matchRepository.findByGroup(group);
  }

  async getMatchesByEliminationRound(round: string): Promise<Match[]> {
    return this.matchRepository.findByEliminationRound(round);
  }

  async getMatchesByDateRange(startDate: Date, endDate: Date): Promise<Match[]> {
    return this.matchRepository.findByDateRange(startDate, endDate);
  }

  async getUpcomingMatches(beforeTime: Date): Promise<Match[]> {
    return this.matchRepository.findUpcomingMatches(beforeTime);
  }

  async getCompletedMatches(): Promise<Match[]> {
    return this.matchRepository.findCompletedMatches();
  }

  async getCompletedMatchesWithoutResult(): Promise<Match[]> {
    return this.matchRepository.findCompletedWithoutResult();
  }

  async getMatchesNearLockdown(minutesBefore: number = 30): Promise<Match[]> {
    return this.matchRepository.findMatchesNearLockdown(minutesBefore);
  }

  async updateMatchStatus(matchId: string, status: MatchStatus): Promise<Match> {
    await this.matchRepository.updateStatus(matchId, status);
    return this.getMatchById(matchId);
  }

  async updateLockdownTime(matchId: string, newScheduledTime: Date): Promise<Match> {
    const lockdownTime = new Date(newScheduledTime.getTime() - 15 * 60 * 1000);
    await this.matchRepository.updateLockdownTime(matchId, lockdownTime);

    // Also update scheduled time
    const match = await this.getMatchById(matchId);
    match.scheduledTime = newScheduledTime;
    return this.matchRepository.save(match);
  }

  async isMatchLocked(matchId: string): Promise<boolean> {
    const match = await this.getMatchById(matchId);
    return new Date() >= match.lockdownTime;
  }

  async getMatchLockdownTime(matchId: string): Promise<Date> {
    const match = await this.getMatchById(matchId);
    return match.lockdownTime;
  }

  async countMatchesByPhase(phase: MatchPhase): Promise<number> {
    return this.matchRepository.countByPhase(phase);
  }

  async countMatchesByStatus(status: MatchStatus): Promise<number> {
    return this.matchRepository.countByStatus(status);
  }

  async validateTournamentStructure(): Promise<{
    groupStageMatches: number;
    eliminationMatches: number;
    totalMatches: number;
    isValid: boolean;
  }> {
    const groupCount = await this.countMatchesByPhase(MatchPhase.GROUP);
    const eliminationCount = await this.countMatchesByPhase(MatchPhase.ELIMINATION);
    const totalCount = groupCount + eliminationCount;

    return {
      groupStageMatches: groupCount,
      eliminationMatches: eliminationCount,
      totalMatches: totalCount,
      isValid: groupCount === 72 && eliminationCount === 32 && totalCount === 104,
    };
  }

  async getMatchWithPredictions(matchId: string): Promise<Match> {
    const match = await this.matchRepository.findWithPredictions(matchId);
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }
    return match;
  }

  /**
   * Convert match to response DTO with timezone information
   * @param match - Match entity
   * @param userTimezoneOffset - User's timezone offset in minutes (optional)
   * @returns Match response DTO with timezone-aware times
   */
  convertMatchToResponseDto(
    match: Match,
    userTimezoneOffset?: number,
  ): MatchResponseDto {
    const scheduledTimeInfo = this.timezoneService.convertToUserTimezone(
      match.scheduledTime,
      userTimezoneOffset,
    );

    const lockdownTimeInfo = this.timezoneService.convertToUserTimezone(
      match.lockdownTime,
      userTimezoneOffset,
    );

    const dto: MatchResponseDto = {
      id: match.id,
      team1: {
        id: match.team1Id,
        name: match.team1?.name || '',
        code: match.team1?.code || '',
        groupStageGroup: match.team1?.groupStageGroup || null,
      },
      team2: {
        id: match.team2Id,
        name: match.team2?.name || '',
        code: match.team2?.code || '',
        groupStageGroup: match.team2?.groupStageGroup || null,
      },
      scheduledTime: {
        utcTime: match.scheduledTime,
        localTime: scheduledTimeInfo.localTime,
        offsetMinutes: scheduledTimeInfo.offsetMinutes,
        abbreviation: scheduledTimeInfo.abbreviation,
      },
      lockdownTime: {
        utcTime: match.lockdownTime,
        localTime: lockdownTimeInfo.localTime,
        offsetMinutes: lockdownTimeInfo.offsetMinutes,
        abbreviation: lockdownTimeInfo.abbreviation,
      },
      status: match.status,
      phase: match.phase,
      groupStageGroup: match.groupStageGroup,
      eliminationRound: match.eliminationRound,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };

    if (match.result) {
      dto.result = {
        team1Score: match.result.team1Score,
        team2Score: match.result.team2Score,
        winner: match.result.winnerId,
        isDraw: match.result.isDraw,
        publishedTimestamp: match.result.publishedTimestamp,
      };
    }

    return dto;
  }

  /**
   * Convert multiple matches to response DTOs
   * @param matches - Array of Match entities
   * @param userTimezoneOffset - User's timezone offset in minutes (optional)
   * @returns Array of Match response DTOs
   */
  convertMatchesToResponseDtos(
    matches: Match[],
    userTimezoneOffset?: number,
  ): MatchResponseDto[] {
    return matches.map((match) =>
      this.convertMatchToResponseDto(match, userTimezoneOffset),
    );
  }
}
