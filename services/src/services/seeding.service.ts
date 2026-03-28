import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Match, MatchPhase, MatchStatus } from '../entities/match.entity';
import { v4 as uuid } from 'uuid';
import { seedCopaMundial2026 } from '../seeds/copa-mundial-2026.seed';

interface TeamData {
  name: string;
  code: string;
  group: string;
}

@Injectable()
export class SeedingService {
  private readonly logger = new Logger(SeedingService.name);

  constructor(private dataSource: DataSource) {}

  /**
   * Seeds Copa América 2024 tournament data
   * - 32 teams organized into 8 groups (A-H)
   * - 72 group stage matches with scheduled times
   */
  async seedCopaAmerica2024(): Promise<{
    teamsCreated: number;
    matchesCreated: number;
  }> {
    const teamRepository = this.dataSource.getRepository(Team);
    const matchRepository = this.dataSource.getRepository(Match);

    this.logger.log('Starting Copa América 2024 seeding...');

    // Check if data already exists
    const existingTeams = await teamRepository.count();
    if (existingTeams > 0) {
      this.logger.warn('Teams already exist in database. Skipping seeding.');
      return { teamsCreated: 0, matchesCreated: 0 };
    }

    const teams = this.getTeamsData();
    const teamMap = new Map<string, Team>();

    // Create teams
    this.logger.log('Creating 32 teams...');
    for (const teamData of teams) {
      const team = new Team();
      team.id = uuid();
      team.name = teamData.name;
      team.code = teamData.code;
      team.groupStageGroup = teamData.group;

      const savedTeam = await teamRepository.save(team);
      teamMap.set(teamData.code, savedTeam);
      this.logger.debug(
        `Created ${teamData.name} (${teamData.code}) - Group ${teamData.group}`,
      );
    }

    // Generate group stage matches
    this.logger.log('Generating 72 group stage matches...');
    const matches: Match[] = [];
    let currentDate = new Date('2026-06-11T00:00:00Z'); // June 11, 2026 UTC

    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (const group of groups) {
      const groupTeams = teams.filter((t) => t.group === group);
      const { matches: groupMatches, nextDate } = this.generateGroupMatches(
        teamMap,
        groupTeams,
        currentDate,
      );
      matches.push(...groupMatches);
      currentDate = nextDate;
    }

    // Save all matches
    for (const match of matches) {
      await matchRepository.save(match);
    }

    this.logger.log(`Created ${matches.length} group stage matches`);

    // Validate tournament structure
    const groupMatches = await matchRepository.count({
      where: { phase: MatchPhase.GROUP },
    });

    this.logger.log('✓ Copa América 2024 seeding completed!');
    this.logger.log(`  - Teams created: 32`);
    this.logger.log(`  - Group stage matches: ${groupMatches}`);
    this.logger.log(`  - Date range: June 11-27, 2026 UTC`);

    return {
      teamsCreated: teams.length,
      matchesCreated: matches.length,
    };
  }

