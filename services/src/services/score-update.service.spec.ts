import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ScoreUpdateService } from './score-update.service';
import { MatchRepository } from '../repositories/match.repository';
import { CacheService } from '../cache/cache.service';
import { LoggerService } from '../common/logger/logger.service';
import { MatchStatus } from '../entities/match.entity';
import { v4 as uuid } from 'uuid';

describe('ScoreUpdateService', () => {
  let service: ScoreUpdateService;
  let matchRepository: jest.Mocked<MatchRepository>;
  let cacheService: jest.Mocked<CacheService>;
  let logger: jest.Mocked<LoggerService>;

  const mockMatchId = uuid();
  const mockMatch = {
    id: mockMatchId,
    team1Id: uuid(),
    team2Id: uuid(),
    status: MatchStatus.IN_PROGRESS,
    scheduledTime: new Date(),
    lockdownTime: new Date(),
    phase: 'group' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreUpdateService,
        {
          provide: MatchRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            cacheMatchScores: jest.fn(),
            getMatchScores: jest.fn(),
            invalidateMatchScores: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScoreUpdateService>(ScoreUpdateService);
    matchRepository = module.get(MatchRepository) as jest.Mocked<MatchRepository>;
    cacheService = module.get(CacheService) as jest.Mocked<CacheService>;
    logger = module.get(LoggerService) as jest.Mocked<LoggerService>;
  });

  describe('ingestScoreUpdate', () => {
    it('should ingest a valid score update', async () => {
      matchRepository.findOne.mockResolvedValue(mockMatch as any);
      cacheService.cacheMatchScores.mockResolvedValue(undefined);

      const result = await service.ingestScoreUpdate(mockMatchId, 2, 1);

      expect(result.matchId).toBe(mockMatchId);
      expect(result.team1Score).toBe(2);
      expect(result.team2Score).toBe(1);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(cacheService.cacheMatchScores).toHaveBeenCalled();
    });

    it('should throw NotFoundException if match does not exist', async () => {
      matchRepository.findOne.mockResolvedValue(null);

      await expect(service.ingestScoreUpdate(mockMatchId, 2, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if match is not in progress', async () => {
      const completedMatch = { ...mockMatch, status: MatchStatus.COMPLETED };
      matchRepository.findOne.mockResolvedValue(completedMatch as any);

      await expect(service.ingestScoreUpdate(mockMatchId, 2, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if scores are not integers', async () => {
      matchRepository.findOne.mockResolvedValue(mockMatch as any);

      await expect(service.ingestScoreUpdate(mockMatchId, 2.5, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if scores are negative', async () => {
      matchRepository.findOne.mockResolvedValue(mockMatch as any);

      await expect(service.ingestScoreUpdate(mockMatchId, -1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle zero scores', async () => {
      matchRepository.findOne.mockResolvedValue(mockMatch as any);
      cacheService.cacheMatchScores.mockResolvedValue(undefined);

      const result = await service.ingestScoreUpdate(mockMatchId, 0, 0);

      expect(result.team1Score).toBe(0);
      expect(result.team2Score).toBe(0);
    });

    it('should handle high scores', async () => {
      matchRepository.findOne.mockResolvedValue(mockMatch as any);
      cacheService.cacheMatchScores.mockResolvedValue(undefined);

      const result = await service.ingestScoreUpdate(mockMatchId, 5, 4);

      expect(result.team1Score).toBe(5);
      expect(result.team2Score).toBe(4);
    });
  });

  describe('getCachedScore', () => {
    it('should retrieve cached score', async () => {
      const cachedScore = {
        matchId: mockMatchId,
        team1Score: 2,
        team2Score: 1,
        timestamp: new Date(),
        status: MatchStatus.IN_PROGRESS,
      };
      cacheService.getMatchScores.mockResolvedValue(cachedScore);

      const result = await service.getCachedScore(mockMatchId);

      expect(result).toEqual(cachedScore);
    });

    it('should return null if no cached score exists', async () => {
      cacheService.getMatchScores.mockResolvedValue(null);

      const result = await service.getCachedScore(mockMatchId);

      expect(result).toBeNull();
    });

    it('should handle cache retrieval errors gracefully', async () => {
      cacheService.getMatchScores.mockRejectedValue(new Error('Cache error'));

      const result = await service.getCachedScore(mockMatchId);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('invalidateCachedScore', () => {
    it('should invalidate cached score', async () => {
      cacheService.invalidateMatchScores.mockResolvedValue(undefined);

      await service.invalidateCachedScore(mockMatchId);

      expect(cacheService.invalidateMatchScores).toHaveBeenCalledWith(mockMatchId);
      expect(logger.log).toHaveBeenCalled();
    });

    it('should handle invalidation errors gracefully', async () => {
      cacheService.invalidateMatchScores.mockRejectedValue(new Error('Cache error'));

      await service.invalidateCachedScore(mockMatchId);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('validateScoreConsistency', () => {
    it('should return true if score is recent', async () => {
      const recentTimestamp = new Date(Date.now() - 10 * 1000); // 10 seconds ago
      const cachedScore = {
        matchId: mockMatchId,
        team1Score: 2,
        team2Score: 1,
        timestamp: recentTimestamp,
        status: MatchStatus.IN_PROGRESS,
      };
      cacheService.getMatchScores.mockResolvedValue(cachedScore);

      const result = await service.validateScoreConsistency(mockMatchId);

      expect(result).toBe(true);
    });

    it('should return false if score is older than 30 seconds', async () => {
      const oldTimestamp = new Date(Date.now() - 35 * 1000); // 35 seconds ago
      const cachedScore = {
        matchId: mockMatchId,
        team1Score: 2,
        team2Score: 1,
        timestamp: oldTimestamp,
        status: MatchStatus.IN_PROGRESS,
      };
      cacheService.getMatchScores.mockResolvedValue(cachedScore);

      const result = await service.validateScoreConsistency(mockMatchId);

      expect(result).toBe(false);
    });

    it('should return false if no cached score exists', async () => {
      cacheService.getMatchScores.mockResolvedValue(null);

      const result = await service.validateScoreConsistency(mockMatchId);

      expect(result).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      cacheService.getMatchScores.mockRejectedValue(new Error('Cache error'));

      const result = await service.validateScoreConsistency(mockMatchId);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
