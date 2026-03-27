import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';

@Injectable()
export class TeamRepository extends Repository<Team> {
  constructor(private dataSource: DataSource) {
    super(Team, dataSource.createEntityManager());
  }

  async findByCode(code: string): Promise<Team | null> {
    return this.findOne({ where: { code } });
  }

  async findByGroup(group: string): Promise<Team[]> {
    return this.find({
      where: { groupStageGroup: group },
    });
  }

  async findAllTeams(): Promise<Team[]> {
    return this.find();
  }

  async findTeamsByIds(teamIds: string[]): Promise<Team[]> {
    return this.findByIds(teamIds);
  }

  async findWithMatches(teamId: string): Promise<Team | null> {
    return this.findOne({
      where: { id: teamId },
      relations: ['matchesAsTeam1', 'matchesAsTeam2', 'wonMatches'],
    });
  }
}
