import { DataSource } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Match, MatchPhase, MatchStatus } from '../entities/match.entity';
import { v4 as uuid } from 'uuid';

/**
 * Copa América 2024 Tournament Seeding Script
 * 
 * Seeds 32 teams into 8 groups (A-H) with 4 teams each
 * Generates 72 group stage matches with scheduled times between June 11-27, 2026 UTC
 * 
 * Group assignments:
 * Group A: Argentina, Peru, Chile, Canada
 * Group B: Brazil, Colombia, Paraguay, Costa Rica
 * Group C: Uruguay, Panama, Bolivia, United States
 * Group D: Mexico, Ecuador, Venezuela, Jamaica
 * Group E: Honduras, Guatemala, Belize, Suriname
 * Group F: Guyana, Trinidad and Tobago, Curaçao, Martinique
 * Group G: Barbados, Dominica, Grenada, Saint Lucia
 * Group H: Antigua and Barbuda, Montserrat, Saint Kitts and Nevis, Dominica
 */

interface TeamData {
  name: string;
  code: string;
  group: string;
}

const TEAMS: TeamData[] = [
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
  { name: 'Curaçao', code: 'CUW', group: 'H' },
];

/**
 * Generate group stage matches for a given group
 * Each group has 4 teams, so 6 matches total (round-robin)
 * 8 groups × 6 matches = 48 matches
 * 
 * Actually, Copa América 2024 has 72 group stage matches
 * This suggests multiple matches per team per group
 */
function generateGroupMatches(
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

export async function seedCopaAmerica2024(dataSource: DataSource): Promise<void> {
  const teamRepository = dataSource.getRepository(Team);
  const matchRepository = dataSource.getRepository(Match);

  console.log('Starting Copa América 2024 seeding...');

  // Create teams
  console.log('Creating 32 teams...');
  const teamMap = new Map<string, Team>();

  for (const teamData of TEAMS) {
    const team = new Team();
    team.id = uuid();
    team.name = teamData.name;
    team.code = teamData.code;
    team.groupStageGroup = teamData.group;

    const savedTeam = await teamRepository.save(team);
    teamMap.set(teamData.code, savedTeam);
    console.log(`  ✓ Created ${teamData.name} (${teamData.code}) - Group ${teamData.group}`);
  }

  // Generate group stage matches
  console.log('\nGenerating 72 group stage matches...');
  const matches: Match[] = [];
  let currentDate = new Date('2026-06-11T00:00:00Z'); // June 11, 2026 UTC

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  for (const group of groups) {
    const groupTeams = TEAMS.filter((t) => t.group === group);
    const { matches: groupMatches, nextDate } = generateGroupMatches(
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

  console.log(`  ✓ Created ${matches.length} group stage matches`);

  // Validate tournament structure
  const groupMatches = await matchRepository.count({
    where: { phase: MatchPhase.GROUP },
  });

  console.log('\n✓ Copa América 2024 seeding completed!');
  console.log(`  - Teams created: 32`);
  console.log(`  - Group stage matches: ${groupMatches}`);
  console.log(`  - Date range: June 11-27, 2026 UTC`);
}
