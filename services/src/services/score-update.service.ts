import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchRepository } from '../repositories/match.repository';
import { CacheService } from '../cache/cache.service';
import { LoggerService } from '../common/logger/logger.service';
import { MatchStatus } from '../entities/match.entity';

export interface ScoreUpdate {
  matchId: string;
  team1Score: number;
  team2Score: number;
  timestamp: Date;
}

export interface CachedScore {
  matchId: string;
  team1Score: number;
  team2Score: number;
  timestamp: Date;
  status: MatchStatus;
}

@Injectable()
export class ScoreUpdateService {
  constructor(
    private matchRepository: MatchRepository,
    private cacheService: CacheService,
    private logger: LoggerService,
  ) {}

  /**
   * Ingest a live score update
   * Requirement 17.1: Ingest live score updates
   * Validates match exists and is in_progress
   */
  async ingestScoreUpdate(matchId: string, team1Score: number, team2Score: number): Promise<ScoreUpdate> {
    // Validate match exists
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    // Validate match is in progress
    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Match ${matchId} is not in progress. Current status: ${match.status}`,
      );
    }

    // Validate scores are non-negative integers
    if (!Number.isInteger(team1Score) || !Number.isInteger(team2Score)) {
      throw new BadRequestException('Scores must be integers');
    }

    if (team1Score < 0 || team2Score < 0) {
      throw new BadRequestException('Scores cannot be negative');
    }

    const scoreUpdate: ScoreUpdate = {
      matchId,
      team1Score,
      team2Score,
      timestamp: new Date(),
    };

    // Cache the score update with 2-minute TTL
    await this.cacheMatchScore(matchId, scoreUpdate);

    this.logger.log(
      `Score update ingested for match ${matchId}: ${team1Score}-${team2Score}`,
    );

    return scoreUpdate;
  }

  /**
   * Cache match score in Redis with 2-minute TTL
   * Requirement 17.3: Add score update caching in Redis
   */
  private async cacheMatchScore(matchId: string, scoreUpdate: ScoreUpdate): Promise<void> {
    try {
      const match = await this.matchRepository.findOne({ where: { id: matchId } });
      if (!match) {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }

      const cachedScore: CachedScore = {
        matchId,
        team1Score: scoreUpdate.team1Score,
        team2Score: scoreUpdate.team2Score,
        timestamp: scoreUpdate.timestamp,
        status: match.status,
      };

      await this.cacheService.cacheMatchScores(matchId, cachedScore);
    } catch (error) {
      this.logger.error(`Error caching score for match ${matchId}: ${error}`);
      // Don't throw - caching failure shouldn't block score updates
    }
  }

  /**
   * Get cached score for a match
   * Requirement 17.2: Update displayed score within 30 seconds
   */
  async getCachedScore(matchId: string): Promise<CachedScore | null> {
    try {
      return await this.cacheService.getMatchScores(matchId);
    } catch (error) {
      this.logger.error(`Error retrieving cached score for match ${matchId}: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate cached score for a match
   */
  async invalidateCachedScore(matchId: string): Promise<void> {
    try {
      await this.cacheService.invalidateMatchScores(matchId);
      this.logger.log(`Cached score invalidated for match ${matchId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cached score for match ${matchId}: ${error}`);
    }
  }

  /**
   * Validate that multiple users see consistent score information
   * Requirement 17.5: Ensure consistent score information across multiple users
   */
  async validateScoreConsistency(matchId: string): Promise<boolean> {
    try {
      const cachedScore = await this.getCachedScore(matchId);
      if (!cachedScore) {
        return false;
      }

      // Verify the cached score is recent (within 30 seconds)
      const now = new Date();
      const timeDiff = now.getTime() - cachedScore.timestamp.getTime();
      const thirtySecondsMs = 30 * 1000;

      return timeDiff <= thirtySecondsMs;
    } catch (error) {
      this.logger.error(`Error validating score consistency for match ${matchId}: ${error}`);
      return false;
    }
  }
}
