import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TeamRepository } from '../repositories/team.repository';
import { Team } from '../entities/team.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TeamService {
  constructor(private teamRepository: TeamRepository) {}

  async createTeam(
    name: string,
    code: string,
    groupStageGroup?: string,
  ): Promise<Team> {
    const existingTeam = await this.teamRepository.findByCode(code);
    if (existingTeam) {
      throw new BadRequestException(`Team with code ${code} already exists`);
    }

    const team = this.teamRepository.create({
      id: uuid(),
      name,
      code,
      groupStageGroup,
    });

    return this.teamRepository.save(team);
  }

  async getTeamById(teamId: string): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }
    return team;
  }

  async getTeamByCode(code: string): Promise<Team> {
    const team = await this.teamRepository.findByCode(code);
    if (!team) {
      throw new NotFoundException(`Team with code ${code} not found`);
    }
    return team;
  }

  async getTeamsByGroup(group: string): Promise<Team[]> {
    return this.teamRepository.findByGroup(group);
  }

  async getAllTeams(): Promise<Team[]> {
    return this.teamRepository.findAllTeams();
  }

  async getTeamsByIds(teamIds: string[]): Promise<Team[]> {
    if (teamIds.length === 0) {
      return [];
    }
    return this.teamRepository.findTeamsByIds(teamIds);
  }

  async getTeamWithMatches(teamId: string): Promise<Team> {
    const team = await this.teamRepository.findWithMatches(teamId);
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }
    return team;
  }

  async updateTeam(
    teamId: string,
    name: string,
    groupStageGroup?: string,
  ): Promise<Team> {
    const team = await this.getTeamById(teamId);

    team.name = name;
    if (groupStageGroup !== undefined) {
      team.groupStageGroup = groupStageGroup;
    }

    return this.teamRepository.save(team);
  }

  async countTeams(): Promise<number> {
    return this.teamRepository.count();
  }

  async countTeamsByGroup(group: string): Promise<number> {
    return this.teamRepository.count({
      where: { groupStageGroup: group },
    });
  }
}
