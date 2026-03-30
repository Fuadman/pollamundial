import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { TeamRepository } from '../repositories/team.repository';
import { MatchRepository } from '../repositories/match.repository';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { Team } from '../entities/team.entity';
import { Match, MatchPhase } from '../entities/match.entity';

interface RankedTeam {
  group: string;
  position: number;
  teamId: string;
  team: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
}

interface Round32Template {
  matchNumber: number;
  scheduledTime: string;
  team1: { type: 'group'; position: 1 | 2; group: string };
  team2:
    | { type: 'group'; position: 1 | 2; group: string }
    | { type: 'third'; allowedGroups: string[] };
}

interface ThirdSlot {
  matchNumber: number;
  allowedGroups: string[];
}

@Injectable()
export class BracketService {
  constructor(
    private matchService: MatchService,
    private teamRepository: TeamRepository,
    private matchRepository: MatchRepository,
    private matchResultRepository: MatchResultRepository,
  ) {}

  async autoAdvanceFromMatch(matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['result'],
    });

    if (!match?.result) return;

    if (match.phase === MatchPhase.GROUP) {
      await this.tryGenerateNextPhase(() => this.generateRound32FromGroupStage());
      return;
    }

    if (match.phase !== MatchPhase.ELIMINATION || !match.eliminationRound) {
      return;
    }

    if (match.eliminationRound === 'R32') {
      await this.tryGenerateNextPhase(() => this.generateRound16FromRound32());
      return;
    }

    if (match.eliminationRound === 'R16') {
      await this.tryGenerateNextPhase(() => this.generateQuarterfinalsFromRound16());
      return;
    }

    if (match.eliminationRound === 'QF') {
      await this.tryGenerateNextPhase(() => this.generateSemifinalsFromQuarterfinals());
      return;
    }

    if (match.eliminationRound === 'SF') {
      await this.tryGenerateNextPhase(() => this.generateFinalAndThirdFromSemifinals());
    }
  }

  async getPhaseEditReadiness(): Promise<{
    round32AutoEnabled: boolean;
    round16Editable: boolean;
    quarterfinalsEditable: boolean;
    semifinalsEditable: boolean;
  }> {
    return {
      round32AutoEnabled: await this.isGroupPhaseComplete(),
      round16Editable: await this.isEliminationRoundComplete('R32', 16),
      quarterfinalsEditable: await this.isEliminationRoundComplete('R16', 8),
      semifinalsEditable: await this.isEliminationRoundComplete('QF', 4),
    };
  }

  async generateRound32FromGroupStage(): Promise<Match[]> {
    const templates = this.getRound32Templates();

    const existingRound32 = await this.matchRepository.findByEliminationRound('R32');
    if (existingRound32.length > 0) {
      return existingRound32;
    }

    const groupMatches = await this.matchRepository.findByPhase(MatchPhase.GROUP);
    const groupMatchIds = new Set(groupMatches.map((match) => match.id));
    const groupResults = (await this.matchResultRepository.find()).filter((result) =>
      groupMatchIds.has(result.matchId),
    );

    if (groupResults.length !== groupMatches.length) {
      throw new BadRequestException(
        'Group stage must be fully completed before generating Round of 32',
      );
    }

    const standings = await this.matchService.getGroupStandings();
    if (standings.length !== 12) {
      throw new BadRequestException('Expected 12 groups to generate Round of 32');
    }

    const rankedByGroup = new Map<string, RankedTeam[]>();
    for (const groupTable of standings) {
      if (groupTable.standings.length !== 4) {
        throw new BadRequestException(
          `Group ${groupTable.group} must have 4 teams to generate Round of 32`,
        );
      }

      const ranked = groupTable.standings.map((row) => ({
        group: groupTable.group,
        position: row.position,
        teamId: row.teamId,
        team: row.team,
        points: row.points,
        goalDifference: row.goalDifference,
        goalsFor: row.goalsFor,
      }));

      const allPlayed = groupTable.standings.every((row) => row.played === 3);
      if (!allPlayed) {
        throw new BadRequestException(
          `Group ${groupTable.group} is not complete. All teams must have played 3 matches`,
        );
      }

      rankedByGroup.set(groupTable.group, ranked);
    }

    const thirdPlaces = Array.from(rankedByGroup.values())
      .map((rows) => rows.find((row) => row.position === 3))
      .filter((row): row is RankedTeam => !!row)
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          a.team.localeCompare(b.team),
      );

    const qualifiedThirds = thirdPlaces.slice(0, 8);
    if (qualifiedThirds.length !== 8) {
      throw new BadRequestException('Could not determine 8 best third-placed teams');
    }

    const thirdSlots: ThirdSlot[] = [];
    for (const template of templates) {
      if (template.team2.type === 'third') {
        thirdSlots.push({
          matchNumber: template.matchNumber,
          allowedGroups: template.team2.allowedGroups,
        });
      }
    }

    const thirdAssignments = this.assignThirdTeamsToSlots(qualifiedThirds, thirdSlots);

    const requiredTeamIds = new Set<string>();

    for (const template of templates) {
      const team1 = rankedByGroup
        .get(template.team1.group)
        ?.find((row) => row.position === template.team1.position);
      if (!team1) {
        throw new NotFoundException(
          `Could not resolve position ${template.team1.position} in group ${template.team1.group}`,
        );
      }
      requiredTeamIds.add(team1.teamId);

      if (template.team2.type === 'group') {
        const team2Ref = template.team2;
        const team2 = rankedByGroup
          .get(team2Ref.group)
          ?.find((row) => row.position === team2Ref.position);
        if (!team2) {
          throw new NotFoundException(
            `Could not resolve position ${team2Ref.position} in group ${team2Ref.group}`,
          );
        }
        requiredTeamIds.add(team2.teamId);
      } else {
        const assignedThird = thirdAssignments.get(template.matchNumber);
        if (!assignedThird) {
          throw new BadRequestException(
            `Could not assign a third-placed team for match ${template.matchNumber}`,
          );
        }
        requiredTeamIds.add(assignedThird.teamId);
      }
    }

    const teams = await this.teamRepository.findByIds(Array.from(requiredTeamIds));
    const teamById = new Map(teams.map((team) => [team.id, team]));

    const generated: Match[] = [];

    for (const template of templates) {
      const team1Rank = rankedByGroup
        .get(template.team1.group)
        ?.find((row) => row.position === template.team1.position);
      if (!team1Rank) continue;

      let team2Id: string;
      if (template.team2.type === 'group') {
        const team2Ref = template.team2;
        const team2Rank = rankedByGroup
          .get(team2Ref.group)
          ?.find((row) => row.position === team2Ref.position);
        if (!team2Rank) continue;
        team2Id = team2Rank.teamId;
      } else {
        const assignedThird = thirdAssignments.get(template.matchNumber);
        if (!assignedThird) continue;
        team2Id = assignedThird.teamId;
      }

      const team1 = teamById.get(team1Rank.teamId);
      const team2 = teamById.get(team2Id);

      if (!team1 || !team2) {
        throw new NotFoundException('One or more qualified teams were not found');
      }

      const match = await this.matchService.createMatch(
        team1.id,
        team2.id,
        new Date(template.scheduledTime),
        MatchPhase.ELIMINATION,
        undefined,
        'R32',
      );

      generated.push(match);
    }

    return generated;
  }

  async generateRound16FromRound32(): Promise<Match[]> {
    const existing = await this.matchRepository.findByEliminationRound('R16');
    if (existing.length > 0) {
      return existing;
    }

    const round32Matches = await this.getCompletedRoundMatches('R32', 16);
    const round32ByNumber = this.mapMatchesByNumber(round32Matches, 73);
    const schedule = this.generateRound16Schedule();

    const pairings: Array<[number, number]> = [
      [74, 77],
      [73, 75],
      [76, 78],
      [79, 80],
      [83, 84],
      [81, 82],
      [86, 88],
      [85, 87],
    ];

    const generated: Match[] = [];

    for (let i = 0; i < pairings.length; i++) {
      const [leftMatchNumber, rightMatchNumber] = pairings[i];
      const leftMatch = round32ByNumber.get(leftMatchNumber);
      const rightMatch = round32ByNumber.get(rightMatchNumber);

      if (!leftMatch || !rightMatch) {
        throw new BadRequestException('Could not resolve Round of 32 winners');
      }

      generated.push(
        await this.matchService.createMatch(
          this.getWinnerTeamId(leftMatch),
          this.getWinnerTeamId(rightMatch),
          schedule[i],
          MatchPhase.ELIMINATION,
          undefined,
          'R16',
        ),
      );
    }

    return generated;
  }

  async generateQuarterfinalsFromRound16(): Promise<Match[]> {
    const existing = await this.matchRepository.findByEliminationRound('QF');
    if (existing.length > 0) {
      return existing;
    }

    const round16Matches = await this.getCompletedRoundMatches('R16', 8);
    const round16ByNumber = this.mapMatchesByNumber(round16Matches, 89);
    const schedule = this.generateQuarterfinalsSchedule();

    const pairings: Array<[number, number]> = [
      [89, 90],
      [93, 94],
      [91, 92],
      [95, 96],
    ];

    const generated: Match[] = [];

    for (let i = 0; i < pairings.length; i++) {
      const [leftMatchNumber, rightMatchNumber] = pairings[i];
      const leftMatch = round16ByNumber.get(leftMatchNumber);
      const rightMatch = round16ByNumber.get(rightMatchNumber);

      if (!leftMatch || !rightMatch) {
        throw new BadRequestException('Could not resolve Round of 16 winners');
      }

      generated.push(
        await this.matchService.createMatch(
          this.getWinnerTeamId(leftMatch),
          this.getWinnerTeamId(rightMatch),
          schedule[i],
          MatchPhase.ELIMINATION,
          undefined,
          'QF',
        ),
      );
    }

    return generated;
  }

  async generateSemifinalsFromQuarterfinals(): Promise<Match[]> {
    const existing = await this.matchRepository.findByEliminationRound('SF');
    if (existing.length > 0) {
      return existing;
    }

    const quarterfinalMatches = await this.getCompletedRoundMatches('QF', 4);
    const quarterfinalByNumber = this.mapMatchesByNumber(quarterfinalMatches, 97);
    const schedule = this.generateSemifinalsSchedule();

    const pairings: Array<[number, number]> = [
      [97, 98],
      [99, 100],
    ];

    const generated: Match[] = [];

    for (let i = 0; i < pairings.length; i++) {
      const [leftMatchNumber, rightMatchNumber] = pairings[i];
      const leftMatch = quarterfinalByNumber.get(leftMatchNumber);
      const rightMatch = quarterfinalByNumber.get(rightMatchNumber);

      if (!leftMatch || !rightMatch) {
        throw new BadRequestException('Could not resolve Quarterfinal winners');
      }

      generated.push(
        await this.matchService.createMatch(
          this.getWinnerTeamId(leftMatch),
          this.getWinnerTeamId(rightMatch),
          schedule[i],
          MatchPhase.ELIMINATION,
          undefined,
          'SF',
        ),
      );
    }

    return generated;
  }

  async generateFinalAndThirdFromSemifinals(): Promise<{
    finalMatch: Match;
    thirdPlaceMatch: Match;
  }> {
    const existingFinal = await this.matchRepository.findByEliminationRound('FINAL');
    const existingThird = await this.matchRepository.findByEliminationRound('THIRD');

    if (existingFinal.length > 0 && existingThird.length > 0) {
      return {
        finalMatch: existingFinal[0],
        thirdPlaceMatch: existingThird[0],
      };
    }

    const semifinalMatches = await this.getCompletedRoundMatches('SF', 2);
    const semifinalByNumber = this.mapMatchesByNumber(semifinalMatches, 101);
    const semifinal1 = semifinalByNumber.get(101);
    const semifinal2 = semifinalByNumber.get(102);

    if (!semifinal1 || !semifinal2) {
      throw new BadRequestException('Could not resolve semifinal matches');
    }

    const finalMatch =
      existingFinal[0] ??
      (await this.matchService.createMatch(
        this.getWinnerTeamId(semifinal1),
        this.getWinnerTeamId(semifinal2),
        new Date('2026-07-19T18:00:00Z'),
        MatchPhase.ELIMINATION,
        undefined,
        'FINAL',
      ));

    const thirdPlaceMatch =
      existingThird[0] ??
      (await this.matchService.createMatch(
        this.getLoserTeamId(semifinal1),
        this.getLoserTeamId(semifinal2),
        new Date('2026-07-18T18:00:00Z'),
        MatchPhase.ELIMINATION,
        undefined,
        'THIRD',
      ));

    return { finalMatch, thirdPlaceMatch };
  }

  async configureRound16(teams: Team[]): Promise<Match[]> {
    const canConfigure = await this.isEliminationRoundComplete('R32', 16);
    if (!canConfigure) {
      throw new BadRequestException(
        'No se puede editar Octavos hasta que terminen todos los Dieciseisavos (R32)',
      );
    }

    this.validateRound16Input(teams);

    const matches: Match[] = [];
    const matchDates = this.generateRound16Schedule();

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

    await this.validateBracketConfiguration(matches, 'R16');

    return matches;
  }

  async configureQuarterfinals(teams: Team[]): Promise<Match[]> {
    const canConfigure = await this.isEliminationRoundComplete('R16', 8);
    if (!canConfigure) {
      throw new BadRequestException(
        'No se puede editar Cuartos hasta que terminen todos los Octavos (R16)',
      );
    }

    if (!teams || teams.length !== 8) {
      throw new BadRequestException(
        'Quarterfinals configuration requires exactly 8 teams',
      );
    }

    for (const team of teams) {
      if (!team || !team.id) {
        throw new BadRequestException('Invalid team in Quarterfinals configuration');
      }
    }

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

    await this.validateBracketConfiguration(matches, 'QF');

    return matches;
  }

  async configureSemifinals(teams: Team[]): Promise<{
    semifinalMatches: Match[];
    thirdPlaceMatch: Match;
  }> {
    const canConfigure = await this.isEliminationRoundComplete('QF', 4);
    if (!canConfigure) {
      throw new BadRequestException(
        'No se puede editar Semifinales hasta que terminen todos los Cuartos (QF)',
      );
    }

    if (!teams || teams.length !== 4) {
      throw new BadRequestException(
        'Semifinals configuration requires exactly 4 teams',
      );
    }

    for (const team of teams) {
      if (!team || !team.id) {
        throw new BadRequestException('Invalid team in Semifinals configuration');
      }
    }

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

    const thirdPlaceTime = new Date('2026-08-14T18:00:00Z');
    const thirdPlaceMatch = await this.matchService.createMatch(
      teams[1].id,
      teams[2].id,
      thirdPlaceTime,
      MatchPhase.ELIMINATION,
      undefined,
      'THIRD',
    );

    await this.validateBracketConfiguration(semifinalMatches, 'SF');

    return {
      semifinalMatches,
      thirdPlaceMatch,
    };
  }

  async configureFinal(team1: Team, team2: Team): Promise<Match> {
    if (!team1 || !team1.id || !team2 || !team2.id) {
      throw new BadRequestException('Invalid teams for Final configuration');
    }

    if (team1.id === team2.id) {
      throw new BadRequestException('Final teams must be different');
    }

    const finalTime = new Date('2026-08-16T18:00:00Z');
    return this.matchService.createMatch(
      team1.id,
      team2.id,
      finalTime,
      MatchPhase.ELIMINATION,
      undefined,
      'FINAL',
    );
  }

  private assignThirdTeamsToSlots(
    qualifiedThirds: RankedTeam[],
    slots: ThirdSlot[],
  ): Map<number, RankedTeam> {
    const assigned = new Map<number, RankedTeam>();
    const usedGroups = new Set<string>();

    const solve = (): boolean => {
      if (assigned.size === slots.length) {
        return true;
      }

      let selectedSlot: ThirdSlot | null = null;
      let selectedCandidates: RankedTeam[] = [];

      for (const slot of slots) {
        if (assigned.has(slot.matchNumber)) {
          continue;
        }

        const candidates = qualifiedThirds
          .filter(
            (team) =>
              !usedGroups.has(team.group) &&
              slot.allowedGroups.includes(team.group),
          )
          .sort((a, b) => a.group.localeCompare(b.group));

        if (candidates.length === 0) {
          return false;
        }

        if (!selectedSlot || candidates.length < selectedCandidates.length) {
          selectedSlot = slot;
          selectedCandidates = candidates;
        }
      }

      if (!selectedSlot) {
        return false;
      }

      for (const candidate of selectedCandidates) {
        assigned.set(selectedSlot.matchNumber, candidate);
        usedGroups.add(candidate.group);

        if (solve()) {
          return true;
        }

        assigned.delete(selectedSlot.matchNumber);
        usedGroups.delete(candidate.group);
      }

      return false;
    };

    if (!solve()) {
      throw new BadRequestException(
        'Unable to map qualified third-placed teams to Round of 32 slots',
      );
    }

    return assigned;
  }

  private getRound32Templates(): Round32Template[] {
    return [
      {
        matchNumber: 73,
        scheduledTime: '2026-06-28T20:00:00Z',
        team1: { type: 'group', position: 2, group: 'A' },
        team2: { type: 'group', position: 2, group: 'B' },
      },
      {
        matchNumber: 74,
        scheduledTime: '2026-06-29T20:00:00Z',
        team1: { type: 'group', position: 1, group: 'E' },
        team2: { type: 'third', allowedGroups: ['A', 'B', 'C', 'D', 'F'] },
      },
      {
        matchNumber: 75,
        scheduledTime: '2026-06-29T23:00:00Z',
        team1: { type: 'group', position: 1, group: 'F' },
        team2: { type: 'group', position: 2, group: 'C' },
      },
      {
        matchNumber: 76,
        scheduledTime: '2026-06-30T02:00:00Z',
        team1: { type: 'group', position: 1, group: 'C' },
        team2: { type: 'group', position: 2, group: 'F' },
      },
      {
        matchNumber: 77,
        scheduledTime: '2026-06-30T20:00:00Z',
        team1: { type: 'group', position: 1, group: 'I' },
        team2: { type: 'third', allowedGroups: ['C', 'D', 'F', 'G', 'H'] },
      },
      {
        matchNumber: 78,
        scheduledTime: '2026-06-30T23:00:00Z',
        team1: { type: 'group', position: 2, group: 'E' },
        team2: { type: 'group', position: 2, group: 'I' },
      },
      {
        matchNumber: 79,
        scheduledTime: '2026-07-01T02:00:00Z',
        team1: { type: 'group', position: 1, group: 'A' },
        team2: { type: 'third', allowedGroups: ['C', 'E', 'F', 'H', 'I'] },
      },
      {
        matchNumber: 80,
        scheduledTime: '2026-07-01T20:00:00Z',
        team1: { type: 'group', position: 1, group: 'L' },
        team2: { type: 'third', allowedGroups: ['E', 'H', 'I', 'J', 'K'] },
      },
      {
        matchNumber: 81,
        scheduledTime: '2026-07-01T23:00:00Z',
        team1: { type: 'group', position: 1, group: 'D' },
        team2: { type: 'third', allowedGroups: ['B', 'E', 'F', 'I', 'J'] },
      },
      {
        matchNumber: 82,
        scheduledTime: '2026-07-02T02:00:00Z',
        team1: { type: 'group', position: 1, group: 'G' },
        team2: { type: 'third', allowedGroups: ['A', 'E', 'H', 'I', 'J'] },
      },
      {
        matchNumber: 83,
        scheduledTime: '2026-07-02T20:00:00Z',
        team1: { type: 'group', position: 2, group: 'K' },
        team2: { type: 'group', position: 2, group: 'L' },
      },
      {
        matchNumber: 84,
        scheduledTime: '2026-07-02T23:00:00Z',
        team1: { type: 'group', position: 1, group: 'H' },
        team2: { type: 'group', position: 2, group: 'J' },
      },
      {
        matchNumber: 85,
        scheduledTime: '2026-07-03T02:00:00Z',
        team1: { type: 'group', position: 1, group: 'B' },
        team2: { type: 'third', allowedGroups: ['E', 'F', 'G', 'I', 'J'] },
      },
      {
        matchNumber: 86,
        scheduledTime: '2026-07-03T20:00:00Z',
        team1: { type: 'group', position: 1, group: 'J' },
        team2: { type: 'group', position: 2, group: 'H' },
      },
      {
        matchNumber: 87,
        scheduledTime: '2026-07-03T23:00:00Z',
        team1: { type: 'group', position: 1, group: 'K' },
        team2: { type: 'third', allowedGroups: ['D', 'E', 'I', 'J', 'L'] },
      },
      {
        matchNumber: 88,
        scheduledTime: '2026-07-04T02:00:00Z',
        team1: { type: 'group', position: 2, group: 'D' },
        team2: { type: 'group', position: 2, group: 'G' },
      },
    ];
  }

  private validateRound16Input(teams: Team[]): void {
    if (!teams || teams.length !== 16) {
      throw new BadRequestException(
        'Round of 16 configuration requires exactly 16 teams',
      );
    }

    for (const team of teams) {
      if (!team || !team.id) {
        throw new BadRequestException('Invalid team in Round of 16 configuration');
      }
    }

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

  private async validateBracketConfiguration(
    matches: Match[],
    round: string,
  ): Promise<void> {
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

    this.validateSchedulingDates(matches, round);
    this.validateNoDuplicatePairings(matches);
  }

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
    if (!range) return;

    for (const match of matches) {
      if (match.scheduledTime < range.start || match.scheduledTime > range.end) {
        throw new BadRequestException(
          `Match ${match.id} scheduled outside expected date range for ${round}`,
        );
      }
    }
  }

  private validateNoDuplicatePairings(matches: Match[]): void {
    const pairings = new Set<string>();

    for (const match of matches) {
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

  private async tryGenerateNextPhase<T>(factory: () => Promise<T>): Promise<void> {
    try {
      await factory();
    } catch (error) {
      if (error instanceof BadRequestException) {
        return;
      }
      throw error;
    }
  }

  private mapMatchesByNumber(matches: Match[], startingMatchNumber: number): Map<number, Match> {
    const sorted = [...matches].sort(
      (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime(),
    );

    const map = new Map<number, Match>();
    for (let index = 0; index < sorted.length; index++) {
      map.set(startingMatchNumber + index, sorted[index]);
    }

    return map;
  }

  private getWinnerTeamId(match: Match): string {
    if (!match.result || !match.result.winnerId) {
      throw new BadRequestException(`Match ${match.id} does not have a winner`);
    }
    return match.result.winnerId;
  }

  private getLoserTeamId(match: Match): string {
    const winnerTeamId = this.getWinnerTeamId(match);
    if (winnerTeamId === match.team1Id) {
      return match.team2Id;
    }
    if (winnerTeamId === match.team2Id) {
      return match.team1Id;
    }
    throw new BadRequestException(`Match ${match.id} winner does not match participants`);
  }

  private async getCompletedRoundMatches(round: string, expectedMatches: number): Promise<Match[]> {
    const matches = await this.matchRepository.findByEliminationRound(round);
    if (matches.length !== expectedMatches) {
      throw new BadRequestException(
        `Expected ${expectedMatches} matches in ${round}, got ${matches.length}`,
      );
    }

    const allCompleted = matches.every((match) => !!match.result);
    if (!allCompleted) {
      throw new BadRequestException(`Round ${round} must be fully completed`);
    }

    return matches;
  }

  private async isGroupPhaseComplete(): Promise<boolean> {
    const groupMatches = await this.matchRepository.findByPhase(MatchPhase.GROUP);
    return groupMatches.length > 0 && groupMatches.every((match) => !!match.result);
  }

  private async isEliminationRoundComplete(round: string, expectedMatches: number): Promise<boolean> {
    const matches = await this.matchRepository.findByEliminationRound(round);
    if (matches.length !== expectedMatches) {
      return false;
    }

    return matches.every((match) => !!match.result);
  }

  private generateRound16Schedule(): Date[] {
    return [
      new Date('2026-07-01T14:00:00Z'),
      new Date('2026-07-01T18:00:00Z'),
      new Date('2026-07-02T14:00:00Z'),
      new Date('2026-07-02T18:00:00Z'),
      new Date('2026-07-03T14:00:00Z'),
      new Date('2026-07-03T18:00:00Z'),
      new Date('2026-07-04T14:00:00Z'),
      new Date('2026-07-04T18:00:00Z'),
    ];
  }

  private generateQuarterfinalsSchedule(): Date[] {
    return [
      new Date('2026-07-07T14:00:00Z'),
      new Date('2026-07-07T18:00:00Z'),
      new Date('2026-07-08T14:00:00Z'),
      new Date('2026-07-08T18:00:00Z'),
    ];
  }

  private generateSemifinalsSchedule(): Date[] {
    return [
      new Date('2026-07-14T18:00:00Z'),
      new Date('2026-07-15T18:00:00Z'),
    ];
  }
}
