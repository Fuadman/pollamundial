import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MatchResultService } from '../services/match-result.service';
import { ScoringService } from '../services/scoring.service';
import { ScoreUpdateService } from '../services/score-update.service';
import { AdminService } from '../auth/services/admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchResult } from '../entities/match-result.entity';
import { ScoreUpdateGateway } from '../gateways/score-update.gateway';

export interface PublishResultDto {
  team1Score: number;
  team2Score: number;
}

export interface ResultResponse {
  id: string;
  matchId: string;
  team1Score: number;
  team2Score: number;
  winnerId: string | null;
  isDraw: boolean;
  publishedTimestamp: Date;
}

@Controller('api/admin/matches')
@UseGuards(JwtAuthGuard)
export class AdminMatchResultController {
  constructor(
    private matchResultService: MatchResultService,
    private scoringService: ScoringService,
    private scoreUpdateService: ScoreUpdateService,
    private adminService: AdminService,
    private scoreUpdateGateway: ScoreUpdateGateway,
  ) {}

  /**
   * GET /api/admin/matches/pending-results
   * Get completed matches awaiting result entry
   * Requirement 5.2, 26.1: Display list of completed matches awaiting result entry
   */
  @Get('pending-results')
  async getPendingResults(@Req() req: any): Promise<any[]> {
    // Verify admin access
    await this.adminService.enforceAdminAccess(req.user.id);

    return this.matchResultService.getPendingResults();
  }

  /**
   * POST /api/admin/matches/:matchId/result
   * Publish match result
   * Requirement 5.1-5.7: Admin publishes result with validation and timestamp
   * Requirement 26.3-26.6: Result entry with validation and score calculation
   */
  @Post(':matchId/result')
  async publishResult(
    @Param('matchId') matchId: string,
    @Body() dto: PublishResultDto,
    @Req() req: any,
  ): Promise<ResultResponse> {
    // Verify admin access
    await this.adminService.enforceAdminAccess(req.user.id);

    // Validate input
    if (
      typeof dto.team1Score !== 'number' ||
      typeof dto.team2Score !== 'number'
    ) {
      throw new BadRequestException('Invalid score format');
    }

    // Publish result
    const result = await this.matchResultService.publishResult(
      matchId,
      dto.team1Score,
      dto.team2Score,
      req.user.id,
    );

    // Trigger automatic score calculation for all predictions
    // Requirement 5.4: Trigger automatic score calculation
    try {
      await this.scoringService.calculateAllScoresForMatch(matchId);
    } catch (error) {
      // Log error but don't fail the result publication
      console.error(
        `Failed to calculate scores for match ${matchId}:`,
        error,
      );
    }

    return this.mapResultToResponse(result);
  }

  /**
   * GET /api/admin/matches/:matchId/result
   * Get published result
   * Requirement 26.2: Display match with teams, scheduled time, and status
   */
  @Get(':matchId/result')
  async getResult(
    @Param('matchId') matchId: string,
    @Req() req: any,
  ): Promise<ResultResponse | null> {
    // Verify admin access
    await this.adminService.enforceAdminAccess(req.user.id);

    const result = await this.matchResultService.getResultByMatchId(matchId);
    if (!result) {
      throw new NotFoundException(`No result found for match ${matchId}`);
    }

    return this.mapResultToResponse(result);
  }

  /**
   * PUT /api/admin/matches/:matchId/result
   * Edit published result with audit trail
   * Requirement 26.9: Allow admins to edit published results with audit trail
   */
  @Put(':matchId/result')
  async editResult(
    @Param('matchId') matchId: string,
    @Body() dto: PublishResultDto,
    @Req() req: any,
  ): Promise<ResultResponse> {
    // Verify admin access
    await this.adminService.enforceAdminAccess(req.user.id);

    // Validate input
    if (
      typeof dto.team1Score !== 'number' ||
      typeof dto.team2Score !== 'number'
    ) {
      throw new BadRequestException('Invalid score format');
    }

    // Update result
    const result = await this.matchResultService.updateResult(
      matchId,
      dto.team1Score,
      dto.team2Score,
      req.user.id,
    );

    // Recalculate scores for all predictions
    try {
      await this.scoringService.recalculateScoresForMatch(matchId);
    } catch (error) {
      // Log error but don't fail the result update
      console.error(
        `Failed to recalculate scores for match ${matchId}:`,
        error,
      );
    }

    return this.mapResultToResponse(result);
  }

  /**
   * POST /api/admin/matches/:matchId/score-update
   * Ingest live score update during match
   * Requirement 17.1: Create score update ingestion logic
   * Requirement 17.2: Broadcast score changes via WebSocket
   * Requirement 17.3: Cache score updates in Redis
   * Requirement 17.4: Update displayed score within 30 seconds
   * Requirement 17.5: Ensure consistent score information across multiple users
   */
  @Post(':matchId/score-update')
  async ingestScoreUpdate(
    @Param('matchId') matchId: string,
    @Body() dto: PublishResultDto,
    @Req() req: any,
  ): Promise<any> {
    // Verify admin access
    await this.adminService.enforceAdminAccess(req.user.id);

    // Validate input
    if (
      typeof dto.team1Score !== 'number' ||
      typeof dto.team2Score !== 'number'
    ) {
      throw new BadRequestException('Invalid score format');
    }

    // Ingest the score update
    const scoreUpdate = await this.scoreUpdateService.ingestScoreUpdate(
      matchId,
      dto.team1Score,
      dto.team2Score,
    );

    // Broadcast to all connected clients watching this match
    this.scoreUpdateGateway.broadcastScoreUpdate(
      matchId,
      scoreUpdate.team1Score,
      scoreUpdate.team2Score,
      scoreUpdate.timestamp,
    );

    return {
      matchId,
      team1Score: scoreUpdate.team1Score,
      team2Score: scoreUpdate.team2Score,
      timestamp: scoreUpdate.timestamp,
      connectedClients: this.scoreUpdateGateway.getConnectedClientsCount(matchId),
    };
  }

  /**
   * GET /api/admin/matches/:matchId/score
   * Get current cached score for a match
   * Requirement 17.4: Display current score
   */
  @Get(':matchId/score')
  async getCurrentScore(@Param('matchId') matchId: string, @Req() req: any): Promise<any> {
    // Verify admin access
    await this.adminService.enforceAdminAccess(req.user.id);

    const cachedScore = await this.scoreUpdateService.getCachedScore(matchId);
    if (!cachedScore) {
      throw new NotFoundException(`No cached score found for match ${matchId}`);
    }

    return cachedScore;
  }

  /**
   * Map MatchResult entity to response DTO
   */
  private mapResultToResponse(result: MatchResult): ResultResponse {
    return {
      id: result.id,
      matchId: result.matchId,
      team1Score: result.team1Score,
      team2Score: result.team2Score,
      winnerId: result.winnerId,
      isDraw: result.isDraw,
      publishedTimestamp: result.publishedTimestamp,
    };
  }
}
