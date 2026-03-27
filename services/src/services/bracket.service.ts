import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { TeamRepository } from '../repositories/team.repository';
import { Team } from '../entities/team.entity';
import { Match, MatchPhase } from '../entities/match.entity';

/**
 * BracketService handles dynamic elimination phase bracket configuration
 * Supports Round of 16, Quarterfinals, Semifinals, and Final matches
 */
@Injectable()
export class BracketService {
  constructor(
    private matchService: MatchService,
    private teamRepository: TeamRepository,
  ) {}

  /**
   * Configure Round of 16 bracket with 16 qualified teams
   * Generates 16 matches scheduled for July 1-6, 2026
   *
   * @param teams - Array of 16 qualified teams from group stage
   * @returns Array of 16 generated Round of 16 matches
   * @throws BadRequestException if validation fails
   */
  async configureRound16(teams: Team[]): Promise<Match[]> {
    // Validate input
    this.validateRound16Input(teams);

    // Generate matches with scheduled times
    const matches: Match[] = [];
    const matchDates = this.generateRound16Schedule();

    // Create 16 matches from 16 teams
    // Standard seeding: 1 vs 16, 2 vs 15, 3 vs 14, ..., 8 vs 9
    for (let i = 0; i < 8; i++) {
      const team1 = teams[i];
      const team2 = teams[15 - i];
      const scheduledTime = matchDates[i];

      const match = await this.matchService.createMatch(
        team1.id,
        team2.id,
        scheduledTime,
        MatchPhase.ELIMINATION,
        undefined,
        'R16',
      );

      matches.push(match);
    }

    // Validate bracket configuration
    await this.validateBracketConfiguration(matches, 'R16');

    return matches;
  }

  /**
   * Configure Quarterfinals bracket with 8 qualified teams
   * Generates 8 matches scheduled for July 7-10, 2026
   *
   * @param teams - Array of 8 qualified teams from Round of 16
   * @returns Array of 8 generated Quarterfinal matches
   * @throws BadRequestException if validation fails
   */
  async configureQuarterfinals(teams: Team[]): Promise<Match[]> {
    // Validate input
    if (!teams || teams.length !== 8) {
      throw new BadRequestException(
        'Quarterfinals configuration requires exactly 8 teams',
      );
    }

    // Validate all teams exist
    for (const team of teams) {
      if (!team || !team.id) {
        throw new BadRequestException('Invalid team in Quarterfinals configuration');
      }
    }

    // Check for duplicate teams
    const teamIds = new Set<string>();
    for (const team of teams) {
      if (teamIds.has(team.id)) {
        throw new BadRequestException(
          'Duplicate teams not allowed in Quarterfinals configuration',
        );
      }
      teamIds.add(team.id);
    }

    const matches: Match[] = [];
    const matchDates = this.generateQuarterfinalsSchedule();

    // Create 8 matches (4 pairs)
    for (let i = 0; i < 4; i++) {
      const team1 = teams[i];
      const team2 = teams[7 - i];
      const scheduledTime = matchDates[i];

      const match = await this.matchService.createMatch(
        team1.id,
        team2.id,
        scheduledTime,
        MatchPhase.ELIMINATION,
        undefined,
        'QF',
      );

      matches.push(match);
    }

    // Validate bracket configuration
    await this.validateBracketConfiguration(matches, 'QF');

    return matches;
  }

