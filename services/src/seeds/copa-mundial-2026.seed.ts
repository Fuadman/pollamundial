import { DataSource } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Match, MatchPhase, MatchStatus } from '../entities/match.entity';
import { User } from '../entities/user.entity';
import { v4 as uuid } from 'uuid';

/**
 * Copa Mundial 2026 Tournament Seeding Script
 *
 * Seeds 48 teams into 12 groups (A-L) with 4 teams each.
 * Creates 72 group stage matches with the real FIFA World Cup 2026 schedule.
 * All times stored in UTC (schedule is UTC-4 Bolivia time + 4 hours).
 *
 * Groups A-L, 4 teams each, 6 matches per group (round-robin) = 72 total.
 */

interface TeamData {
  name: string;
  code: string;
  group: string;
}

interface MatchData {
  team1Code: string;
  team2Code: string;
  scheduledTime: string; // ISO 8601 UTC
  group: string;
}

const ADMIN_EMAIL = 'fuadsalo@gmail.com';
const ADMIN_GOOGLE_ID = 'seed-admin-fuadsalo@gmail.com';
const ADMIN_NAME = 'Administrador';

// ─── 48 Teams ────────────────────────────────────────────────────────────────

export const COPA_MUNDIAL_2026_TEAMS: TeamData[] = [
  // Group A
  { name: 'México', code: 'MEX', group: 'A' },
  { name: 'Sudáfrica', code: 'RSA', group: 'A' },
  { name: 'República de Corea', code: 'KOR', group: 'A' },
  { name: 'Dinamarca/República Checa', code: 'CZD', group: 'A' },

  // Group B
  { name: 'Canadá', code: 'CAN', group: 'B' },
  { name: 'Bosnia y Herzegovina/Italia', code: 'BHI', group: 'B' },
  { name: 'Catar', code: 'QAT', group: 'B' },
  { name: 'Suiza', code: 'SUI', group: 'B' },

  // Group C
  { name: 'Haití', code: 'HAI', group: 'C' },
  { name: 'Escocia', code: 'SCO', group: 'C' },
  { name: 'Brasil', code: 'BRA', group: 'C' },
  { name: 'Marruecos', code: 'MAR', group: 'C' },

  // Group D
  { name: 'Estados Unidos', code: 'USA', group: 'D' },
  { name: 'Paraguay', code: 'PAR', group: 'D' },
  { name: 'Australia', code: 'AUS', group: 'D' },
  { name: 'Kosovo/Turquía', code: 'KOT', group: 'D' },

  // Group E
  { name: 'Alemania', code: 'GER', group: 'E' },
  { name: 'Curazao', code: 'CUW', group: 'E' },
  { name: 'Costa de Marfil', code: 'CIV', group: 'E' },
  { name: 'Ecuador', code: 'ECU', group: 'E' },

  // Group F
  { name: 'Países Bajos', code: 'NED', group: 'F' },
  { name: 'Japón', code: 'JPN', group: 'F' },
  { name: 'Polonia/Suecia', code: 'POS', group: 'F' },
  { name: 'Túnez', code: 'TUN', group: 'F' },

  // Group G
  { name: 'Irán', code: 'IRN', group: 'G' },
  { name: 'Nueva Zelanda', code: 'NZL', group: 'G' },
  { name: 'Bélgica', code: 'BEL', group: 'G' },
  { name: 'Egipto', code: 'EGY', group: 'G' },

  // Group H
  { name: 'Arabia Saudí', code: 'KSA', group: 'H' },
  { name: 'Uruguay', code: 'URU', group: 'H' },
  { name: 'España', code: 'ESP', group: 'H' },
  { name: 'Cabo Verde', code: 'CPV', group: 'H' },

  // Group I
  { name: 'Francia', code: 'FRA', group: 'I' },
  { name: 'Senegal', code: 'SEN', group: 'I' },
  { name: 'Bolivia/Irak', code: 'BOI', group: 'I' },
  { name: 'Noruega', code: 'NOR', group: 'I' },

  // Group J
  { name: 'Argentina', code: 'ARG', group: 'J' },
  { name: 'Argelia', code: 'ALG', group: 'J' },
  { name: 'Austria', code: 'AUT', group: 'J' },
  { name: 'Jordania', code: 'JOR', group: 'J' },

  // Group K
  { name: 'Portugal', code: 'POR', group: 'K' },
  { name: 'RD Congo/Jamaica', code: 'RCJ', group: 'K' },
  { name: 'Uzbekistán', code: 'UZB', group: 'K' },
  { name: 'Colombia', code: 'COL', group: 'K' },

  // Group L
  { name: 'Ghana', code: 'GHA', group: 'L' },
  { name: 'Panamá', code: 'PAN', group: 'L' },
  { name: 'Inglaterra', code: 'ENG', group: 'L' },
  { name: 'Croacia', code: 'CRO', group: 'L' },
];

