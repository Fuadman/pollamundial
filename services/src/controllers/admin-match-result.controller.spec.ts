import { Test, TestingModule } from '@nestjs/testing';
import { AdminMatchResultController } from './admin-match-result.controller';
import { MatchResultService } from '../services/match-result.service';
import { ScoreUpdateService } from '../services/score-update.service';
import { AdminService } from '../auth/services/admin.service';
import { ScoreUpdateGateway } from '../gateways/score-update.gateway';
import { PredictionService } from '../services/prediction.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AdminMatchResultController', () => {
  let controller: AdminMatchResultController;
  let matchResultService: MatchResultService;
  let scoreUpdateService: ScoreUpdateService;
  let adminService: AdminService;
  let scoreUpdateGateway: ScoreUpdateGateway;

  const mockRequest = {
    user: { id: 'admin-user-123' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMatchResultController],
      providers: [
        {
          provide: MatchResultService,
          useValue: {
            publishResult: jest.fn(),
            getResultByMatchId: jest.fn(),
            updateResult: jest.fn(),
            getPendingResults: jest.fn(),
          },
        },
        {
          provide: PredictionService,
          useValue: {
            blockPredictionsForMatch: jest.fn(),
            unblockPredictionsForMatch: jest.fn(),
          },
        },
        {
          provide: ScoreUpdateService,
          useValue: {
            ingestScoreUpdate: jest.fn(),
            getCachedScore: jest.fn(),
          },
        },
        {
          provide: AdminService,
          useValue: {
            enforceAdminAccess: jest.fn(),
          },
        },
        {
          provide: ScoreUpdateGateway,
          useValue: {
            broadcastScoreUpdate: jest.fn(),
            broadcastMatchResult: jest.fn(),
            getConnectedClientsCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminMatchResultController>(
      AdminMatchResultController,
    );
    matchResultService = module.get<MatchResultService>(MatchResultService);
    scoreUpdateService = module.get<ScoreUpdateService>(ScoreUpdateService);
    adminService = module.get<AdminService>(AdminService);
    scoreUpdateGateway = module.get<ScoreUpdateGateway>(ScoreUpdateGateway);
  });

  describe('getPendingResults', () => {
    it('should return pending results for admin', async () => {
      const pendingResults = [
        {
          matchId: 'match-1',
          team1: { id: 'team1', name: 'Team 1' },
          team2: { id: 'team2', name: 'Team 2' },
          scheduledTime: new Date(),
          status: 'completed',
        },
      ];

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(matchResultService, 'getPendingResults')
        .mockResolvedValue(pendingResults);

      const result = await controller.getPendingResults(mockRequest);

      expect(result).toEqual(pendingResults);
      expect(adminService.enforceAdminAccess).toHaveBeenCalledWith(
        mockRequest.user.id,
      );
    });

    it('should throw error if user is not admin', async () => {
      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockRejectedValue(new Error('Not admin'));

      await expect(controller.getPendingResults(mockRequest)).rejects.toThrow();
    });
  });

  describe('publishResult', () => {
    it('should publish result', async () => {
      const matchId = 'match-123';
      const dto = { team1Score: 2, team2Score: 1 };
      const publishedResult = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(matchResultService, 'publishResult')
        .mockResolvedValue(publishedResult as any);
      const result = await controller.publishResult(matchId, dto, mockRequest);

      expect(result).toBeDefined();
      expect(result.team1Score).toBe(2);
      expect(result.team2Score).toBe(1);
      expect(matchResultService.publishResult).toHaveBeenCalledWith(
        matchId,
        2,
        1,
        undefined,
        undefined,
        mockRequest.user.id,
      );
    });

    it('should validate score format', async () => {
      const matchId = 'match-123';
      const invalidDto = { team1Score: 'invalid', team2Score: 1 };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);

      await expect(
        controller.publishResult(matchId, invalidDto as any, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return published result when subscriber side effects are async', async () => {
      const matchId = 'match-123';
      const dto = { team1Score: 2, team2Score: 1 };
      const publishedResult = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(matchResultService, 'publishResult')
        .mockResolvedValue(publishedResult as any);
      const result = await controller.publishResult(matchId, dto, mockRequest);

      expect(result).toBeDefined();
    });

    it('should throw error if user is not admin', async () => {
      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockRejectedValue(new Error('Not admin'));

      await expect(
        controller.publishResult('match-123', { team1Score: 2, team2Score: 1 }, mockRequest),
      ).rejects.toThrow();
    });
  });

  describe('getResult', () => {
    it('should return published result for admin', async () => {
      const matchId = 'match-123';
      const result = {
        id: 'result-123',
        matchId,
        team1Score: 2,
        team2Score: 1,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(matchResultService, 'getResultByMatchId')
        .mockResolvedValue(result as any);

      const retrieved = await controller.getResult(matchId, mockRequest);

      expect(retrieved).toEqual(result);
    });

    it('should throw error if result not found', async () => {
      const matchId = 'match-123';

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(matchResultService, 'getResultByMatchId')
        .mockResolvedValue(null);

      await expect(controller.getResult(matchId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('editResult', () => {
    it('should edit result', async () => {
      const matchId = 'match-123';
      const dto = { team1Score: 3, team2Score: 0 };
      const updatedResult = {
        id: 'result-123',
        matchId,
        team1Score: 3,
        team2Score: 0,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(matchResultService, 'updateResult')
        .mockResolvedValue(updatedResult as any);
      const result = await controller.editResult(matchId, dto, mockRequest);

      expect(result).toBeDefined();
      expect(result.team1Score).toBe(3);
      expect(result.team2Score).toBe(0);
      expect(matchResultService.updateResult).toHaveBeenCalledWith(
        matchId,
        3,
        0,
        undefined,
        undefined,
        mockRequest.user.id,
      );
    });

    it('should validate score format on edit', async () => {
      const matchId = 'match-123';
      const invalidDto = { team1Score: 'invalid', team2Score: 1 };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);

      await expect(
        controller.editResult(matchId, invalidDto as any, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return edited result when subscriber side effects are async', async () => {
      const matchId = 'match-123';
      const dto = { team1Score: 3, team2Score: 0 };
      const updatedResult = {
        id: 'result-123',
        matchId,
        team1Score: 3,
        team2Score: 0,
        winnerId: 'team1',
        isDraw: false,
        publishedTimestamp: new Date(),
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(matchResultService, 'updateResult')
        .mockResolvedValue(updatedResult as any);
      const result = await controller.editResult(matchId, dto, mockRequest);

      expect(result).toBeDefined();
    });
  });

  describe('ingestScoreUpdate', () => {
    it('should ingest score update, auto-publish result and broadcast score update', async () => {
      const matchId = 'match-123';
      const dto = { team1Score: 2, team2Score: 1 };
      const scoreUpdate = {
        matchId,
        team1Score: 2,
        team2Score: 1,
        timestamp: new Date(),
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(scoreUpdateService, 'ingestScoreUpdate')
        .mockResolvedValue(scoreUpdate);
      jest
        .spyOn(matchResultService, 'getResultByMatchId')
        .mockResolvedValue(null);
      jest
        .spyOn(matchResultService, 'publishResult')
        .mockResolvedValue({ id: 'result-1' } as any);
      jest
        .spyOn(scoreUpdateGateway, 'broadcastScoreUpdate')
        .mockReturnValue(undefined);
      jest
        .spyOn(scoreUpdateGateway, 'broadcastMatchResult')
        .mockReturnValue(undefined);
      jest
        .spyOn(scoreUpdateGateway, 'getConnectedClientsCount')
        .mockReturnValue(5);

      const result = await controller.ingestScoreUpdate(matchId, dto, mockRequest);

      expect(result).toBeDefined();
      expect(result.team1Score).toBe(2);
      expect(result.team2Score).toBe(1);
      expect(result.connectedClients).toBe(5);
      expect(scoreUpdateService.ingestScoreUpdate).toHaveBeenCalledWith(
        matchId,
        2,
        1,
      );
      expect(scoreUpdateGateway.broadcastScoreUpdate).toHaveBeenCalled();
      expect(matchResultService.publishResult).toHaveBeenCalledWith(
        matchId,
        2,
        1,
        undefined,
        undefined,
        mockRequest.user.id,
      );
      expect(scoreUpdateGateway.broadcastMatchResult).not.toHaveBeenCalled();
    });

    it('should ingest score update and auto-update existing result', async () => {
      const matchId = 'match-123';
      const dto = { team1Score: 2, team2Score: 1 };
      const scoreUpdate = {
        matchId,
        team1Score: 2,
        team2Score: 1,
        timestamp: new Date(),
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(scoreUpdateService, 'ingestScoreUpdate')
        .mockResolvedValue(scoreUpdate);
      jest
        .spyOn(matchResultService, 'getResultByMatchId')
        .mockResolvedValue({ id: 'result-123' } as any);
      jest
        .spyOn(matchResultService, 'updateResult')
        .mockResolvedValue({ id: 'result-123' } as any);
      jest
        .spyOn(scoreUpdateGateway, 'broadcastScoreUpdate')
        .mockReturnValue(undefined);
      jest
        .spyOn(scoreUpdateGateway, 'broadcastMatchResult')
        .mockReturnValue(undefined);
      jest
        .spyOn(scoreUpdateGateway, 'getConnectedClientsCount')
        .mockReturnValue(2);

      await controller.ingestScoreUpdate(matchId, dto, mockRequest);

      expect(matchResultService.updateResult).toHaveBeenCalledWith(
        matchId,
        2,
        1,
        undefined,
        undefined,
        mockRequest.user.id,
      );
      expect(scoreUpdateGateway.broadcastMatchResult).not.toHaveBeenCalled();
    });

    it('should validate score format for score update', async () => {
      const matchId = 'match-123';
      const invalidDto = { team1Score: 'invalid', team2Score: 1 };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);

      await expect(
        controller.ingestScoreUpdate(matchId, invalidDto as any, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if user is not admin for score update', async () => {
      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockRejectedValue(new Error('Not admin'));

      await expect(
        controller.ingestScoreUpdate('match-123', { team1Score: 2, team2Score: 1 }, mockRequest),
      ).rejects.toThrow();
    });
  });

  describe('getCurrentScore', () => {
    it('should return current cached score', async () => {
      const matchId = 'match-123';
      const cachedScore = {
        matchId,
        team1Score: 2,
        team2Score: 1,
        timestamp: new Date(),
        status: 'in_progress',
      };

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(scoreUpdateService, 'getCachedScore')
        .mockResolvedValue(cachedScore as any);

      const result = await controller.getCurrentScore(matchId, mockRequest);

      expect(result).toEqual(cachedScore);
      expect(scoreUpdateService.getCachedScore).toHaveBeenCalledWith(matchId);
    });

    it('should throw error if no cached score found', async () => {
      const matchId = 'match-123';

      jest
        .spyOn(adminService, 'enforceAdminAccess')
        .mockResolvedValue({ role: 'admin' } as any);
      jest
        .spyOn(scoreUpdateService, 'getCachedScore')
        .mockResolvedValue(null);

      await expect(controller.getCurrentScore(matchId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