  /**
   * Configure Semifinals bracket with 4 qualified teams
   * Generates 2 Semifinal matches and 1 Third Place match
   * Scheduled for July 14-15, 2026
   *
   * @param teams - Array of 4 qualified teams from Quarterfinals
   * @returns Object containing semifinal matches and third place match
   * @throws BadRequestException if validation fails
   */
  async configureSemifinals(teams: Team[]): Promise<{
    semifinalMatches: Match[];
    thirdPlaceMatch: Match;
  }> {
    // Validate input
    if (!teams || teams.length !== 4) {
      throw new BadRequestException(
        'Semifinals configuration requires exactly 4 teams',
      );
    }

    // Validate all teams exist
    for (const team of teams) {
      if (!team || !team.id) {
        throw new BadRequestException('Invalid team in Semifinals configuration');
      }
    }

    // Check for duplicate teams
    const teamIds = new Set<string>();
    for (const team of teams) {
      if (teamIds.has(team.id)) {
        throw new BadRequestException(
          'Duplicate teams not allowed in Semifinals configuration',
        );
      }
      teamIds.add(team.id);
    }

    const semifinalMatches: Match[] = [];
    const semifinalDates = this.generateSemifinalsSchedule();

    // Create 2 semifinal matches
    for (let i = 0; i < 2; i++) {
      const team1 = teams[i];
      const team2 = teams[3 - i];
      const scheduledTime = semifinalDates[i];

      const match = await this.matchService.createMatch(
        team1.id,
        team2.id,
        scheduledTime,
        MatchPhase.ELIMINATION,
        undefined,
        'SF',
      );

      semifinalMatches.push(match);
    }

    // Create Third Place match (scheduled for August 14, 2026)
    const thirdPlaceTime = new Date('2026-08-14T18:00:00Z');
    const thirdPlaceMatch = await this.matchService.createMatch(
      teams[1].id, // Loser of first semifinal
      teams[2].id, // Loser of second semifinal
      thirdPlaceTime,
      MatchPhase.ELIMINATION,
      undefined,
      'THIRD',
    );

    // Validate bracket configuration
    await this.validateBracketConfiguration(semifinalMatches, 'SF');

    return {
      semifinalMatches,
      thirdPlaceMatch,
    };
  }

  /**
   * Configure Final match between two semifinal winners
   * Scheduled for August 16, 2026
   *
   * @param team1 - First finalist
   * @param team2 - Second finalist
   * @returns Generated Final match
   * @throws BadRequestException if validation fails
   */
  async configureFinal(team1: Team, team2: Team): Promise<Match> {
    // Validate input
    if (!team1 || !team1.id || !team2 || !team2.id) {
      throw new BadRequestException('Invalid teams for Final configuration');
    }

    if (team1.id === team2.id) {
      throw new BadRequestException('Final teams must be different');
    }

    // Create Final match (scheduled for August 16, 2026)
    const finalTime = new Date('2026-08-16T18:00:00Z');
    const finalMatch = await this.matchService.createMatch(
      team1.id,
      team2.id,
      finalTime,
      MatchPhase.ELIMINATION,
      undefined,
      'FINAL',
    );

    return finalMatch;
  }

  /**
   * Validate Round of 16 bracket configuration
   * Ensures exactly 16 teams, no duplicates, and valid team data
   *
   * @param teams - Array of teams to validate
   * @throws BadRequestException if validation fails
   */
  private validateRound16Input(teams: Team[]): void {
    // Check exact count
    if (!teams || teams.length !== 16) {
      throw new BadRequestException(
        'Round of 16 configuration requires exactly 16 teams',
      );
    }

    // Check for null/undefined teams
    for (const team of teams) {
      if (!team || !team.id) {
        throw new BadRequestException('Invalid team in Round of 16 configuration');
      }
    }

    // Check for duplicate teams
    const teamIds = new Set<string>();
    for (const team of teams) {
      if (teamIds.has(team.id)) {
        throw new BadRequestException(
          'Duplicate teams not allowed in Round of 16 configuration',
        );
      }
      teamIds.add(team.id);
    }
  }

  /**
   * Validate bracket configuration after match generation
   * Ensures correct number of matches and valid scheduling
   *
   * @param matches - Generated matches to validate
   * @param round - Elimination round identifier (R16, QF, SF, FINAL)
   * @throws BadRequestException if validation fails
   */
  private async validateBracketConfiguration(
    matches: Match[],
    round: string,
  ): Promise<void> {
    // Validate match count based on round
    // Round of 16: 16 teams = 8 matches
    // Quarterfinals: 8 teams = 4 matches
    // Semifinals: 4 teams = 2 matches
    // Final: 2 teams = 1 match
    const expectedCounts: { [key: string]: number } = {
      R16: 8,
      QF: 4,
      SF: 2,
      FINAL: 1,
      THIRD: 1,
    };

    const expectedCount = expectedCounts[round];
    if (matches.length !== expectedCount) {
      throw new BadRequestException(
        `Expected ${expectedCount} matches for ${round}, got ${matches.length}`,
      );
    }

    // Validate all matches have correct elimination round
    for (const match of matches) {
      if (match.eliminationRound !== round) {
        throw new BadRequestException(
          `Match ${match.id} has incorrect elimination round`,
        );
      }

      if (match.phase !== MatchPhase.ELIMINATION) {
        throw new BadRequestException(
          `Match ${match.id} is not marked as elimination phase`,
        );
      }
    }

    // Validate scheduling dates based on round
    this.validateSchedulingDates(matches, round);

    // Validate no duplicate team pairings
    this.validateNoDuplicatePairings(matches);
  }