// ─── 72 Matches (UTC times = local UTC-4 + 4 hours) ──────────────────────────

export const COPA_MUNDIAL_2026_MATCHES: MatchData[] = [
  // ── Jornada 1 ──────────────────────────────────────────────────────────────
  { team1Code: 'MEX',   team2Code: 'RSA',   scheduledTime: '2026-06-11T19:00:00Z', group: 'A' }, // 1
  { team1Code: 'KOR',   team2Code: 'CZD',   scheduledTime: '2026-06-12T02:00:00Z', group: 'A' }, // 2
  { team1Code: 'CAN',   team2Code: 'BHI',   scheduledTime: '2026-06-12T19:00:00Z', group: 'B' }, // 3
  { team1Code: 'USA',   team2Code: 'PAR',   scheduledTime: '2026-06-13T01:00:00Z', group: 'D' }, // 4
  { team1Code: 'QAT',   team2Code: 'SUI',   scheduledTime: '2026-06-13T19:00:00Z', group: 'B' }, // 8
  { team1Code: 'BRA',   team2Code: 'MAR',   scheduledTime: '2026-06-13T22:00:00Z', group: 'C' }, // 7
  { team1Code: 'HAI',   team2Code: 'SCO',   scheduledTime: '2026-06-14T01:00:00Z', group: 'C' }, // 5
  { team1Code: 'AUS',   team2Code: 'KOT',   scheduledTime: '2026-06-14T04:00:00Z', group: 'D' }, // 6
  { team1Code: 'GER',   team2Code: 'CUW',   scheduledTime: '2026-06-14T17:00:00Z', group: 'E' }, // 9
  { team1Code: 'NED',   team2Code: 'JPN',   scheduledTime: '2026-06-14T20:00:00Z', group: 'F' }, // 11
  { team1Code: 'CIV',   team2Code: 'ECU',   scheduledTime: '2026-06-14T23:00:00Z', group: 'E' }, // 10
  { team1Code: 'POS',   team2Code: 'TUN',   scheduledTime: '2026-06-15T02:00:00Z', group: 'F' }, // 12
  { team1Code: 'ESP',   team2Code: 'CPV',   scheduledTime: '2026-06-15T16:00:00Z', group: 'H' }, // 14
  { team1Code: 'BEL',   team2Code: 'EGY',   scheduledTime: '2026-06-15T19:00:00Z', group: 'G' }, // 16
  { team1Code: 'KSA',   team2Code: 'URU',   scheduledTime: '2026-06-15T22:00:00Z', group: 'H' }, // 13
  { team1Code: 'IRN',   team2Code: 'NZL',   scheduledTime: '2026-06-16T01:00:00Z', group: 'G' }, // 15
  { team1Code: 'FRA',   team2Code: 'SEN',   scheduledTime: '2026-06-16T19:00:00Z', group: 'I' }, // 17
  { team1Code: 'BOI',   team2Code: 'NOR',   scheduledTime: '2026-06-16T22:00:00Z', group: 'I' }, // 18
  { team1Code: 'ARG',   team2Code: 'ALG',   scheduledTime: '2026-06-17T01:00:00Z', group: 'J' }, // 19
  { team1Code: 'AUT',   team2Code: 'JOR',   scheduledTime: '2026-06-17T04:00:00Z', group: 'J' }, // 20
  { team1Code: 'POR',   team2Code: 'RCJ',   scheduledTime: '2026-06-17T17:00:00Z', group: 'K' }, // 23
  { team1Code: 'ENG',   team2Code: 'CRO',   scheduledTime: '2026-06-17T20:00:00Z', group: 'L' }, // 22
  { team1Code: 'GHA',   team2Code: 'PAN',   scheduledTime: '2026-06-17T23:00:00Z', group: 'L' }, // 21
  { team1Code: 'UZB',   team2Code: 'COL',   scheduledTime: '2026-06-18T02:00:00Z', group: 'K' }, // 24

  // ── Jornada 2 ──────────────────────────────────────────────────────────────
  { team1Code: 'CZD',   team2Code: 'RSA',   scheduledTime: '2026-06-18T16:00:00Z', group: 'A' }, // 25
  { team1Code: 'SUI',   team2Code: 'BHI',   scheduledTime: '2026-06-18T19:00:00Z', group: 'B' }, // 26
  { team1Code: 'CAN',   team2Code: 'QAT',   scheduledTime: '2026-06-18T22:00:00Z', group: 'B' }, // 27
  { team1Code: 'MEX',   team2Code: 'KOR',   scheduledTime: '2026-06-19T01:00:00Z', group: 'A' }, // 28
  { team1Code: 'USA',   team2Code: 'AUS',   scheduledTime: '2026-06-19T19:00:00Z', group: 'D' }, // 32
  { team1Code: 'SCO',   team2Code: 'MAR',   scheduledTime: '2026-06-19T22:00:00Z', group: 'C' }, // 30
  { team1Code: 'BRA',   team2Code: 'HAI',   scheduledTime: '2026-06-20T01:00:00Z', group: 'C' }, // 29
  { team1Code: 'KOT',   team2Code: 'PAR',   scheduledTime: '2026-06-20T04:00:00Z', group: 'D' }, // 31
  { team1Code: 'NED',   team2Code: 'POS',   scheduledTime: '2026-06-20T17:00:00Z', group: 'F' }, // 33
  { team1Code: 'GER',   team2Code: 'CIV',   scheduledTime: '2026-06-20T20:00:00Z', group: 'E' }, // 34
  { team1Code: 'ECU',   team2Code: 'CUW',   scheduledTime: '2026-06-21T02:00:00Z', group: 'E' }, // 35
  { team1Code: 'TUN',   team2Code: 'JPN',   scheduledTime: '2026-06-21T04:00:00Z', group: 'F' }, // 36
  { team1Code: 'ESP',   team2Code: 'KSA',   scheduledTime: '2026-06-21T16:00:00Z', group: 'H' }, // 37
  { team1Code: 'BEL',   team2Code: 'IRN',   scheduledTime: '2026-06-21T19:00:00Z', group: 'G' }, // 38
  { team1Code: 'URU',   team2Code: 'CPV',   scheduledTime: '2026-06-21T22:00:00Z', group: 'H' }, // 39
  { team1Code: 'NZL',   team2Code: 'EGY',   scheduledTime: '2026-06-22T01:00:00Z', group: 'G' }, // 40
  { team1Code: 'ARG',   team2Code: 'AUT',   scheduledTime: '2026-06-22T17:00:00Z', group: 'J' }, // 41
  { team1Code: 'FRA',   team2Code: 'BOI',   scheduledTime: '2026-06-22T21:00:00Z', group: 'I' }, // 42
  { team1Code: 'NOR',   team2Code: 'SEN',   scheduledTime: '2026-06-23T00:00:00Z', group: 'I' }, // 43
  { team1Code: 'JOR',   team2Code: 'ALG',   scheduledTime: '2026-06-23T03:00:00Z', group: 'J' }, // 44
  { team1Code: 'POR',   team2Code: 'UZB',   scheduledTime: '2026-06-23T17:00:00Z', group: 'K' }, // 45
  { team1Code: 'ENG',   team2Code: 'GHA',   scheduledTime: '2026-06-23T20:00:00Z', group: 'L' }, // 46
  { team1Code: 'PAN',   team2Code: 'CRO',   scheduledTime: '2026-06-23T23:00:00Z', group: 'L' }, // 47
  { team1Code: 'COL',   team2Code: 'RCJ',   scheduledTime: '2026-06-24T02:00:00Z', group: 'K' }, // 48

  // ── Jornada 3 (simultánea por grupos) ──────────────────────────────────────
  { team1Code: 'SUI',   team2Code: 'CAN',   scheduledTime: '2026-06-24T19:00:00Z', group: 'B' }, // 49
  { team1Code: 'BHI',   team2Code: 'QAT',   scheduledTime: '2026-06-24T19:00:00Z', group: 'B' }, // 50
  { team1Code: 'SCO',   team2Code: 'BRA',   scheduledTime: '2026-06-24T22:00:00Z', group: 'C' }, // 51
  { team1Code: 'MAR',   team2Code: 'HAI',   scheduledTime: '2026-06-24T22:00:00Z', group: 'C' }, // 52
  { team1Code: 'CZD',   team2Code: 'MEX',   scheduledTime: '2026-06-25T01:00:00Z', group: 'A' }, // 53
  { team1Code: 'RSA',   team2Code: 'KOR',   scheduledTime: '2026-06-25T01:00:00Z', group: 'A' }, // 54
  { team1Code: 'CUW',   team2Code: 'CIV',   scheduledTime: '2026-06-25T20:00:00Z', group: 'E' }, // 55
  { team1Code: 'ECU',   team2Code: 'GER',   scheduledTime: '2026-06-25T20:00:00Z', group: 'E' }, // 56
  { team1Code: 'JPN',   team2Code: 'POS',   scheduledTime: '2026-06-25T23:00:00Z', group: 'F' }, // 57
  { team1Code: 'TUN',   team2Code: 'NED',   scheduledTime: '2026-06-25T23:00:00Z', group: 'F' }, // 58
  { team1Code: 'KOT',   team2Code: 'USA',   scheduledTime: '2026-06-26T02:00:00Z', group: 'D' }, // 59
  { team1Code: 'PAR',   team2Code: 'AUS',   scheduledTime: '2026-06-26T02:00:00Z', group: 'D' }, // 60
  { team1Code: 'NOR',   team2Code: 'FRA',   scheduledTime: '2026-06-26T19:00:00Z', group: 'I' }, // 61
  { team1Code: 'SEN',   team2Code: 'BOI',   scheduledTime: '2026-06-26T19:00:00Z', group: 'I' }, // 62
  { team1Code: 'CPV',   team2Code: 'KSA',   scheduledTime: '2026-06-27T00:00:00Z', group: 'H' }, // 63
  { team1Code: 'URU',   team2Code: 'ESP',   scheduledTime: '2026-06-27T00:00:00Z', group: 'H' }, // 64
  { team1Code: 'EGY',   team2Code: 'IRN',   scheduledTime: '2026-06-27T03:00:00Z', group: 'G' }, // 65
  { team1Code: 'NZL',   team2Code: 'BEL',   scheduledTime: '2026-06-27T03:00:00Z', group: 'G' }, // 66
  { team1Code: 'PAN',   team2Code: 'ENG',   scheduledTime: '2026-06-27T21:00:00Z', group: 'L' }, // 67
  { team1Code: 'CRO',   team2Code: 'GHA',   scheduledTime: '2026-06-27T21:00:00Z', group: 'L' }, // 68
  { team1Code: 'COL',   team2Code: 'POR',   scheduledTime: '2026-06-27T23:30:00Z', group: 'K' }, // 69
  { team1Code: 'RCJ',   team2Code: 'UZB',   scheduledTime: '2026-06-27T23:30:00Z', group: 'K' }, // 70
  { team1Code: 'ALG',   team2Code: 'AUT',   scheduledTime: '2026-06-28T02:00:00Z', group: 'J' }, // 71
  { team1Code: 'JOR',   team2Code: 'ARG',   scheduledTime: '2026-06-28T02:00:00Z', group: 'J' }, // 72
];

