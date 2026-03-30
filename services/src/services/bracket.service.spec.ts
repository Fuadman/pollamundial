import { Test, TestingModule } from '@nestjs/testing';
import { BracketService } from './bracket.service';
import { MatchService } from './match.service';
import { TeamRepository } from '../repositories/team.repository';
import { MatchRepository } from '../repositories/match.repository';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { Team } from '../entities/team.entity';
import { Match, MatchStatus, MatchPhase } from '../entities/match.entity';
import { BadRequestException } from '@nestjs/common';

describe('BracketService', () => {
  let service: BracketService;
  let matchService: MatchService;
  let teamRepository: TeamRepository;

  // Mock teams for testing
  const mockTeams: Team[] = Array.from({ length: 16 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    code: `T${i + 1}`,
    groupStageGroup: null,
    createdAt: new Date(),
    matchesAsTeam1: [],
    matchesAsTeam2: [],
    wonMatches: [],
  }));

  const createMockMatch = (
    id: string,
    team1Id: string,
    team2Id: string,
    eliminationRound: string,
    scheduledTime: Date,
  ): Match => ({
    id,
    team1Id,
    team2Id,
    team1: mockTeams.find((t) => t.id === team1Id)!,
    team2: mockTeams.find((t) => t.id === team2Id)!,
    scheduledTime,
    lockdownTime: new Date(scheduledTime.getTime() - 15 * 60 * 1000),
    status: MatchStatus.SCHEDULED,
    phase: MatchPhase.ELIMINATION,
    groupStageGroup: null,
    eliminationRound,
    createdAt: new Date(),
    updatedAt: new Date(),
    predictionsBlocked: false,
    predictions: [],
    result: null,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BracketService,
        {
          provide: MatchService,
          useValue: {
            createMatch: jest.fn(),
            getMatchById: jest.fn(),
            getMatchesByEliminationRound: jest.fn(),
            validateTournamentStructure: jest.fn(),
          },
        },
        {
          provide: TeamRepository,
          useValue: {
            findOne: jest.fn(),
            findByIds: jest.fn(),
          },
        },
        {
          provide: MatchRepository,
          useValue: {
            findByEliminationRound: jest.fn(),
            findByPhase: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: MatchResultRepository,
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BracketService>(BracketService);
    matchService = module.get<MatchService>(MatchService);
    teamRepository = module.get<TeamRepository>(TeamRepository);

    jest
      .spyOn(service as any, 'isEliminationRoundComplete')
      .mockResolvedValue(true);
  });

  describe('configureRound16', () => {
    it('should create 8 matches for Round of 16 with 16 teams', async () => {
      const teams = mockTeams.slice(0, 16);
      let callCount = 0;

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          const match = createMockMatch(
            `match-${callCount + 1}`,
            team1Id,
            team2Id,
            eliminationRound,
            scheduledTime,
          );
          callCount++;
          return Promise.resolve(match);
        },
      );

      const result = await service.configureRound16(teams);

      expect(result).toBeDefined();
      expect(result).toHaveLength(8);
      expect(matchService.createMatch).toHaveBeenCalled();
    });

    it('should throw error if less than 16 teams provided', async () => {
      const teams = mockTeams.slice(0, 15);

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if more than 16 teams provided', async () => {
      const extraTeam: Team = {
        id: 'team-extra',
        name: 'Extra Team',
        code: 'EXT',
        groupStageGroup: null,
        createdAt: new Date(),
        matchesAsTeam1: [],
        matchesAsTeam2: [],
        wonMatches: [],
      };
      const teams = [...mockTeams.slice(0, 16), extraTeam];

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if null team provided', async () => {
      const teams = [...mockTeams.slice(0, 15), null as any];

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if duplicate teams provided', async () => {
      const teams = [...mockTeams.slice(0, 15), mockTeams[0]];

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set eliminationRound to R16 for all matches', async () => {
      const teams = mockTeams.slice(0, 16);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          expect(eliminationRound).toBe('R16');
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      await service.configureRound16(teams);

      expect(matchService.createMatch).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Date),
        MatchPhase.ELIMINATION,
        undefined,
        'R16',
      );
    });

    it('should schedule matches within July 1-6, 2026', async () => {
      const teams = mockTeams.slice(0, 16);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureRound16(teams);

      expect(result).toBeDefined();
      result.forEach((match) => {
        expect(match.scheduledTime.getTime()).toBeGreaterThanOrEqual(
          new Date('2026-07-01T00:00:00Z').getTime(),
        );
        expect(match.scheduledTime.getTime()).toBeLessThanOrEqual(
          new Date('2026-07-06T23:59:59Z').getTime(),
        );
      });
    });
  });

  describe('configureQuarterfinals', () => {
    it('should create 4 matches for Quarterfinals with 8 teams', async () => {
      const teams = mockTeams.slice(0, 8);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureQuarterfinals(teams);

      expect(result).toBeDefined();
      expect(result).toHaveLength(4);
      expect(matchService.createMatch).toHaveBeenCalled();
    });

    it('should throw error if not exactly 8 teams provided', async () => {
      const teams = mockTeams.slice(0, 7);

      await expect(service.configureQuarterfinals(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set eliminationRound to QF for all matches', async () => {
      const teams = mockTeams.slice(0, 8);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          expect(eliminationRound).toBe('QF');
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      await service.configureQuarterfinals(teams);

      expect(matchService.createMatch).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Date),
        MatchPhase.ELIMINATION,
        undefined,
        'QF',
      );
    });

    it('should schedule matches within July 7-10, 2026', async () => {
      const teams = mockTeams.slice(0, 8);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureQuarterfinals(teams);

      expect(result).toBeDefined();
      result.forEach((match) => {
        expect(match.scheduledTime.getTime()).toBeGreaterThanOrEqual(
          new Date('2026-07-07T00:00:00Z').getTime(),
        );
        expect(match.scheduledTime.getTime()).toBeLessThanOrEqual(
          new Date('2026-07-10T23:59:59Z').getTime(),
        );
      });
    });
  });

  describe('configureSemifinals', () => {
    it('should create 2 semifinal matches and 1 third place match with 4 teams', async () => {
      const teams = mockTeams.slice(0, 4);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureSemifinals(teams);

      expect(result.semifinalMatches).toHaveLength(2);
      expect(result.thirdPlaceMatch).toBeDefined();
    });

    it('should throw error if not exactly 4 teams provided', async () => {
      const teams = mockTeams.slice(0, 3);

      await expect(service.configureSemifinals(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set eliminationRound to SF for semifinal matches', async () => {
      const teams = mockTeams.slice(0, 4);
      let callCount = 0;

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          if (callCount < 2) {
            expect(eliminationRound).toBe('SF');
          }
          callCount++;
          return Promise.resolve(
            createMockMatch(
              `match-${callCount}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      await service.configureSemifinals(teams);
    });

    it('should set eliminationRound to THIRD for third place match', async () => {
      const teams = mockTeams.slice(0, 4);
      let callCount = 0;

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          callCount++;
          if (callCount === 3) {
            expect(eliminationRound).toBe('THIRD');
          }
          return Promise.resolve(
            createMockMatch(
              `match-${callCount}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      await service.configureSemifinals(teams);
    });

    it('should schedule third place match for August 14, 2026', async () => {
      const teams = mockTeams.slice(0, 4);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureSemifinals(teams);

      expect(result.thirdPlaceMatch.scheduledTime).toEqual(
        new Date('2026-08-14T18:00:00Z'),
      );
    });
  });

  describe('configureFinal', () => {
    it('should create Final match with 2 teams', async () => {
      const team1 = mockTeams[0];
      const team2 = mockTeams[1];

      (matchService.createMatch as jest.Mock).mockResolvedValue(
        createMockMatch('final', team1.id, team2.id, 'FINAL', new Date('2026-08-16T18:00:00Z')),
      );

      const result = await service.configureFinal(team1, team2);

      expect(result).toBeDefined();
      expect(matchService.createMatch).toHaveBeenCalled();
    });

    it('should throw error if team1 is null', async () => {
      const team2 = mockTeams[1];

      await expect(service.configureFinal(null as any, team2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if team2 is null', async () => {
      const team1 = mockTeams[0];

      await expect(service.configureFinal(team1, null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if both teams are the same', async () => {
      const team = mockTeams[0];

      await expect(service.configureFinal(team, team)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set eliminationRound to FINAL', async () => {
      const team1 = mockTeams[0];
      const team2 = mockTeams[1];

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          expect(eliminationRound).toBe('FINAL');
          return Promise.resolve(
            createMockMatch('final', team1Id, team2Id, eliminationRound, scheduledTime),
          );
        },
      );

      await service.configureFinal(team1, team2);

      expect(matchService.createMatch).toHaveBeenCalledWith(
        team1.id,
        team2.id,
        expect.any(Date),
        MatchPhase.ELIMINATION,
        undefined,
        'FINAL',
      );
    });

    it('should schedule Final match for August 16, 2026', async () => {
      const team1 = mockTeams[0];
      const team2 = mockTeams[1];

      (matchService.createMatch as jest.Mock).mockResolvedValue(
        createMockMatch('final', team1.id, team2.id, 'FINAL', new Date('2026-08-16T18:00:00Z')),
      );

      const result = await service.configureFinal(team1, team2);

      expect(result.scheduledTime).toEqual(new Date('2026-08-16T18:00:00Z'));
    });
  });

  describe('Bracket Validation', () => {
    it('should validate exactly 8 matches generated for Round of 16', async () => {
      const teams = mockTeams.slice(0, 16);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureRound16(teams);

      expect(result).toHaveLength(8);
    });

    it('should validate no duplicate team pairings in Round of 16', async () => {
      const teams = mockTeams.slice(0, 16);
      const duplicateTeams = [...teams.slice(0, 8), ...teams.slice(0, 8)];

      await expect(service.configureRound16(duplicateTeams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate all matches have ELIMINATION phase', async () => {
      const teams = mockTeams.slice(0, 16);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureRound16(teams);

      expect(result.every((m) => m.phase === MatchPhase.ELIMINATION)).toBe(true);
    });

    it('should validate all matches have correct eliminationRound', async () => {
      const teams = mockTeams.slice(0, 16);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureRound16(teams);

      expect(result.every((m) => m.eliminationRound === 'R16')).toBe(true);
    });

    it('should validate matches scheduled within July 1-6 for Round of 16', async () => {
      const teams = mockTeams.slice(0, 16);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureRound16(teams);

      const allWithinRange = result.every((m) => {
        const time = m.scheduledTime;
        return (
          time >= new Date('2026-07-01T00:00:00Z') &&
          time <= new Date('2026-07-06T23:59:59Z')
        );
      });

      expect(allWithinRange).toBe(true);
    });

    it('should validate exactly 4 matches generated for Quarterfinals', async () => {
      const teams = mockTeams.slice(0, 8);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureQuarterfinals(teams);

      expect(result).toHaveLength(4);
    });

    it('should validate exactly 2 semifinal matches generated', async () => {
      const teams = mockTeams.slice(0, 4);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureSemifinals(teams);

      expect(result.semifinalMatches).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty team array for Round of 16', async () => {
      await expect(service.configureRound16([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle undefined team array for Round of 16', async () => {
      await expect(service.configureRound16(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle team with missing id', async () => {
      const teams = [
        ...mockTeams.slice(0, 15),
        { name: 'Invalid Team' } as any,
      ];

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle null in team array', async () => {
      const teams = [...mockTeams.slice(0, 15), null as any];

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle undefined in team array', async () => {
      const teams = [...mockTeams.slice(0, 15), undefined as any];

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate team IDs are unique in Round of 16', async () => {
      const teams = [
        ...mockTeams.slice(0, 8),
        ...mockTeams.slice(0, 8),
      ];

      await expect(service.configureRound16(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate team IDs are unique in Quarterfinals', async () => {
      const teams = [...mockTeams.slice(0, 4), ...mockTeams.slice(0, 4)];

      await expect(service.configureQuarterfinals(teams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate team IDs are unique in Semifinals', async () => {
      const teams = [...mockTeams.slice(0, 2), ...mockTeams.slice(0, 2)];

      await expect(service.configureSemifinals(teams)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Match Scheduling', () => {
    it('should schedule Round of 16 matches across multiple days', async () => {
      const teams = mockTeams.slice(0, 16);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureRound16(teams);

      const uniqueDates = new Set(
        result.map((m) => m.scheduledTime.toDateString()),
      );
      expect(uniqueDates.size).toBeGreaterThan(1);
    });

    it('should schedule Quarterfinals matches across multiple days', async () => {
      const teams = mockTeams.slice(0, 8);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureQuarterfinals(teams);

      const uniqueDates = new Set(
        result.map((m) => m.scheduledTime.toDateString()),
      );
      expect(uniqueDates.size).toBeGreaterThan(1);
    });

    it('should schedule Semifinals on different days', async () => {
      const teams = mockTeams.slice(0, 4);

      (matchService.createMatch as jest.Mock).mockImplementation(
        (team1Id, team2Id, scheduledTime, phase, groupStage, eliminationRound) => {
          return Promise.resolve(
            createMockMatch(
              `match-${(matchService.createMatch as jest.Mock).mock.calls.length}`,
              team1Id,
              team2Id,
              eliminationRound,
              scheduledTime,
            ),
          );
        },
      );

      const result = await service.configureSemifinals(teams);

      const sf1Date = result.semifinalMatches[0].scheduledTime.toDateString();
      const sf2Date = result.semifinalMatches[1].scheduledTime.toDateString();

      expect(sf1Date).not.toEqual(sf2Date);
    });
  });
});
