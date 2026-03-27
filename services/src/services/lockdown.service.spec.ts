import { Test, TestingModule } from '@nestjs/testing';
import { LockdownService } from './lockdown.service';
import { MatchRepository } from '../repositories/match.repository';
import { PredictionRepository } from '../repositories/prediction.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LockdownService', () => {
  let service: LockdownService;
  let matchRepository: MatchRepository;
  let predictionRepository: PredictionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockdownService,
        {
          provide: MatchRepository,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            findMatchesNearLockdown: jest.fn(),
          },
        },
        {
          provide: PredictionRepository,
          useValue: {
            findOne: jest.fn(),
            lockPredictionsByMatch: jest.fn(),
            findLockedPredictions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LockdownService>(LockdownService);
    matchRepository = module.get<MatchRepository>(MatchRepository);
    predictionRepository = module.get<PredictionRepository>(PredictionRepository);
  });

  describe('calculateLockdownTime', () => {
    it('should calculate lockdown as 15 minutes before match start', () => {
      const scheduledTime = new Date('2026-06-11T14:00:00Z');
      const lockdownTime = service.calculateLockdownTime(scheduledTime);

      const expectedLockdown = new Date('2026-06-11T13:45:00Z');
      expect(lockdownTime).toEqual(expectedLockdown);
    });

    it('should handle various dates correctly', () => {
      const testCases = [
        {
          scheduled: new Date('2026-06-11T10:00:00Z'),
          expected: new Date('2026-06-11T09:45:00Z'),
        },
        {
          scheduled: new Date('2026-07-15T20:30:00Z'),
          expected: new Date('2026-07-15T20:15:00Z'),
        },
        {
          scheduled: new Date('2026-08-16T18:00:00Z'),
          expected: new Date('2026-08-16T17:45:00Z'),
        },
      ];

      testCases.forEach(({ scheduled, expected }) => {
        const lockdown = service.calculateLockdownTime(scheduled);
        expect(lockdown).toEqual(expected);
      });
    });

    it('should calculate exactly 15 minutes difference', () => {
      const scheduledTime = new Date('2026-06-11T14:00:00Z');
      const lockdownTime = service.calculateLockdownTime(scheduledTime);

      const differenceMs = scheduledTime.getTime() - lockdownTime.getTime();
      const differenceMinutes = differenceMs / (1000 * 60);

      expect(differenceMinutes).toBe(15);
    });
  });

  describe('isMatchLocked', () => {
    it('should return true if current time is at or after lockdown time', async () => {
      const now = new Date();
      const pastLockdownTime = new Date(now.getTime() - 1000); // 1 second ago

      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'match1',
        lockdownTime: pastLockdownTime,
      });

      const isLocked = await service.isMatchLocked('match1');
      expect(isLocked).toBe(true);
    });

    it('should return false if current time is before lockdown time', async () => {
      const now = new Date();
      const futureLockdownTime = new Date(now.getTime() + 60000); // 1 minute from now

      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'match1',
        lockdownTime: futureLockdownTime,
      });

      const isLocked = await service.isMatchLocked('match1');
      expect(isLocked).toBe(false);
    });

    it('should throw NotFoundException if match does not exist', async () => {
      (matchRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.isMatchLocked('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTimeUntilLockdown', () => {
    it('should return positive value if lockdown is in the future', async () => {
      const now = new Date();
      const futureLockdownTime = new Date(now.getTime() + 60000); // 1 minute from now

      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'match1',
        lockdownTime: futureLockdownTime,
      });

      const timeRemaining = await service.getTimeUntilLockdown('match1');
      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(60000);
    });

    it('should return negative value if lockdown has passed', async () => {
      const now = new Date();
      const pastLockdownTime = new Date(now.getTime() - 60000); // 1 minute ago

      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'match1',
        lockdownTime: pastLockdownTime,
      });

      const timeRemaining = await service.getTimeUntilLockdown('match1');
      expect(timeRemaining).toBeLessThan(0);
    });
  });

  describe('validatePredictionNotLocked', () => {
    it('should not throw if match is not locked', async () => {
      const now = new Date();
      const futureLockdownTime = new Date(now.getTime() + 60000);

      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'match1',
        lockdownTime: futureLockdownTime,
      });

      await expect(
        service.validatePredictionNotLocked('match1'),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if match is locked', async () => {
      const now = new Date();
      const pastLockdownTime = new Date(now.getTime() - 1000);

      (matchRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'match1',
        lockdownTime: pastLockdownTime,
      });

      await expect(service.validatePredictionNotLocked('match1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('isPredictionLocked', () => {
    it('should return true if prediction has lockedTimestamp', async () => {
      (predictionRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'pred1',
        lockedTimestamp: new Date(),
      });

      const isLocked = await service.isPredictionLocked('pred1');
      expect(isLocked).toBe(true);
    });

    it('should return false if prediction has no lockedTimestamp', async () => {
      (predictionRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'pred1',
        lockedTimestamp: null,
      });

      const isLocked = await service.isPredictionLocked('pred1');
      expect(isLocked).toBe(false);
    });

    it('should throw NotFoundException if prediction does not exist', async () => {
      (predictionRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.isPredictionLocked('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validatePredictionCanBeEdited', () => {
    it('should not throw if prediction is not locked', async () => {
      (predictionRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'pred1',
        lockedTimestamp: null,
      });

      await expect(
        service.validatePredictionCanBeEdited('pred1'),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException if prediction is locked', async () => {
      (predictionRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'pred1',
        lockedTimestamp: new Date(),
      });

      await expect(service.validatePredictionCanBeEdited('pred1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('recalculateLockdownTime', () => {
    it('should update match with new lockdown time', async () => {
      const oldScheduledTime = new Date('2026-06-11T14:00:00Z');
      const newScheduledTime = new Date('2026-06-11T16:00:00Z');

      const match = {
        id: 'match1',
        scheduledTime: oldScheduledTime,
        lockdownTime: new Date('2026-06-11T13:45:00Z'),
      };

      (matchRepository.findOne as jest.Mock).mockResolvedValue(match);
      (matchRepository.save as jest.Mock).mockResolvedValue(match);

      const newLockdownTime = await service.recalculateLockdownTime(
        'match1',
        newScheduledTime,
      );

      const expectedLockdownTime = new Date('2026-06-11T15:45:00Z');
      expect(newLockdownTime).toEqual(expectedLockdownTime);
      expect(matchRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if match does not exist', async () => {
      (matchRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recalculateLockdownTime('nonexistent', new Date()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
