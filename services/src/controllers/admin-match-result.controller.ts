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
import { PredictionService } from '../services/prediction.service';
import { ScoreUpdateService } from '../services/score-update.service';
import { AdminService } from '../auth/services/admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchResult } from '../entities/match-result.entity';
import { ScoreUpdateGateway } from '../gateways/score-update.gateway';

export interface PublishResultDto {
  team1Score: number;
  team2Score: number;
  team1PenaltyScore?: number;
  team2PenaltyScore?: number;
}

export interface ResultResponse {
  id: string;
  matchId: string;
  team1Score: number;
  team2Score: number;
  team1PenaltyScore: number | null;
  team2PenaltyScore: number | null;
  winnerId: string | null;
  isDraw: boolean;
  decidedByPenalties: boolean;
  publishedTimestamp: Date;
}

@Controller('api/admin/matches')
@UseGuards(JwtAuthGuard)
export class AdminMatchResultController {
  constructor(
    private matchResultService: MatchResultService,
    private predictionService: PredictionService,
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
      dto.team1PenaltyScore,
      dto.team2PenaltyScore,
      req.user.id,
    );

    // Side effects (scoring/bracket/socket) are handled automatically by MatchResultSubscriber.

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
      dto.team1PenaltyScore,
      dto.team2PenaltyScore,
      req.user.id,
    );

    // Side effects (scoring/bracket/socket) are handled automatically by MatchResultSubscriber.

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

    const existingResult = await this.matchResultService.getResultByMatchId(matchId);

    if (existingResult) {
      await this.matchResultService.updateResult(
        matchId,
        dto.team1Score,
        dto.team2Score,
        dto.team1PenaltyScore,
        dto.team2PenaltyScore,
        req.user.id,
      );
    } else {
      await this.matchResultService.publishResult(
        matchId,
        dto.team1Score,
        dto.team2Score,
        dto.team1PenaltyScore,
        dto.team2PenaltyScore,
        req.user.id,
      );
    }
    // Side effects (scoring/bracket/socket) are handled automatically by MatchResultSubscriber.

    return {
      matchId,
      team1Score: scoreUpdate.team1Score,
      team2Score: scoreUpdate.team2Score,
      timestamp: scoreUpdate.timestamp,
      connectedClients: this.scoreUpdateGateway.getConnectedClientsCount(matchId),
    };
  }

  @Post(':matchId/block-predictions')
  async blockPredictions(
    @Param('matchId') matchId: string,
    @Req() req: any,
  ): Promise<{ matchId: string; lockedExistingPredictions: number; message: string }> {
    await this.adminService.enforceAdminAccess(req.user.id);

    const result = await this.predictionService.blockPredictionsForMatch(matchId);

    return {
      matchId,
      lockedExistingPredictions: result.lockedExistingPredictions,
      message: `Predicciones bloqueadas para el partido. ${result.lockedExistingPredictions} predicciones existentes fueron bloqueadas.`,
    };
  }

  @Post(':matchId/unblock-predictions')
  async unblockPredictions(
    @Param('matchId') matchId: string,
    @Req() req: any,
  ): Promise<{ matchId: string; unlockedPredictions: number; message: string }> {
    await this.adminService.enforceAdminAccess(req.user.id);

    const result = await this.predictionService.unblockPredictionsForMatch(matchId);

    return {
      matchId,
      unlockedPredictions: result.unlockedPredictions,
      message: `Predicciones desbloqueadas para el partido. ${result.unlockedPredictions} predicciones fueron reabiertas.`,
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
      team1PenaltyScore: result.team1PenaltyScore,
      team2PenaltyScore: result.team2PenaltyScore,
      winnerId: result.winnerId,
      isDraw: result.isDraw,
      decidedByPenalties: result.decidedByPenalties,
      publishedTimestamp: result.publishedTimestamp,
    };
  }
}
