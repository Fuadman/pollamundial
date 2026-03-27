import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SeedingService } from './seeding.service';
import { Team } from '../entities/team.entity';
import { Match, MatchPhase, MatchStatus } from '../entities/match.entity';

describe('SeedingService', () => {
  let service: SeedingService;
  let mockDataSource: Partial<DataSource>;
  let mockTeamRepository: any;
  let mockMatchRepository: any;

  beforeEach(async () => {
    mockTeamRepository = {
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockImplementation((team) => Promise.resolve(team)),
    };

    mockMatchRepository = {
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockImplementation((match) => Promise.resolve(match)),
    };

    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === Team) return mockTeamRepository;
        if (entity === Match) return mockMatchRepository;
        return {};
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedingService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SeedingService>(SeedingService);
  });

  describe('seedCopaMundial2026', () => {
    it('should create 32 teams', async () => {
      mockTeamRepository.count.mockResolvedValueOnce(0);
      mockMatchRepository.count.mockResolvedValueOnce(48);

      const result = await service.seedCopaMundial2026();

      expect(mockTeamRepository.save).toHaveBeenCalledTimes(32);
      expect(result.teamsCreated).toBe(32);
    });

    it('should create 48 group stage matches (6 per group)', async () => {
      mockTeamRepository.count.mockResolvedValueOnce(0);
      mockMatchRepository.count.mockResolvedValueOnce(48);

      const result = await service.seedCopaMundial2026();

      expect(mockMatchRepository.save).toHaveBeenCalledTimes(48);
      expect(result.matchesCreated).toBe(48);
    });

    it('should skip seeding if teams already exist', async () => {
      mockTeamRepository.count.mockResolvedValueOnce(32);

      const result = await service.seedCopaMundial2026();

      expect(mockTeamRepository.save).not.toHaveBeenCalled();
      expect(result.teamsCreated).toBe(0);
      expect(result.matchesCreated).toBe(0);
    });

    it('should create teams with correct group assignments', async () => {
      mockTeamRepository.count.mockResolvedValueOnce(0);
      mockMatchRepository.count.mockResolvedValueOnce(48);

      await service.seedCopaMundial2026();

      const teamCalls = mockTeamRepository.save.mock.calls;
      const groupATeams = teamCalls.filter(
        (call: any) => call[0].groupStageGroup === 'A',
      );
      const groupBTeams = teamCalls.filter(
        (call: any) => call[0].groupStageGroup === 'B',
      );

      expect(groupATeams.length).toBe(4);
      expect(groupBTeams.length).toBe(4);
    });

    it('should create matches with correct phase', async () => {
      mockTeamRepository.count.mockResolvedValueOnce(0);
      mockMatchRepository.count.mockResolvedValueOnce(48);

      await service.seedCopaMundial2026();

      const matchCalls = mockMatchRepository.save.mock.calls;
      matchCalls.forEach((call: any) => {
        expect(call[0].phase).toBe(MatchPhase.GROUP);
        expect(call[0].status).toBe(MatchStatus.SCHEDULED);
      });
    });

    it('should set lockdown time 15 minutes before scheduled time', async () => {
      mockTeamRepository.count.mockResolvedValueOnce(0);
      mockMatchRepository.count.mockResolvedValueOnce(48);

      await service.seedCopaMundial2026();

      const matchCalls = mockMatchRepository.save.mock.calls;
      matchCalls.forEach((call: any) => {
        const match = call[0];
        const expectedLockdown = new Date(
          match.scheduledTime.getTime() - 15 * 60 * 1000,
        );
        expect(match.lockdownTime.getTime()).toBe(expectedLockdown.getTime());
      });
    });

    it('should schedule matches starting from June 1, 2026', async () => {
      mockTeamRepository.count.mockResolvedValueOnce(0);
      mockMatchRepository.count.mockResolvedValueOnce(48);

      await service.seedCopaMundial2026();

      const matchCalls = mockMatchRepository.save.mock.calls;
      const firstMatch = matchCalls[0][0];
      const firstMatchDate = new Date(firstMatch.scheduledTime);

      expect(firstMatchDate.getUTCFullYear()).toBe(2026);
      expect(firstMatchDate.getUTCMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(firstMatchDate.getUTCDate()).toBe(1);
    });
  });
});
