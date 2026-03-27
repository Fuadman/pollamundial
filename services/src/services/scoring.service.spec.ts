import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { PredictionRepository } from '../repositories/prediction.repository';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { UserScoreRepository } from '../repositories/user-score.repository';
import { MatchRepository } from '../repositories/match.repository';
import { DataSource } from 'typeorm';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        {
          provide: PredictionRepository,
          useValue: {
            findByMatchId: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: MatchResultRepository,
          useValue: {
            findByMatchId: jest.fn(),
          },
        },
        {
          provide: UserScoreRepository,
          useValue: {},
        },
        {
          provide: MatchRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  describe('calculateScore', () => {
    it('should award 3 points for exact score match', () => {
      const prediction = {
        predictedTeam1Score: 2,
        predictedTeam2Score: 1,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.exactScore).toBe(true);
      expect(breakdown.totalPoints).toBe(3);
    });

    it('should not award 3 points for non-exact score', () => {
      const prediction = {
        predictedTeam1Score: 2,
        predictedTeam2Score: 0,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.exactScore).toBe(false);
      expect(breakdown.totalPoints).not.toBe(3);
    });

    it('should award 2 points for correct winner with correct goal difference', () => {
      const prediction = {
        predictedTeam1Score: 3,
        predictedTeam2Score: 1,
        predictedWinnerId: null,
        predictedDraw: false,
        match: { team1Id: 'team1', team2Id: 'team2' },
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 0,
        winnerId: 'team1',
        isDraw: false,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.correctWinnerWithDifference).toBe(true);
      expect(breakdown.totalPoints).toBe(2);
    });

    it('should award 1 point for correct winner', () => {
      const prediction = {
        predictedTeam1Score: 5,
        predictedTeam2Score: 0,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 0,
        winnerId: 'team1',
        isDraw: false,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.correctWinnerOrDraw).toBe(true);
      expect(breakdown.totalPoints).toBe(1);
    });

    it('should award 1 point for correct draw', () => {
      const prediction = {
        predictedTeam1Score: 1,
        predictedTeam2Score: 1,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 2,
        winnerId: null,
        isDraw: true,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.correctWinnerOrDraw).toBe(true);
      expect(breakdown.totalPoints).toBe(1);
    });

    it('should not award points for incorrect prediction', () => {
      const prediction = {
        predictedTeam1Score: 0,
        predictedTeam2Score: 5,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 0,
        winnerId: 'team1',
        isDraw: false,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.totalPoints).toBe(0);
    });

    it('should not double-count when exact score is achieved', () => {
      const prediction = {
        predictedTeam1Score: 2,
        predictedTeam2Score: 1,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.totalPoints).toBe(3);
      expect(breakdown.exactScore).toBe(true);
      expect(breakdown.correctWinnerWithDifference).toBe(false);
      expect(breakdown.correctWinnerOrDraw).toBe(false);
    });

    it('should handle zero scores correctly', () => {
      const prediction = {
        predictedTeam1Score: 0,
        predictedTeam2Score: 0,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 0,
        team2Score: 0,
        winnerId: null,
        isDraw: true,
      } as any;

      const breakdown = service.calculateScore(prediction, result);
      expect(breakdown.exactScore).toBe(true);
      expect(breakdown.totalPoints).toBe(3);
    });
  });

  describe('validateScoringRules', () => {
    it('should return same result as calculateScore', () => {
      const prediction = {
        predictedTeam1Score: 2,
        predictedTeam2Score: 1,
        predictedWinnerId: null,
        predictedDraw: false,
      } as any;

      const result = {
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
      } as any;

      const breakdown1 = service.calculateScore(prediction, result);
      const breakdown2 = service.validateScoringRules(prediction, result);

      expect(breakdown1).toEqual(breakdown2);
    });
  });
});
