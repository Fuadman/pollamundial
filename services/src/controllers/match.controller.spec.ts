import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from '../services/match.service';
import { Match, MatchStatus, MatchPhase } from '../entities/match.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MatchController', () => {
  let controller: MatchController;
  let matchService: MatchService;

  const mockTeam1 = {
    id: 'team1',
    name: 'Team A',
    group: 'A',
  };

  const mockTeam2 = {
    id: 'team2',
    name: 'Team B',
    group: 'A',
  };

  const mockMatch: Match = {
    id: 'match1',
    team1Id: 'team1',
    team2Id: 'team2',
    team1: mockTeam1 as any,
    team2: mockTeam2 as any,
    scheduledTime: new Date('2026-06-11T14:00:00Z'),
    lockdownTime: new Date('2026-06-11T13:45:00Z'),
    status: MatchStatus.SCHEDULED,
    phase: MatchPhase.GROUP,
    groupStageGroup: 'A',
    eliminationRound: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    predictions: [],
    result: null,
  };

  const mockMatch2: Match = {
    id: 'match2',
    team1Id: 'team3',
    team2Id: 'team4',
    team1: { id: 'team3', name: 'Team C', group: 'B' } as any,
    team2: { id: 'team4', name: 'Team D', group: 'B' } as any,
    scheduledTime: new Date('2026-06-12T14:00:00Z'),
    lockdownTime: new Date('2026-06-12T13:45:00Z'),
    status: MatchStatus.SCHEDULED,
    phase: MatchPhase.GROUP,
    groupStageGroup: 'B',
    eliminationRound: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    predictions: [],
    result: null,
  };

  const mockEliminationMatch: Match = {
    id: 'match3',
    team1Id: 'team5',
    team2Id: 'team6',
    team1: { id: 'team5', name: 'Team E', group: null } as any,
    team2: { id: 'team6', name: 'Team F', group: null } as any,
    scheduledTime: new Date('2026-07-01T14:00:00Z'),
    lockdownTime: new Date('2026-07-01T13:45:00Z'),
    status: MatchStatus.SCHEDULED,
    phase: MatchPhase.ELIMINATION,
    groupStageGroup: null,
    eliminationRound: 'R16',
    createdAt: new Date(),
    updatedAt: new Date(),
    predictions: [],
    result: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchController],
      providers: [
        {
          provide: MatchService,
          useValue: {
            getMatchById: jest.fn(),
            getMatchesByPhase: jest.fn(),
            getMatchesByStatus: jest.fn(),
            getMatchesByGroup: jest.fn(),
            getMatchesByDateRange: jest.fn(),
            convertMatchToResponseDto: jest.fn((match) => ({
              ...match,
              scheduledTime: {
                utcTime: match.scheduledTime,
                localTime: match.scheduledTime,
                offsetMinutes: 0,
                abbreviation: 'UTC',
              },
              lockdownTime: {
                utcTime: match.lockdownTime,
                localTime: match.lockdownTime,
                offsetMinutes: 0,
                abbreviation: 'UTC',
              },
              team1Name: match.team1?.name || '',
              team2Name: match.team2?.name || '',
              team1Code: match.team1?.code,
              team2Code: match.team2?.code,
            })),
            convertMatchesToResponseDtos: jest.fn((matches) =>
              matches.map((match: any) => ({
                ...match,
                scheduledTime: {
                  utcTime: match.scheduledTime,
                  localTime: match.scheduledTime,
                  offsetMinutes: 0,
                  abbreviation: 'UTC',
                },
                lockdownTime: {
                  utcTime: match.lockdownTime,
                  localTime: match.lockdownTime,
                  offsetMinutes: 0,
                  abbreviation: 'UTC',
                },
                team1Name: match.team1?.name || '',
                team2Name: match.team2?.name || '',
                team1Code: match.team1?.code,
                team2Code: match.team2?.code,
              })),
            ),
          },
        },
      ],
    }).compile();

    controller = module.get<MatchController>(MatchController);
    matchService = module.get<MatchService>(MatchService);
  });

  describe('getMatches', () => {
    it('should return all matches when no filters provided', async () => {
      (matchService.getMatchesByPhase as jest.Mock)
        .mockResolvedValueOnce([mockMatch, mockMatch2])
        .mockResolvedValueOnce([mockEliminationMatch]);

      const result = await controller.getMatches();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(mockMatch.id);
      expect(result[1].id).toBe(mockMatch2.id);
      expect(result[2].id).toBe(mockEliminationMatch.id);
    });

    it('should filter matches by phase', async () => {
      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([
        mockMatch,
        mockMatch2,
      ]);

      const result = await controller.getMatches(MatchPhase.GROUP);

      expect(result).toHaveLength(2);
      expect(matchService.getMatchesByPhase).toHaveBeenCalledWith(
        MatchPhase.GROUP,
      );
    });

    it('should filter matches by status', async () => {
      (matchService.getMatchesByStatus as jest.Mock).mockResolvedValue([
        mockMatch,
      ]);

      const result = await controller.getMatches(undefined, MatchStatus.SCHEDULED);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(MatchStatus.SCHEDULED);
      expect(matchService.getMatchesByStatus).toHaveBeenCalledWith(
        MatchStatus.SCHEDULED,
      );
    });

    it('should filter matches by group', async () => {
      (matchService.getMatchesByGroup as jest.Mock).mockResolvedValue([
        mockMatch,
      ]);

      const result = await controller.getMatches(undefined, undefined, 'A');

      expect(result).toHaveLength(1);
      expect(result[0].groupStageGroup).toBe('A');
      expect(matchService.getMatchesByGroup).toHaveBeenCalledWith('A');
    });

    it('should filter matches by date range', async () => {
      const startDate = '2026-06-01T00:00:00Z';
      const endDate = '2026-06-30T23:59:59Z';

      (matchService.getMatchesByDateRange as jest.Mock).mockResolvedValue([
        mockMatch,
        mockMatch2,
      ]);

      const result = await controller.getMatches(
        undefined,
        undefined,
        undefined,
        startDate,
        endDate,
      );

      expect(result).toHaveLength(2);
      expect(matchService.getMatchesByDateRange).toHaveBeenCalled();
    });

    it('should apply phase filter to date range results', async () => {
      const startDate = '2026-06-01T00:00:00Z';
      const endDate = '2026-06-30T23:59:59Z';

      (matchService.getMatchesByDateRange as jest.Mock).mockResolvedValue([
        mockMatch,
        mockMatch2,
      ]);

      const result = await controller.getMatches(
        MatchPhase.GROUP,
        undefined,
        undefined,
        startDate,
        endDate,
      );

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.phase === MatchPhase.GROUP)).toBe(true);
    });

    it('should apply status filter to date range results', async () => {
      const startDate = '2026-06-01T00:00:00Z';
      const endDate = '2026-06-30T23:59:59Z';

      const completedMatch = { ...mockMatch, status: MatchStatus.COMPLETED };
      (matchService.getMatchesByDateRange as jest.Mock).mockResolvedValue([
        mockMatch,
        completedMatch,
      ]);

      const result = await controller.getMatches(
        undefined,
        MatchStatus.COMPLETED,
        undefined,
        startDate,
        endDate,
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(MatchStatus.COMPLETED);
    });

    it('should apply group filter to date range results', async () => {
      const startDate = '2026-06-01T00:00:00Z';
      const endDate = '2026-06-30T23:59:59Z';

      (matchService.getMatchesByDateRange as jest.Mock).mockResolvedValue([
        mockMatch,
        mockMatch2,
      ]);

      const result = await controller.getMatches(
        undefined,
        undefined,
        'A',
        startDate,
        endDate,
      );

      expect(result).toHaveLength(1);
      expect(result[0].groupStageGroup).toBe('A');
    });

    it('should throw BadRequestException for invalid phase', async () => {
      await expect(
        controller.getMatches('invalid_phase'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(
        controller.getMatches(undefined, 'invalid_status'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(
        controller.getMatches(
          undefined,
          undefined,
          undefined,
          'invalid-date',
          '2026-06-30',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when startDate is after endDate', async () => {
      await expect(
        controller.getMatches(
          undefined,
          undefined,
          undefined,
          '2026-06-30T00:00:00Z',
          '2026-06-01T00:00:00Z',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when group filter used with non-group phase', async () => {
      await expect(
        controller.getMatches(MatchPhase.ELIMINATION, undefined, 'A'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should combine phase and status filters', async () => {
      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([
        mockMatch,
        { ...mockMatch2, status: MatchStatus.COMPLETED },
      ]);

      const result = await controller.getMatches(
        MatchPhase.GROUP,
        MatchStatus.SCHEDULED,
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(MatchStatus.SCHEDULED);
    });
  });

  describe('getMatch', () => {
    it('should return a specific match by ID', async () => {
      (matchService.getMatchById as jest.Mock).mockResolvedValue(mockMatch);

      const result = await controller.getMatch('match1');

      expect(result.id).toBe(mockMatch.id);
      expect(result.team1Id).toBe(mockMatch.team1Id);
      expect(result.team2Id).toBe(mockMatch.team2Id);
      expect(matchService.getMatchById).toHaveBeenCalledWith('match1');
    });

    it('should throw NotFoundException when match does not exist', async () => {
      (matchService.getMatchById as jest.Mock).mockRejectedValue(
        new NotFoundException('Match not found'),
      );

      await expect(controller.getMatch('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid match ID format', async () => {
      (matchService.getMatchById as jest.Mock).mockRejectedValue(
        new Error('Invalid UUID'),
      );

      await expect(controller.getMatch('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getGroupSchedule', () => {
    it('should return all group stage matches', async () => {
      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([
        mockMatch,
        mockMatch2,
      ]);

      const result = await controller.getGroupSchedule();

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.phase === MatchPhase.GROUP)).toBe(true);
      expect(matchService.getMatchesByPhase).toHaveBeenCalledWith(
        MatchPhase.GROUP,
      );
    });

    it('should return empty array when no group stage matches exist', async () => {
      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([]);

      const result = await controller.getGroupSchedule();

      expect(result).toHaveLength(0);
    });

    it('should return matches sorted by scheduled time', async () => {
      const match1 = { ...mockMatch, scheduledTime: new Date('2026-06-01') };
      const match2 = { ...mockMatch2, scheduledTime: new Date('2026-06-02') };

      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([
        match1,
        match2,
      ]);

      const result = await controller.getGroupSchedule();

      expect(result[0].scheduledTime.utcTime.getTime()).toBeLessThan(
        result[1].scheduledTime.utcTime.getTime(),
      );
    });
  });

  describe('getEliminationSchedule', () => {
    it('should return all elimination phase matches', async () => {
      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([
        mockEliminationMatch,
      ]);

      const result = await controller.getEliminationSchedule();

      expect(result).toHaveLength(1);
      expect(result[0].phase).toBe(MatchPhase.ELIMINATION);
      expect(matchService.getMatchesByPhase).toHaveBeenCalledWith(
        MatchPhase.ELIMINATION,
      );
    });

    it('should return empty array when no elimination matches exist', async () => {
      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([]);

      const result = await controller.getEliminationSchedule();

      expect(result).toHaveLength(0);
    });

    it('should return matches with elimination round information', async () => {
      const r16Match = { ...mockEliminationMatch, eliminationRound: 'R16' };
      const qfMatch = {
        ...mockEliminationMatch,
        id: 'match4',
        eliminationRound: 'QF',
      };

      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([
        r16Match,
        qfMatch,
      ]);

      const result = await controller.getEliminationSchedule();

      expect(result).toHaveLength(2);
      expect(result.some((m) => m.eliminationRound === 'R16')).toBe(true);
      expect(result.some((m) => m.eliminationRound === 'QF')).toBe(true);
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle multiple filters correctly', async () => {
      const startDate = '2026-06-01T00:00:00Z';
      const endDate = '2026-06-30T23:59:59Z';

      (matchService.getMatchesByDateRange as jest.Mock).mockResolvedValue([
        mockMatch,
        mockMatch2,
      ]);

      const result = await controller.getMatches(
        MatchPhase.GROUP,
        MatchStatus.SCHEDULED,
        'A',
        startDate,
        endDate,
      );

      expect(result).toHaveLength(1);
      expect(result[0].groupStageGroup).toBe('A');
      expect(result[0].status).toBe(MatchStatus.SCHEDULED);
      expect(result[0].phase).toBe(MatchPhase.GROUP);
    });

    it('should handle empty results gracefully', async () => {
      (matchService.getMatchesByPhase as jest.Mock).mockResolvedValue([]);

      const result = await controller.getMatches(MatchPhase.GROUP);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should preserve match data integrity through filtering', async () => {
      (matchService.getMatchesByDateRange as jest.Mock).mockResolvedValue([
        mockMatch,
      ]);

      const result = await controller.getMatches(
        undefined,
        undefined,
        undefined,
        '2026-06-01T00:00:00Z',
        '2026-06-30T23:59:59Z',
      );

      expect(result[0].id).toBe(mockMatch.id);
      expect(result[0].team1Id).toBe(mockMatch.team1Id);
      expect(result[0].team2Id).toBe(mockMatch.team2Id);
      expect(result[0].scheduledTime.utcTime).toEqual(mockMatch.scheduledTime);
    });
  });
});