// ─── Seed Function ────────────────────────────────────────────────────────────

export async function seedCopaMundial2026(
  dataSource: DataSource,
  force = false,
): Promise<{ teamsCreated: number; matchesCreated: number }> {
  const teamRepository = dataSource.getRepository(Team);
  const matchRepository = dataSource.getRepository(Match);
  const userRepository = dataSource.getRepository(User);

  console.log('Starting Copa Mundial 2026 seeding...');

  const existingAdmin = await userRepository.findOne({
    where: { email: ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    const adminUser = new User();
    const now = new Date();

    adminUser.id = uuid();
    adminUser.googleId = ADMIN_GOOGLE_ID;
    adminUser.email = ADMIN_EMAIL;
    adminUser.name = ADMIN_NAME;
    adminUser.role = 'admin';
    adminUser.registrationCompleted = true;
    adminUser.paymentCompleted = true;
    adminUser.registrationTimestamp = now;
    adminUser.paymentTimestamp = now;

    await userRepository.save(adminUser);
    console.log(`  ✓ Admin user created: ${ADMIN_EMAIL}`);
  } else if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    await userRepository.save(existingAdmin);
    console.log(`  ✓ Admin role granted to: ${ADMIN_EMAIL}`);
  } else {
    console.log(`  ✓ Admin user already exists: ${ADMIN_EMAIL}`);
  }

  const existingTeams = await teamRepository.count();

  if (existingTeams > 0 && !force) {
    console.log('Teams already exist. Skipping. Use force=true to reseed.');
    return { teamsCreated: 0, matchesCreated: 0 };
  }

  if (existingTeams > 0 && force) {
    console.log('Force mode: clearing existing matches and teams...');
    await matchRepository.query('DELETE FROM matches');
    await teamRepository.query('DELETE FROM teams');
  }

  // Create 48 teams
  console.log(`Creating ${COPA_MUNDIAL_2026_TEAMS.length} teams...`);
  const teamMap = new Map<string, Team>();

  for (const teamData of COPA_MUNDIAL_2026_TEAMS) {
    const team = new Team();
    team.id = uuid();
    team.name = teamData.name;
    team.code = teamData.code;
    team.groupStageGroup = teamData.group;

    const saved = await teamRepository.save(team);
    teamMap.set(teamData.code, saved);
    console.log(`  ✓ ${teamData.name} (${teamData.code}) - Grupo ${teamData.group}`);
  }

  // Create 72 matches
  console.log(`\nCreating ${COPA_MUNDIAL_2026_MATCHES.length} group stage matches...`);
  let matchesCreated = 0;

  for (const matchData of COPA_MUNDIAL_2026_MATCHES) {
    const team1 = teamMap.get(matchData.team1Code);
    const team2 = teamMap.get(matchData.team2Code);

    if (!team1 || !team2) {
      console.error(`  ✗ Teams not found: ${matchData.team1Code} vs ${matchData.team2Code}`);
      continue;
    }

    const scheduledTime = new Date(matchData.scheduledTime);
    const lockdownTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000);

    const match = new Match();
    match.id = uuid();
    match.team1Id = team1.id;
    match.team1 = team1;
    match.team2Id = team2.id;
    match.team2 = team2;
    match.scheduledTime = scheduledTime;
    match.lockdownTime = lockdownTime;
    match.phase = MatchPhase.GROUP;
    match.groupStageGroup = matchData.group;
    match.status = MatchStatus.SCHEDULED;

    await matchRepository.save(match);
    matchesCreated++;
    console.log(`  ✓ [${matchData.group}] ${team1.name} vs ${team2.name} — ${matchData.scheduledTime}`);
  }

  console.log(`\n✓ Copa Mundial 2026 seeding completed!`);
  console.log(`  - Teams: ${COPA_MUNDIAL_2026_TEAMS.length} (groups A–L)`);
  console.log(`  - Matches: ${matchesCreated} (Jun 11 – Jun 28, 2026 UTC)`);

  return { teamsCreated: COPA_MUNDIAL_2026_TEAMS.length, matchesCreated };
}
