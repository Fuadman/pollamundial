import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { MatchRepository } from '../repositories/match.repository';
import { TeamRepository } from '../repositories/team.repository';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { TimezoneService } from './timezone.service';
import { Match, MatchStatus, MatchPhase } from '../entities/match.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MatchService', () => {
  let service: MatchService;
  let matchRepository: MatchRepository;
  let teamRepository: TeamRepository;

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
    predictionsBlocked: false,
    predictions: [],
    result: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        {
          provide: MatchRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findByPhase: jest.fn(),
            findByStatus: jest.fn(),
            findByGroup: jest.fn(),
            findByEliminationRound: jest.fn(),
            findByDateRange: jest.fn(),
            findUpcomingMatches: jest.fn(),
            findCompletedMatches: jest.fn(),
            findCompletedWithoutResult: jest.fn(),
            findMatchesNearLockdown: jest.fn(),
            findWithPredictions: jest.fn(),
            countByPhase: jest.fn(),
            countByStatus: jest.fn(),
            updateStatus: jest.fn(),
            updateLockdownTime: jest.fn(),
          },
        },
        {
          provide: TeamRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: MatchResultRepository,
          useValue: {
            find: jest.fn(),
            findByMatchId: jest.fn(),
            findByMatchIds: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: TimezoneService,
          useValue: {
            convertToUserTimezone: jest.fn(),
            convertToLaPaz: jest.fn(),
            getTimezoneAbbreviation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
    matchRepository = module.get<MatchRepository>(MatchRepository);
    teamRepository = module.get<TeamRepository>(TeamRepository);
  });

  describe('createMatch', () => {
    it('should create a match with correct lockdown time', async () => {
      const scheduledTime = new Date('2026-06-11T14:00:00Z');
      const expectedLockdownTime = new Date('2026-06-11T13:45:00Z');

      (teamRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockTeam1)
        .mockResolvedValueOnce(mockTeam2);

      (matchRepository.create as jest.Mock).mockReturnValue(mockMatch);
      (matchRepository.save as jest.Mock).mockResolvedValue(mockMatch);

      const result = await service.createMatch(
        'team1',
        'team2',
        scheduledTime,
        MatchPhase.GROUP,
        'A',
      );

      expect(result).toEqual(mockMatch);
      expect(matchRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          team1Id: 'team1',
          team2Id: 'team2',
          scheduledTime,
          lockdownTime: expectedLockdownTime,
          phase: MatchPhase.GROUP,
          groupStageGroup: 'A',
          status: MatchStatus.SCHEDULED,
        }),
      );
    });

    it('should throw NotFoundException if team1 does not exist', async () => {
      (teamRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.createMatch(
          'nonexistent',
          'team2',
          new Date(),
          MatchPhase.GROUP,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if team2 does not exist', async () => {
      (teamRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockTeam1)
        .mockResolvedValueOnce(null);

      await expect(
        service.createMatch(
          'team1',
          'nonexistent',
          new Date(),
          MatchPhase.GROUP,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if team plays against itself', async () => {
      (teamRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(mockTeam1)
        .mockResolvedValueOnce(mockTeam1);

      await expect(
        service.createMatch('team1', 'team1', new Date(), MatchPhase.GROUP),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMatchById', () => {
    it('should return a match by ID', async () => {
      (matchRepository.findOne as jest.Mock).mockResolvedValue(mockMatch);

      const result = await service.getMatchById('match1');

      expect(result).toEqual(mockMatch);
      expect(matchRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'match1' },
        relations: ['team1', 'team2', 'result'],
      });
    });

    it('should throw NotFoundException if match does not exist', async () => {
      (matchRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getMatchById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMatchesByPhase', () => {
    it('should return matches by phase', async () => {
      (matchRepository.findByPhase as jest.Mock).mockResolvedValue([mockMatch]);

      const result = await service.getMatchesByPhase(MatchPhase.GROUP);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMatch);
      expect(matchRepository.findByPhase).toHaveBeenCalledWith(MatchPhase.GROUP);
    });
  });

  describe('getMatchesByStatus', () => {
    it('should return matches by status', async () => {
      (matchRepository.findByStatus as jest.Mock).mockResolvedValue([mockMatch]);

      const result = await service.getMatchesByStatus(MatchStatus.SCHEDULED);

      expect(result).toHaveLength(1);
      expect(matchRepository.findByStatus).toHaveBeenCalledWith(
        MatchStatus.SCHEDULED,
      );
    });
  });

  describe('getMatchesByGroup', () => {
    it('should return matches by group', async () => {
      (matchRepository.findByGroup as jest.Mock).mockResolvedValue([mockMatch]);

      const result = await service.getMatchesByGroup('A');

      expect(result).toHaveLength(1);
      expect(matchRepository.findByGroup).toHaveBeenCalledWith('A');
    });
  });

  describe('getMatchesByEliminationRound', () => {
    it('should return matches by elimination round', async () => {
      const eliminationMatch = { ...mockMatch, eliminationRound: 'R16' };
      (matchRepository.findByEliminationRound as jest.Mock).mockResolvedValue([
        eliminationMatch,
      ]);

      const result = await service.getMatchesByEliminationRound('R16');

      expect(result).toHaveLength(1);
      expect(matchRepository.findByEliminationRound).toHaveBeenCalledWith('R16');
    });
  });

  describe('getMatchesByDateRange', () => {
    it('should return matches within date range', async () => {
      const startDate = new Date('2026-06-01T00:00:00Z');
      const endDate = new Date('2026-06-30T23:59:59Z');

      (matchRepository.findByDateRange as jest.Mock).mockResolvedValue([
        mockMatch,
      ]);

      const result = await service.getMatchesByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(matchRepository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
    });
  });

  describe('getUpcomingMatches', () => {
    it('should return upcoming matches', async () => {
      const beforeTime = new Date('2026-06-30T23:59:59Z');

      (matchRepository.findUpcomingMatches as jest.Mock).mockResolvedValue([
        mockMatch,
      ]);

      const result = await service.getUpcomingMatches(beforeTime);

      expect(result).toHaveLength(1);
      expect(matchRepository.findUpcomingMatches).toHaveBeenCalledWith(
        beforeTime,
      );
    });
  });

  describe('getCompletedMatches', () => {
    it('should return completed matches', async () => {
      const completedMatch = { ...mockMatch, status: MatchStatus.COMPLETED };
      (matchRepository.findCompletedMatches as jest.Mock).mockResolvedValue([
        completedMatch,
      ]);

      const result = await service.getCompletedMatches();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(MatchStatus.COMPLETED);
    });
  });

  describe('getCompletedMatchesWithoutResult', () => {
    it('should return completed matches without results', async () => {
      const completedMatch = { ...mockMatch, status: MatchStatus.COMPLETED };
      (matchRepository.findCompletedWithoutResult as jest.Mock).mockResolvedValue(
        [completedMatch],
      );

      const result = await service.getCompletedMatchesWithoutResult();

      expect(result).toHaveLength(1);
    });
  });

  describe('getMatchesNearLockdown', () => {
    it('should return matches near lockdown', async () => {
      (matchRepository.findMatchesNearLockdown as jest.Mock).mockResolvedValue([
        mockMatch,
      ]);

      const result = await service.getMatchesNearLockdown(30);

      expect(result).toHaveLength(1);
      expect(matchRepository.findMatchesNearLockdown).toHaveBeenCalledWith(30);
    });

    it('should use default 30 minutes if not specified', async () => {
      (matchRepository.findMatchesNearLockdown as jest.Mock).mockResolvedValue([
        mockMatch,
      ]);

      await service.getMatchesNearLockdown();

      expect(matchRepository.findMatchesNearLockdown).toHaveBeenCalledWith(30);
    });
  });

  describe('updateMatchStatus', () => {
    it('should update match status', async () => {
      (matchRepository.updateStatus as jest.Mock).mockResolvedValue(undefined);
      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockMatch,
        status: MatchStatus.IN_PROGRESS,
      });

      const result = await service.updateMatchStatus(
        'match1',
        MatchStatus.IN_PROGRESS,
      );

      expect(matchRepository.updateStatus).toHaveBeenCalledWith(
        'match1',
        MatchStatus.IN_PROGRESS,
      );
      expect(result.status).toBe(MatchStatus.IN_PROGRESS);
    });
  });

  describe('updateLockdownTime', () => {
    it('should update lockdown time based on new scheduled time', async () => {
      const newScheduledTime = new Date('2026-06-11T16:00:00Z');
      const expectedLockdownTime = new Date('2026-06-11T15:45:00Z');

      (matchRepository.updateLockdownTime as jest.Mock).mockResolvedValue(
        undefined,
      );
      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockMatch,
        scheduledTime: newScheduledTime,
        lockdownTime: expectedLockdownTime,
      });
      (matchRepository.save as jest.Mock).mockResolvedValue({
        ...mockMatch,
        scheduledTime: newScheduledTime,
        lockdownTime: expectedLockdownTime,
      });

      const result = await service.updateLockdownTime('match1', newScheduledTime);

      expect(matchRepository.updateLockdownTime).toHaveBeenCalledWith(
        'match1',
        expectedLockdownTime,
      );
      expect(result.scheduledTime).toEqual(newScheduledTime);
    });
  });

  describe('isMatchLocked', () => {
    it('should return true if match is locked', async () => {
      const pastLockdownTime = new Date(Date.now() - 60000);
      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockMatch,
        lockdownTime: pastLockdownTime,
      });

      const result = await service.isMatchLocked('match1');

      expect(result).toBe(true);
    });

    it('should return false if match is not locked', async () => {
      const futureLockdownTime = new Date(Date.now() + 60000);
      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        ...mockMatch,
        lockdownTime: futureLockdownTime,
      });

      const result = await service.isMatchLocked('match1');

      expect(result).toBe(false);
    });
  });

  describe('getMatchLockdownTime', () => {
    it('should return lockdown time for a match', async () => {
      (matchRepository.findOne as jest.Mock).mockResolvedValue(mockMatch);

      const result = await service.getMatchLockdownTime('match1');

      expect(result).toEqual(mockMatch.lockdownTime);
    });
  });

  describe('countMatchesByPhase', () => {
    it('should count matches by phase', async () => {
      (matchRepository.countByPhase as jest.Mock).mockResolvedValue(72);

      const result = await service.countMatchesByPhase(MatchPhase.GROUP);

      expect(result).toBe(72);
      expect(matchRepository.countByPhase).toHaveBeenCalledWith(MatchPhase.GROUP);
    });
  });

  describe('countMatchesByStatus', () => {
    it('should count matches by status', async () => {
      (matchRepository.countByStatus as jest.Mock).mockResolvedValue(50);

      const result = await service.countMatchesByStatus(MatchStatus.SCHEDULED);

      expect(result).toBe(50);
    });
  });

  describe('validateTournamentStructure', () => {
    it('should validate tournament structure', async () => {
      (matchRepository.countByPhase as jest.Mock)
        .mockResolvedValueOnce(72)
        .mockResolvedValueOnce(32);

      const result = await service.validateTournamentStructure();

      expect(result.groupStageMatches).toBe(72);
      expect(result.eliminationMatches).toBe(32);
      expect(result.totalMatches).toBe(104);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid if group stage count is wrong', async () => {
      (matchRepository.countByPhase as jest.Mock)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(32);

      const result = await service.validateTournamentStructure();

      expect(result.isValid).toBe(false);
    });

    it('should return invalid if elimination count is wrong', async () => {
      (matchRepository.countByPhase as jest.Mock)
        .mockResolvedValueOnce(72)
        .mockResolvedValueOnce(30);

      const result = await service.validateTournamentStructure();

      expect(result.isValid).toBe(false);
    });
  });

  describe('getMatchWithPredictions', () => {
    it('should return match with predictions', async () => {
      const matchWithPredictions = {
        ...mockMatch,
        predictions: [
          {
            id: 'pred1',
            userId: 'user1',
            matchId: 'match1',
            prediction: 'team1',
          },
        ],
      };

      (matchRepository.findWithPredictions as jest.Mock).mockResolvedValue(
        matchWithPredictions,
      );

      const result = await service.getMatchWithPredictions('match1');

      expect(result).toEqual(matchWithPredictions);
      expect(result.predictions).toHaveLength(1);
    });

    it('should throw NotFoundException if match does not exist', async () => {
      (matchRepository.findWithPredictions as jest.Mock).mockResolvedValue(null);

      await expect(service.getMatchWithPredictions('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
