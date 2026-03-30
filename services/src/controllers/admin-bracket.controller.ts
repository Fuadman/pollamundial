import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { In } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../auth/services/admin.service';
import { BracketService } from '../services/bracket.service';
import { TeamRepository } from '../repositories/team.repository';
import { Team } from '../entities/team.entity';

interface ConfigureBracketDto {
  teams: string[];
}

@Controller('api/admin/bracket')
@UseGuards(JwtAuthGuard)
export class AdminBracketController {
  constructor(
    private readonly adminService: AdminService,
    private readonly bracketService: BracketService,
    private readonly teamRepository: TeamRepository,
  ) {}

  @Get('phase-readiness')
  async getPhaseReadiness(@Req() req: any): Promise<{
    round32AutoEnabled: boolean;
    round16Editable: boolean;
    quarterfinalsEditable: boolean;
    semifinalsEditable: boolean;
  }> {
    await this.adminService.enforceAdminAccess(req.user.id);
    return this.bracketService.getPhaseEditReadiness();
  }

  @Post('round16')
  async configureRound16(
    @Body() dto: ConfigureBracketDto,
    @Req() req: any,
  ): Promise<{ createdMatches: number; matchIds: string[] }> {
    await this.adminService.enforceAdminAccess(req.user.id);
    const teams = await this.getTeamsFromIds(dto.teams, 16);
    const matches = await this.bracketService.configureRound16(teams);
    return {
      createdMatches: matches.length,
      matchIds: matches.map((match) => match.id),
    };
  }

  @Post('quarterfinals')
  async configureQuarterfinals(
    @Body() dto: ConfigureBracketDto,
    @Req() req: any,
  ): Promise<{ createdMatches: number; matchIds: string[] }> {
    await this.adminService.enforceAdminAccess(req.user.id);
    const teams = await this.getTeamsFromIds(dto.teams, 8);
    const matches = await this.bracketService.configureQuarterfinals(teams);
    return {
      createdMatches: matches.length,
      matchIds: matches.map((match) => match.id),
    };
  }

  @Post('semifinals')
  async configureSemifinals(
    @Body() dto: ConfigureBracketDto,
    @Req() req: any,
  ): Promise<{ semifinalMatches: number; thirdPlaceMatchId: string }> {
    await this.adminService.enforceAdminAccess(req.user.id);
    const teams = await this.getTeamsFromIds(dto.teams, 4);
    const result = await this.bracketService.configureSemifinals(teams);

    return {
      semifinalMatches: result.semifinalMatches.length,
      thirdPlaceMatchId: result.thirdPlaceMatch.id,
    };
  }

  @Post('generate-round32')
  async generateRound32(
    @Req() req: any,
  ): Promise<{ createdMatches: number; matchIds: string[] }> {
    await this.adminService.enforceAdminAccess(req.user.id);
    const matches = await this.bracketService.generateRound32FromGroupStage();

    return {
      createdMatches: matches.length,
      matchIds: matches.map((match) => match.id),
    };
  }

  private async getTeamsFromIds(teamIds: string[], expectedCount: number): Promise<Team[]> {
    if (!Array.isArray(teamIds) || teamIds.length !== expectedCount) {
      throw new BadRequestException(`Expected exactly ${expectedCount} team IDs`);
    }

    const unique = new Set(teamIds);
    if (unique.size !== teamIds.length) {
      throw new BadRequestException('Duplicate teams are not allowed');
    }

    const teams = await this.teamRepository.findBy({ id: In(teamIds) });
    const byId = new Map(teams.map((team) => [team.id, team]));
    const orderedTeams = teamIds.map((id) => byId.get(id)).filter((team): team is Team => !!team);

    if (orderedTeams.length !== expectedCount) {
      throw new BadRequestException('One or more teams were not found');
    }

    return orderedTeams;
  }
}