  /**
   * Get Copa América 2024 teams data
   */
  private getTeamsData(): TeamData[] {
    return [
      // Group A
      { name: 'Argentina', code: 'ARG', group: 'A' },
      { name: 'Peru', code: 'PER', group: 'A' },
      { name: 'Chile', code: 'CHI', group: 'A' },
      { name: 'Canada', code: 'CAN', group: 'A' },

      // Group B
      { name: 'Brazil', code: 'BRA', group: 'B' },
      { name: 'Colombia', code: 'COL', group: 'B' },
      { name: 'Paraguay', code: 'PAR', group: 'B' },
      { name: 'Costa Rica', code: 'CRC', group: 'B' },

      // Group C
      { name: 'Uruguay', code: 'URU', group: 'C' },
      { name: 'Panama', code: 'PAN', group: 'C' },
      { name: 'Bolivia', code: 'BOL', group: 'C' },
      { name: 'United States', code: 'USA', group: 'C' },

      // Group D
      { name: 'Mexico', code: 'MEX', group: 'D' },
      { name: 'Ecuador', code: 'ECU', group: 'D' },
      { name: 'Venezuela', code: 'VEN', group: 'D' },
      { name: 'Jamaica', code: 'JAM', group: 'D' },

      // Group E
      { name: 'Honduras', code: 'HON', group: 'E' },
      { name: 'Guatemala', code: 'GUA', group: 'E' },
      { name: 'Belize', code: 'BLZ', group: 'E' },
      { name: 'Suriname', code: 'SUR', group: 'E' },

      // Group F
      { name: 'Guyana', code: 'GUY', group: 'F' },
      { name: 'Trinidad and Tobago', code: 'TTO', group: 'F' },
      { name: 'Curaçao', code: 'CUW', group: 'F' },
      { name: 'Martinique', code: 'MTQ', group: 'F' },

      // Group G
      { name: 'Barbados', code: 'BRB', group: 'G' },
      { name: 'Dominica', code: 'DMA', group: 'G' },
      { name: 'Grenada', code: 'GRD', group: 'G' },
      { name: 'Saint Lucia', code: 'LCA', group: 'G' },

      // Group H
      { name: 'Antigua and Barbuda', code: 'ATG', group: 'H' },
      { name: 'Montserrat', code: 'MSR', group: 'H' },
      { name: 'Saint Kitts and Nevis', code: 'KNA', group: 'H' },
      { name: 'Dominica', code: 'DMA', group: 'H' },
    ];
  }

  /**
   * Seeds Copa Mundial 2026 tournament data
   * - 32 teams organized into 8 groups (A-H)
   * - 72 group stage matches with scheduled times (June 1-30, 2026)
   */
  async seedCopaMundial2026(): Promise<{
    teamsCreated: number;
    matchesCreated: number;
  }> {
    const teamRepository = this.dataSource.getRepository(Team);
    const matchRepository = this.dataSource.getRepository(Match);

    this.logger.log('Starting Copa Mundial 2026 seeding...');

    // Check if data already exists
    const existingTeams = await teamRepository.count();
    if (existingTeams > 0) {
      this.logger.warn('Teams already exist in database. Skipping seeding.');
      return { teamsCreated: 0, matchesCreated: 0 };
    }

    const teams = this.getCopaMundial2026TeamsData();
    const teamMap = new Map<string, Team>();

    // Create teams
    this.logger.log('Creating 32 teams...');
    for (const teamData of teams) {
      const team = new Team();
      team.id = uuid();
      team.name = teamData.name;
      team.code = teamData.code;
      team.groupStageGroup = teamData.group;

      const savedTeam = await teamRepository.save(team);
      teamMap.set(teamData.code, savedTeam);
      this.logger.debug(
        `Created ${teamData.name} (${teamData.code}) - Group ${teamData.group}`,
      );
    }

    // Generate group stage matches
    this.logger.log('Generating 72 group stage matches...');
    const matches: Match[] = [];
    let currentDate = new Date('2026-06-01T00:00:00Z'); // June 1, 2026 UTC

    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (const group of groups) {
      const groupTeams = teams.filter((t) => t.group === group);
      const { matches: groupMatches, nextDate } = this.generateGroupMatches(
        teamMap,
        groupTeams,
        currentDate,
      );
      matches.push(...groupMatches);
      currentDate = nextDate;
    }

    // Save all matches
    for (const match of matches) {
      await matchRepository.save(match);
    }

    this.logger.log(`Created ${matches.length} group stage matches`);

    // Validate tournament structure
    const groupMatches = await matchRepository.count({
      where: { phase: MatchPhase.GROUP },
    });

    this.logger.log('✓ Copa Mundial 2026 seeding completed!');
    this.logger.log(`  - Teams created: 32`);
    this.logger.log(`  - Group stage matches: ${groupMatches}`);
    this.logger.log(`  - Date range: June 1-30, 2026 UTC`);

    return {
      teamsCreated: teams.length,
      matchesCreated: matches.length,
    };
  }

