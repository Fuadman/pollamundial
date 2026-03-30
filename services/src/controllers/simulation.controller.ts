import { Controller, Get, Post, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../auth/services/admin.service';
import { SimulationService } from '../services/simulation.service';
import { ScoreUpdateGateway } from '../gateways/score-update.gateway';
import { UserScoreService } from '../services/user-score.service';
import { MatchResultService } from '../services/match-result.service';

@Controller('api/admin/simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(
    private readonly adminService: AdminService,
    private readonly simulationService: SimulationService,
    private readonly scoreUpdateGateway: ScoreUpdateGateway,
    private readonly userScoreService: UserScoreService,
    private readonly matchResultService: MatchResultService,
  ) {}

  @Get('status')
  async getStatus(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    return this.simulationService.getSimulationStatus();
  }

  @Post('generate-users')
  async generateUsers(@Body() body: { count?: number }, @Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const count = Math.min(Math.max(body.count ?? 10, 1), 50);
    const users = await this.simulationService.generateFakeUsers(count);
    return { created: users.length, message: `${users.length} usuarios ficticios creados` };
  }

  @Post('generate-predictions')
  async generatePredictions(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const total = await this.simulationService.generateRandomPredictions();
    return { created: total, message: `${total} predicciones generadas` };
  }

  @Post('generate-group-results')
  async generateGroupResults(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const result = await this.simulationService.generateRandomGroupResults();

    for (const matchId of result.matchIds) {
      this.scoreUpdateGateway.broadcastMatchResult(
        matchId,
        '⚽ Resultado de simulación publicado',
      );
    }

    await this.broadcastLeaderboardSnapshot();

    return {
      ...result,
      message: `${result.published} resultados publicados, ${result.updated} actualizados y ${result.scoredPredictions} predicciones puntuadas`,
    };
  }

  @Post('recalculate-positions')
  async recalculatePositions(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const result = await this.simulationService.recalculatePositions();
    await this.broadcastLeaderboardSnapshot();
    return {
      ...result,
      message: `Posiciones recalculadas: ${result.predictionsScored} predicciones puntuadas en ${result.matchesProcessed} partidos`,
    };
  }

  @Get('leaderboard')
  async getLeaderboard(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const leaderboard = await this.simulationService.getSimulatedLeaderboard();
    return { leaderboard };
  }

  @Get('users')
  async getFakeUsers(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const users = await this.simulationService.getFakeUsers();
    return { users };
  }

  @Get('results')
  async getSimulatedResults(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const results = await this.simulationService.getSimulatedResults();
    return { results };
  }

  @Delete('clear')
  async clearData(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const result = await this.simulationService.clearSimulationData();
    await this.broadcastLeaderboardSnapshot();
    return { ...result, message: 'Datos de simulación eliminados' };
  }

  @Delete('reset-all')
  async resetAllData(@Req() req: any) {
    await this.adminService.enforceAdminAccess(req.user.id);
    const result = await this.simulationService.resetToAdminOnly();
    await this.broadcastLeaderboardSnapshot();
    return {
      ...result,
      message:
        'Reset completado. Solo queda el usuario admin fuadsalo@gmail.com',
    };
  }

  private async broadcastLeaderboardSnapshot(): Promise<void> {
    const { rows } = await this.userScoreService.getLeaderboardPage('all', 1, 100);
    const publishedResults = await this.matchResultService.countResults();
    const hasPublishedResults = publishedResults > 0;

    const entries = rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: row.user?.name ?? 'Usuario',
      email: row.user?.email ?? '',
      totalPoints: hasPublishedResults ? row.totalPoints : 0,
      groupStagePoints: hasPublishedResults ? row.groupStagePoints : 0,
      eliminationPoints: hasPublishedResults ? row.eliminationPoints : 0,
      registrationTimestamp: row.user?.registrationTimestamp,
    }));

    this.scoreUpdateGateway.broadcastLeaderboardUpdate(entries);
  }
}