  /**
   * Validate that matches are scheduled within expected date ranges
   *
   * @param matches - Matches to validate
   * @param round - Elimination round identifier
   * @throws BadRequestException if scheduling is invalid
   */
  private validateSchedulingDates(matches: Match[], round: string): void {
    const dateRanges: { [key: string]: { start: Date; end: Date } } = {
      R16: {
        start: new Date('2026-07-01T00:00:00Z'),
        end: new Date('2026-07-06T23:59:59Z'),
      },
      QF: {
        start: new Date('2026-07-07T00:00:00Z'),
        end: new Date('2026-07-10T23:59:59Z'),
      },
      SF: {
        start: new Date('2026-07-14T00:00:00Z'),
        end: new Date('2026-07-15T23:59:59Z'),
      },
      FINAL: {
        start: new Date('2026-08-16T00:00:00Z'),
        end: new Date('2026-08-16T23:59:59Z'),
      },
      THIRD: {
        start: new Date('2026-08-14T00:00:00Z'),
        end: new Date('2026-08-14T23:59:59Z'),
      },
    };

    const range = dateRanges[round];
    if (!range) {
      return; // No date validation for unknown rounds
    }

    for (const match of matches) {
      if (match.scheduledTime < range.start || match.scheduledTime > range.end) {
        throw new BadRequestException(
          `Match ${match.id} scheduled outside expected date range for ${round}`,
        );
      }
    }
  }

  /**
   * Validate that no duplicate team pairings exist
   *
   * @param matches - Matches to validate
   * @throws BadRequestException if duplicate pairings found
   */
  private validateNoDuplicatePairings(matches: Match[]): void {
    const pairings = new Set<string>();

    for (const match of matches) {
      // Create a normalized pairing key (sorted to handle both directions)
      const ids = [match.team1Id, match.team2Id].sort();
      const pairingKey = `${ids[0]}-${ids[1]}`;

      if (pairings.has(pairingKey)) {
        throw new BadRequestException(
          `Duplicate team pairing found: ${match.team1Id} vs ${match.team2Id}`,
        );
      }

      pairings.add(pairingKey);
    }
  }

  /**
   * Generate scheduled times for Round of 16 matches
   * 16 matches over 6 days (July 1-6, 2026)
   * Typically 2-3 matches per day
   *
   * @returns Array of 8 scheduled times (for 8 match pairs)
   */
  private generateRound16Schedule(): Date[] {
    // Standard Copa America schedule: 2-3 matches per day
    // Matches at 14:00 and 18:00 UTC (10:00 and 14:00 La Paz time)
    return [
      new Date('2026-07-01T14:00:00Z'), // Match 1
      new Date('2026-07-01T18:00:00Z'), // Match 2
      new Date('2026-07-02T14:00:00Z'), // Match 3
      new Date('2026-07-02T18:00:00Z'), // Match 4
      new Date('2026-07-03T14:00:00Z'), // Match 5
      new Date('2026-07-03T18:00:00Z'), // Match 6
      new Date('2026-07-04T14:00:00Z'), // Match 7
      new Date('2026-07-04T18:00:00Z'), // Match 8
    ];
  }

  /**
   * Generate scheduled times for Quarterfinals matches
   * 8 matches over 4 days (July 7-10, 2026)
   * 2 matches per day
   *
   * @returns Array of 4 scheduled times (for 4 match pairs)
   */
  private generateQuarterfinalsSchedule(): Date[] {
    return [
      new Date('2026-07-07T14:00:00Z'), // Match 1
      new Date('2026-07-07T18:00:00Z'), // Match 2
      new Date('2026-07-08T14:00:00Z'), // Match 3
      new Date('2026-07-08T18:00:00Z'), // Match 4
    ];
  }

  /**
   * Generate scheduled times for Semifinals matches
   * 2 matches over 2 days (July 14-15, 2026)
   * 1 match per day
   *
   * @returns Array of 2 scheduled times
   */
  private generateSemifinalsSchedule(): Date[] {
    return [
      new Date('2026-07-14T18:00:00Z'), // Semifinal 1
      new Date('2026-07-15T18:00:00Z'), // Semifinal 2
    ];
  }
}
