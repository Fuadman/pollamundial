import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  Header,
} from '@nestjs/common';
import { MatchService } from '../services/match.service';
import { Match, MatchStatus, MatchPhase } from '../entities/match.entity';
import { MatchResponseDto } from './dtos/match.dto';

@Controller('api/matches')
export class MatchController {
  constructor(private matchService: MatchService) {}

  /**
   * GET /api/matches
   * Get matches with optional filtering by phase, status, date range, and group
   */
  @Get()
  async getMatches(
    @Query('phase') phase?: string,
    @Query('status') status?: string,
    @Query('group') group?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('timezone') timezone?: string,
  ): Promise<MatchResponseDto[]> {
    // Parse timezone offset from query parameter
    const userTimezoneOffset = timezone ? parseInt(timezone, 10) : undefined;

    // Validate phase if provided
    if (phase && !Object.values(MatchPhase).includes(phase as MatchPhase)) {
      throw new BadRequestException(
        `Invalid phase. Must be one of: ${Object.values(MatchPhase).join(', ')}`,
      );
    }

    // Validate status if provided
    if (status && !Object.values(MatchStatus).includes(status as MatchStatus)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${Object.values(MatchStatus).join(', ')}`,
      );
    }

    // If date range is provided, use it
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException(
          'Invalid date format. Use ISO 8601 format (e.g., 2026-06-01T00:00:00Z)',
        );
      }

      if (start > end) {
        throw new BadRequestException('startDate must be before endDate');
      }

      let matches = await this.matchService.getMatchesByDateRange(start, end);

      // Apply additional filters
      if (phase) {
        matches = matches.filter((m) => m.phase === phase);
      }
      if (status) {
        matches = matches.filter((m) => m.status === status);
      }
      if (group) {
        if (phase && phase !== MatchPhase.GROUP) {
          throw new BadRequestException(
            'Group filter only applies to group stage matches',
          );
        }
        matches = matches.filter((m) => m.groupStageGroup === group);
      }

      return this.matchService.convertMatchesToResponseDtos(
        matches,
        userTimezoneOffset,
      );
    }

    // If group is specified, return group stage matches
    if (group) {
      if (phase && phase !== MatchPhase.GROUP) {
        throw new BadRequestException(
          'Group filter only applies to group stage matches',
        );
      }
      const matches = await this.matchService.getMatchesByGroup(group);
      return this.matchService.convertMatchesToResponseDtos(
        matches,
        userTimezoneOffset,
      );
    }

    // If phase is specified, return matches by phase
    if (phase) {
      let matches = await this.matchService.getMatchesByPhase(
        phase as MatchPhase,
      );

      if (status) {
        matches = matches.filter((m) => m.status === status);
      }

      return this.matchService.convertMatchesToResponseDtos(
        matches,
        userTimezoneOffset,
      );
    }

    // If status is specified, return matches by status
    if (status) {
      const matches = await this.matchService.getMatchesByStatus(
        status as MatchStatus,
      );
      return this.matchService.convertMatchesToResponseDtos(
        matches,
        userTimezoneOffset,
      );
    }

    // Return all matches
    const groupMatches = await this.matchService.getMatchesByPhase(
      MatchPhase.GROUP,
    );
    const eliminationMatches = await this.matchService.getMatchesByPhase(
      MatchPhase.ELIMINATION,
    );

    const allMatches = [...groupMatches, ...eliminationMatches];
    return this.matchService.convertMatchesToResponseDtos(
      allMatches,
      userTimezoneOffset,
    );
  }

  /**
   * GET /api/matches/:matchId
   * Get a specific match by ID
   */
  @Get(':matchId')
  async getMatch(
    @Param('matchId') matchId: string,
    @Query('timezone') timezone?: string,
  ): Promise<MatchResponseDto> {
    try {
      const userTimezoneOffset = timezone ? parseInt(timezone, 10) : undefined;
      const match = await this.matchService.getMatchById(matchId);
      return this.matchService.convertMatchToResponseDto(
        match,
        userTimezoneOffset,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid match ID format');
    }
  }

  /**
   * GET /api/matches/schedule/group
   * Get all group stage matches
   */
  @Get('schedule/group')
  async getGroupSchedule(
    @Query('timezone') timezone?: string,
  ): Promise<MatchResponseDto[]> {
    const userTimezoneOffset = timezone ? parseInt(timezone, 10) : undefined;
    const matches = await this.matchService.getMatchesByPhase(MatchPhase.GROUP);
    return this.matchService.convertMatchesToResponseDtos(
      matches,
      userTimezoneOffset,
    );
  }

  /**
   * GET /api/matches/schedule/elimination
   * Get all elimination phase matches
   */
  @Get('schedule/elimination')
  async getEliminationSchedule(
    @Query('timezone') timezone?: string,
  ): Promise<MatchResponseDto[]> {
    const userTimezoneOffset = timezone ? parseInt(timezone, 10) : undefined;
    const matches = await this.matchService.getMatchesByPhase(
      MatchPhase.ELIMINATION,
    );
    return this.matchService.convertMatchesToResponseDtos(
      matches,
      userTimezoneOffset,
    );
  }
}
