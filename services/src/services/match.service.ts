import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchRepository } from '../repositories/match.repository';
import { TeamRepository } from '../repositories/team.repository';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { Match, MatchStatus, MatchPhase } from '../entities/match.entity';
import { TimezoneService } from './timezone.service';
import { MatchResponseDto, TimezoneInfoDto } from '../controllers/dtos/match.dto';
import { v4 as uuid } from 'uuid';

export interface GroupStandingRow {
  teamId: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupStanding {
  group: string;
  standings: Array<GroupStandingRow & { position: number }>;
}

@Injectable()
export class MatchService {
  constructor(
    private matchRepository: MatchRepository,
    private teamRepository: TeamRepository,
    private matchResultRepository: MatchResultRepository,
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

    if (!match.result) {
      const fallbackResult = await this.matchResultRepository.findByMatchId(match.id);
      if (fallbackResult) {
        match.result = fallbackResult;
      }
    }

    return match;
  }

  async getMatchesByPhase(phase: MatchPhase): Promise<Match[]> {
    const matches = await this.matchRepository.findByPhase(phase);
    return this.hydrateMissingResults(matches);
  }

  async getMatchesByStatus(status: MatchStatus): Promise<Match[]> {
    const matches = await this.matchRepository.findByStatus(status);
    return this.hydrateMissingResults(matches);
  }

  async getMatchesByGroup(group: string): Promise<Match[]> {
    const matches = await this.matchRepository.findByGroup(group);
    return this.hydrateMissingResults(matches);
  }

  async getGroupStandings(group?: string): Promise<GroupStanding[]> {
    const groupFilter = group?.trim().toUpperCase();
    const teams = groupFilter
      ? await this.teamRepository.findByGroup(groupFilter)
      : await this.teamRepository.findAllTeams();

    if (teams.length === 0) {
      return [];
    }

    const groupMatches = await this.matchRepository.findByPhase(MatchPhase.GROUP);
    const matchesById = new Map(groupMatches.map((match) => [match.id, match]));
    const matchResults = await this.matchResultRepository.find();
    const standingsByGroup = new Map<string, Map<string, GroupStandingRow>>();

    for (const team of teams) {
      const grp = team.groupStageGroup;
      if (!grp) {
        continue;
      }

      if (!standingsByGroup.has(grp)) {
        standingsByGroup.set(grp, new Map());
      }

      standingsByGroup.get(grp)!.set(team.id, {
        teamId: team.id,
        team: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }

    for (const result of matchResults) {
      const match = matchesById.get(result.matchId);
      if (!match || !match.groupStageGroup) {
        continue;
      }

      const grp = match.groupStageGroup;
      if (groupFilter && grp !== groupFilter) {
        continue;
      }

      const groupRows = standingsByGroup.get(grp);
      if (!groupRows) {
        continue;
      }

      const team1 = groupRows.get(match.team1Id);
      const team2 = groupRows.get(match.team2Id);
      if (!team1 || !team2) {
        continue;
      }

      const t1 = result.team1Score;
      const t2 = result.team2Score;

      team1.played += 1;
      team2.played += 1;

      team1.goalsFor += t1;
      team1.goalsAgainst += t2;
      team2.goalsFor += t2;
      team2.goalsAgainst += t1;

      if (t1 > t2) {
        team1.won += 1;
        team2.lost += 1;
        team1.points += 3;
      } else if (t2 > t1) {
        team2.won += 1;
        team1.lost += 1;
        team2.points += 3;
      } else {
        team1.drawn += 1;
        team2.drawn += 1;
        team1.points += 1;
        team2.points += 1;
      }
    }

    const result: GroupStanding[] = [];

    const sortedGroups = Array.from(standingsByGroup.keys()).sort((a, b) =>
      a.localeCompare(b),
    );

    for (const grp of sortedGroups) {
      const rows = Array.from(standingsByGroup.get(grp)!.values()).map((row) => ({
        ...row,
        goalDifference: row.goalsFor - row.goalsAgainst,
      }));

      rows.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          a.team.localeCompare(b.team),
      );

      result.push({
        group: grp,
        standings: rows.map((row, index) => ({
          position: index + 1,
          ...row,
        })),
      });
    }

    return result;
  }

  async getMatchesByEliminationRound(round: string): Promise<Match[]> {
    const matches = await this.matchRepository.findByEliminationRound(round);
    return this.hydrateMissingResults(matches);
  }

  async getMatchesByDateRange(startDate: Date, endDate: Date): Promise<Match[]> {
    const matches = await this.matchRepository.findByDateRange(startDate, endDate);
    return this.hydrateMissingResults(matches);
  }

  async getUpcomingMatches(beforeTime: Date): Promise<Match[]> {
    return this.matchRepository.findUpcomingMatches(beforeTime);
  }

  async getCompletedMatches(): Promise<Match[]> {
    const matches = await this.matchRepository.findCompletedMatches();
    return this.hydrateMissingResults(matches);
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
    if (!match.result) {
      const fallbackResult = await this.matchResultRepository.findByMatchId(match.id);
      if (fallbackResult) {
        match.result = fallbackResult;
      }
    }
    return match;
  }

  private async hydrateMissingResults(matches: Match[]): Promise<Match[]> {
    const missingIds = matches
      .filter((match) => !match.result)
      .map((match) => match.id);

    if (missingIds.length === 0) {
      return matches;
    }

    const fallbackResults = await this.matchResultRepository.findByMatchIds(missingIds);
    if (fallbackResults.length === 0) {
      return matches;
    }

    const resultByMatchId = new Map(
      fallbackResults.map((result) => [result.matchId, result]),
    );

    for (const match of matches) {
      if (!match.result) {
        const fallback = resultByMatchId.get(match.id);
        if (fallback) {
          match.result = fallback;
        }
      }
    }

    return matches;
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
      predictionsBlocked: match.predictionsBlocked,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };

    if (match.result) {
      dto.result = {
        team1Score: match.result.team1Score,
        team2Score: match.result.team2Score,
        team1PenaltyScore: match.result.team1PenaltyScore,
        team2PenaltyScore: match.result.team2PenaltyScore,
        winner: match.result.winnerId,
        isDraw: match.result.isDraw,
        decidedByPenalties: match.result.decidedByPenalties,
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
