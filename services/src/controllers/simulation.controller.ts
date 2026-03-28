import { Controller, Get, Post, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../auth/services/admin.service';
import { SimulationService } from '../services/simulation.service';

@Controller('api/admin/simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(
    private readonly adminService: AdminService,
    private readonly simulationService: SimulationService,
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
    return {
      ...result,
      message: `${result.published} resultados publicados, ${result.updated} actualizados y ${result.scoredPredictions} predicciones puntuadas`,
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
    return { ...result, message: 'Datos de simulación eliminados' };
  }
}
