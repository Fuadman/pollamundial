import { Test, TestingModule } from '@nestjs/testing';
import { MatchResultService } from './match-result.service';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { MatchRepository } from '../repositories/match.repository';
import { TeamRepository } from '../repositories/team.repository';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchStatus } from '../entities/match.entity';
import { MatchPhase } from '../entities/match.entity';

describe('MatchResultService', () => {
  let service: MatchResultService;
  let matchResultRepository: MatchResultRepository;
  let matchRepository: MatchRepository;
  let teamRepository: TeamRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchResultService,
        {
          provide: MatchResultRepository,
          useValue: {
            findByMatchId: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            existsForMatch: jest.fn(),
          },
        },
        {
          provide: MatchRepository,
          useValue: {
            findOne: jest.fn(),
            updateStatus: jest.fn(),
            findCompletedWithoutResult: jest.fn(),
            findWithoutResult: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: TeamRepository,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MatchResultService>(MatchResultService);
    matchResultRepository = module.get<MatchResultRepository>(
      MatchResultRepository,
    );
    matchRepository = module.get<MatchRepository>(MatchRepository);
    teamRepository = module.get<TeamRepository>(TeamRepository);
  });

  describe('publishResult', () => {
    it('should publish result with valid scores', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
        status: MatchStatus.SCHEDULED,
        phase: MatchPhase.GROUP,
      };

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);
      jest.spyOn(matchResultRepository, 'create').mockReturnValue({
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      } as any);
      jest.spyOn(matchResultRepository, 'save').mockResolvedValue({
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      } as any);
      jest.spyOn(matchRepository, 'updateStatus').mockResolvedValue(undefined);

      const result = await service.publishResult(matchId, 2, 1);

      expect(result).toBeDefined();
      expect(result.team1Score).toBe(2);
      expect(result.team2Score).toBe(1);
      expect(result.winnerId).toBe('team1');
      expect(result.isDraw).toBe(false);
      expect(matchRepository.updateStatus).toHaveBeenCalledWith(
        matchId,
        MatchStatus.COMPLETED,
      );
    });

    it('should publish draw result correctly', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
        status: MatchStatus.SCHEDULED,
        phase: MatchPhase.GROUP,
      };

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);
      jest.spyOn(matchResultRepository, 'create').mockReturnValue({
        id: 'result-123',
        matchId,
        team1Score: 1,
        team2Score: 1,
        winnerId: null,
        isDraw: true,
        publishedTimestamp: new Date(),
      } as any);
      jest.spyOn(matchResultRepository, 'save').mockResolvedValue({
        id: 'result-123',
        matchId,
        team1Score: 1,
        team2Score: 1,
        winnerId: null,
        isDraw: true,
        publishedTimestamp: new Date(),
      } as any);

      const result = await service.publishResult(matchId, 1, 1);

      expect(result.isDraw).toBe(true);
      expect(result.winnerId).toBeNull();
    });

    it('should throw error if match not found', async () => {
      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(null);

      await expect(service.publishResult('invalid-id', 2, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent duplicate result publication', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
      };
      const existingResult = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
      };

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest
        .spyOn(matchResultRepository, 'findByMatchId')
        .mockResolvedValue(existingResult as any);

      await expect(service.publishResult(matchId, 2, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate score format - negative scores', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
      };

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);

      await expect(service.publishResult(matchId, -1, 2)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publishResult(matchId, 2, -1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate score format - non-integer scores', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
      };

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);

      await expect(
        service.publishResult(matchId, 2.5, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record published timestamp', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
      };
      const beforePublish = new Date();

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);

      const mockResult = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      };

      jest.spyOn(matchResultRepository, 'create').mockReturnValue(mockResult as any);
      jest.spyOn(matchResultRepository, 'save').mockResolvedValue(mockResult as any);

      const result = await service.publishResult(matchId, 2, 1);

      expect(result.publishedTimestamp).toBeDefined();
      expect(result.publishedTimestamp.getTime()).toBeGreaterThanOrEqual(
        beforePublish.getTime(),
      );
    });

    it('should require penalties for drawn elimination match', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
        phase: MatchPhase.ELIMINATION,
      };

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);

      await expect(service.publishResult(matchId, 1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should publish elimination draw with penalty winner', async () => {
      const matchId = 'match-123';
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
        phase: MatchPhase.ELIMINATION,
      };

      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);
      jest.spyOn(matchResultRepository, 'create').mockReturnValue({
        id: 'result-123',
        matchId,
        team1Score: 1,
        team2Score: 1,
        team1PenaltyScore: 5,
        team2PenaltyScore: 4,
        winnerId: 'team1',
        isDraw: true,
        decidedByPenalties: true,
        publishedTimestamp: new Date(),
      } as any);
      jest.spyOn(matchResultRepository, 'save').mockResolvedValue({
        id: 'result-123',
        matchId,
        team1Score: 1,
        team2Score: 1,
        team1PenaltyScore: 5,
        team2PenaltyScore: 4,
        winnerId: 'team1',
        isDraw: true,
        decidedByPenalties: true,
        publishedTimestamp: new Date(),
      } as any);

      const result = await service.publishResult(matchId, 1, 1, 5, 4);

      expect(result.winnerId).toBe('team1');
      expect(result.decidedByPenalties).toBe(true);
      expect(result.team1PenaltyScore).toBe(5);
      expect(result.team2PenaltyScore).toBe(4);
    });
  });

  describe('updateResult', () => {
    it('should update result with new scores', async () => {
      const matchId = 'match-123';
      const existingResult = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
      };
      const match = {
        id: matchId,
        team1Id: 'team1',
        team2Id: 'team2',
      };

      jest
        .spyOn(matchResultRepository, 'findByMatchId')
        .mockResolvedValue(existingResult as any);
      jest.spyOn(matchRepository, 'findOne').mockResolvedValue(match as any);
      jest.spyOn(matchResultRepository, 'save').mockResolvedValue({
        ...existingResult,
        team1Score: 3,
        team2Score: 0,
      } as any);

      const result = await service.updateResult(matchId, 3, 0);

      expect(result.team1Score).toBe(3);
      expect(result.team2Score).toBe(0);
    });

    it('should throw error if result not found', async () => {
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);

      await expect(service.updateResult('invalid-id', 2, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate score format on update', async () => {
      const matchId = 'match-123';
      const existingResult = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
      };

      jest
        .spyOn(matchResultRepository, 'findByMatchId')
        .mockResolvedValue(existingResult as any);

      await expect(service.updateResult(matchId, -1, 2)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPendingResults', () => {
    it('should return matches for admin result management', async () => {
      const matches = [
        {
          id: 'match-1',
          team1: { id: 'team1', name: 'Team 1' },
          team2: { id: 'team2', name: 'Team 2' },
          scheduledTime: new Date(),
          status: MatchStatus.COMPLETED,
          phase: 'group',
          groupStageGroup: 'A',
          eliminationRound: null,
          result: {
            id: 'result-1',
            team1Score: 2,
            team2Score: 1,
            team1PenaltyScore: null,
            team2PenaltyScore: null,
            publishedTimestamp: new Date(),
          },
        },
      ];

      jest.spyOn(matchRepository, 'find').mockResolvedValue(matches as any);

      const pending = await service.getPendingResults();

      expect(pending).toHaveLength(1);
      expect(pending[0].matchId).toBe('match-1');
      expect(pending[0].team1).toBeDefined();
      expect(pending[0].team2).toBeDefined();
      expect(pending[0].result).toBeDefined();
    });

    it('should return empty array when there are no matches', async () => {
      jest.spyOn(matchRepository, 'find').mockResolvedValue([]);

      const pending = await service.getPendingResults();

      expect(pending).toHaveLength(0);
    });
  });

  describe('getResultByMatchId', () => {
    it('should return result for valid match ID', async () => {
      const matchId = 'match-123';
      const result = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
      };

      jest
        .spyOn(matchResultRepository, 'findByMatchId')
        .mockResolvedValue(result as any);

      const retrieved = await service.getResultByMatchId(matchId);

      expect(retrieved).toEqual(result);
    });

    it('should return null if result not found', async () => {
      jest.spyOn(matchResultRepository, 'findByMatchId').mockResolvedValue(null);

      const retrieved = await service.getResultByMatchId('invalid-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('resultExists', () => {
    it('should return true if result exists', async () => {
      jest
        .spyOn(matchResultRepository, 'existsForMatch')
        .mockResolvedValue(true);

      const exists = await service.resultExists('match-123');

      expect(exists).toBe(true);
    });

    it('should return false if result does not exist', async () => {
      jest
        .spyOn(matchResultRepository, 'existsForMatch')
        .mockResolvedValue(false);

      const exists = await service.resultExists('invalid-id');

      expect(exists).toBe(false);
    });
  });
});