  /**
   * Get Copa Mundial 2026 teams data
   */
  private getCopaMundial2026TeamsData(): TeamData[] {
    return [
      // Group A
      { name: 'Argentina', code: 'ARG', group: 'A' },
      { name: 'Peru', code: 'PER', group: 'A' },
      { name: 'Chile', code: 'CHI', group: 'A' },
      { name: 'Canada', code: 'CAN', group: 'A' },

      // Group B
      { name: 'Brazil', code: 'BRA', group: 'B' },
      { name: 'Colombia', code: 'COL', group: 'B' },
      { name: 'Paraguay', code: 'PAR', group: 'B' },
      { name: 'Costa Rica', code: 'CRC', group: 'B' },

      // Group C
      { name: 'Uruguay', code: 'URU', group: 'C' },
      { name: 'Panama', code: 'PAN', group: 'C' },
      { name: 'Bolivia', code: 'BOL', group: 'C' },
      { name: 'United States', code: 'USA', group: 'C' },

      // Group D
      { name: 'Mexico', code: 'MEX', group: 'D' },
      { name: 'Ecuador', code: 'ECU', group: 'D' },
      { name: 'Venezuela', code: 'VEN', group: 'D' },
      { name: 'Jamaica', code: 'JAM', group: 'D' },

      // Group E
      { name: 'Honduras', code: 'HON', group: 'E' },
      { name: 'Guatemala', code: 'GUA', group: 'E' },
      { name: 'Belize', code: 'BLZ', group: 'E' },
      { name: 'Suriname', code: 'SUR', group: 'E' },

      // Group F
      { name: 'Guyana', code: 'GUY', group: 'F' },
      { name: 'Trinidad and Tobago', code: 'TTO', group: 'F' },
      { name: 'Curaçao', code: 'CUW', group: 'F' },
      { name: 'Martinique', code: 'MTQ', group: 'F' },

      // Group G
      { name: 'Barbados', code: 'BRB', group: 'G' },
      { name: 'Dominica', code: 'DMA', group: 'G' },
      { name: 'Grenada', code: 'GRD', group: 'G' },
      { name: 'Saint Lucia', code: 'LCA', group: 'G' },

      // Group H
      { name: 'Antigua and Barbuda', code: 'ATG', group: 'H' },
      { name: 'Montserrat', code: 'MSR', group: 'H' },
      { name: 'Saint Kitts and Nevis', code: 'KNA', group: 'H' },
      { name: 'Dominica', code: 'DMA', group: 'H' },
    ];
  }

  /**
   * Generate group stage matches for a given group
   * Each group has 4 teams, generating 6 matches (round-robin)
   */
  private generateGroupMatches(
    teams: Map<string, Team>,
    groupTeams: TeamData[],
    startDate: Date,
  ): { matches: Match[]; nextDate: Date } {
    const matches: Match[] = [];
    const groupTeamObjects = groupTeams.map((t) => teams.get(t.code)!);
    let currentDate = new Date(startDate);

    // Generate round-robin matches (each team plays every other team once)
    for (let i = 0; i < groupTeamObjects.length; i++) {
      for (let j = i + 1; j < groupTeamObjects.length; j++) {
        const team1 = groupTeamObjects[i];
        const team2 = groupTeamObjects[j];

        // Stagger match times throughout the day
        const matchTime = new Date(currentDate);
        matchTime.setHours(matchTime.getHours() + (i % 3) * 6);

        const lockdownTime = new Date(matchTime.getTime() - 15 * 60 * 1000);

        const match = new Match();
        match.id = uuid();
        match.team1Id = team1.id;
        match.team1 = team1;
        match.team2Id = team2.id;
        match.team2 = team2;
        match.scheduledTime = matchTime;
        match.lockdownTime = lockdownTime;
        match.phase = MatchPhase.GROUP;
        match.groupStageGroup = groupTeams[0].group;
        match.status = MatchStatus.SCHEDULED;

        matches.push(match);
      }
    }

    // Move to next day for next group
    currentDate.setDate(currentDate.getDate() + 1);

    return { matches, nextDate: currentDate };
  }

  /**
   * Clears all existing match and team data, then seeds Copa Mundial 2026
   * with the real 48-team, 72-match schedule.
   */
  async reseedCopaMundial2026(): Promise<{
    teamsCreated: number;
    matchesCreated: number;
  }> {
    this.logger.log('Reseeding Copa Mundial 2026 (force mode)...');
    return seedCopaMundial2026(this.dataSource, true);
  }
}
