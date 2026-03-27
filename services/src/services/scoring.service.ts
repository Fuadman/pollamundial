import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PredictionRepository } from '../repositories/prediction.repository';
import { MatchResultRepository } from '../repositories/match-result.repository';
import { UserScoreRepository } from '../repositories/user-score.repository';
import { MatchRepository } from '../repositories/match.repository';
import { Prediction } from '../entities/prediction.entity';
import { MatchResult } from '../entities/match-result.entity';
import { MatchPhase } from '../entities/match.entity';

export interface ScoringBreakdown {
  exactScore: boolean; // 3 points
  correctWinnerWithDifference: boolean; // 2 points
  correctWinnerOrDraw: boolean; // 1 point
  totalPoints: number;
  advancement?: boolean; // 1 point for elimination
}

@Injectable()
export class ScoringService {
  constructor(
    private predictionRepository: PredictionRepository,
    private matchResultRepository: MatchResultRepository,
    private userScoreRepository: UserScoreRepository,
    private matchRepository: MatchRepository,
    private dataSource: DataSource,
  ) {}

  /**
   * Calculate score for a single prediction based on match result
   * Implements multi-tier scoring with no double-counting:
   * - 3 points for exact score
   * - 2 points for correct winner + goal difference
   * - 1 point for correct winner or draw
   * 
   * Property 28: Exact score awards 3 points
   * Property 29: Non-exact predictions don't earn 3 points
   * Property 32: Winner with correct difference awards 2 points
   * Property 36: Correct winner awards 1 point
   * Property 39: No double-counting for exact scores
   */
  calculateScore(prediction: Prediction, result: MatchResult): ScoringBreakdown {
    const breakdown: ScoringBreakdown = {
      exactScore: false,
      correctWinnerWithDifference: false,
      correctWinnerOrDraw: false,
      totalPoints: 0,
    };

    // Check exact score (3 points) - highest priority
    if (
      prediction.predictedTeam1Score !== null &&
      prediction.predictedTeam2Score !== null &&
      prediction.predictedTeam1Score === result.team1Score &&
      prediction.predictedTeam2Score === result.team2Score
    ) {
      breakdown.exactScore = true;
      breakdown.totalPoints = 3;
      return breakdown; // No further scoring if exact match (no double-counting)
    }

    // Determine actual winner/draw
    const actualWinner =
      result.team1Score > result.team2Score
        ? 'team1'
        : result.team2Score > result.team1Score
          ? 'team2'
          : 'draw';

    // Determine predicted winner/draw
    let predictedWinner: string | null = null;

    if (prediction.predictedDraw) {
      predictedWinner = 'draw';
    } else if (prediction.predictedWinnerId) {
      // Determine if predicted winner is team1 or team2
      const match = prediction.match || { team1Id: '', team2Id: '' };
      predictedWinner =
        prediction.predictedWinnerId === match.team1Id ? 'team1' : 'team2';
    } else if (
      prediction.predictedTeam1Score !== null &&
      prediction.predictedTeam2Score !== null
    ) {
      // Infer winner from predicted score
      predictedWinner =
        prediction.predictedTeam1Score > prediction.predictedTeam2Score
          ? 'team1'
          : prediction.predictedTeam2Score > prediction.predictedTeam1Score
            ? 'team2'
            : 'draw';
    }

    // Check correct winner with goal difference (2 points)
    if (predictedWinner === actualWinner && predictedWinner !== 'draw') {
      const actualDifference = Math.abs(
        result.team1Score - result.team2Score,
      );
      let predictedDifference: number | null = null;

      if (
        prediction.predictedTeam1Score !== null &&
        prediction.predictedTeam2Score !== null
      ) {
        predictedDifference = Math.abs(
          prediction.predictedTeam1Score - prediction.predictedTeam2Score,
        );
      }

      if (predictedDifference === actualDifference) {
        breakdown.correctWinnerWithDifference = true;
        breakdown.totalPoints = 2;
        return breakdown; // No further scoring (no double-counting)
      }
    }

    // Check correct winner or draw (1 point)
    if (predictedWinner === actualWinner) {
      breakdown.correctWinnerOrDraw = true;
      breakdown.totalPoints = 1;
    }

    return breakdown;
  }

  /**
   * Calculate scores for all predictions on a match
   * Uses database transaction to ensure atomicity
   * 
   * Property 48: Score calculation applies correct point values
   * Property 49: Prediction persistence before confirmation
   * Property 50: Result persistence before leaderboard update
   * Property 51: Score updates persist to database
   */
  async calculateAllScoresForMatch(matchId: string): Promise<number> {
    // Validate match and result exist
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const result = await this.matchResultRepository.findByMatchId(matchId);
    if (!result) {
      throw new BadRequestException(
        `No result published for match ${matchId}`,
      );
    }

    // Get all predictions for this match
    const predictions = await this.predictionRepository.findByMatchId(matchId);

    if (predictions.length === 0) {
      return 0;
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let updatedCount = 0;

      for (const prediction of predictions) {
        const breakdown = this.calculateScore(prediction, result);

        // Update prediction with points
        await queryRunner.manager.update(
          Prediction,
          { id: prediction.id },
          { pointsEarned: breakdown.totalPoints },
        );

        // Update user score using increment
        if (match.phase === MatchPhase.GROUP) {
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'totalPoints',
            breakdown.totalPoints,
          );
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'groupStagePoints',
            breakdown.totalPoints,
          );
        } else {
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'totalPoints',
            breakdown.totalPoints,
          );
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'eliminationPoints',
            breakdown.totalPoints,
          );
        }

        updatedCount++;
      }

      await queryRunner.commitTransaction();
      return updatedCount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to calculate scores for match ${matchId}: ${errorMessage}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate scoring rules for a prediction
   * Returns detailed breakdown of scoring criteria
   */
  validateScoringRules(
    prediction: Prediction,
    result: MatchResult,
  ): ScoringBreakdown {
    return this.calculateScore(prediction, result);
  }

  /**
   * Recalculate scores for all predictions on a match
   * Used when a result is corrected
   * Idempotent operation - safe to retry
   */
  async recalculateScoresForMatch(matchId: string): Promise<number> {
    // Reset all prediction points for this match to 0
    const predictions = await this.predictionRepository.findByMatchId(matchId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Reset points for all predictions
      for (const prediction of predictions) {
        await queryRunner.manager.update(
          Prediction,
          { id: prediction.id },
          { pointsEarned: 0 },
        );
      }

      // Recalculate scores
      const result = await this.matchResultRepository.findByMatchId(matchId);
      if (!result) {
        throw new BadRequestException(
          `No result published for match ${matchId}`,
        );
      }

      const match = await this.matchRepository.findOne({ where: { id: matchId } });
      if (!match) {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }

      let updatedCount = 0;

      for (const prediction of predictions) {
        const breakdown = this.calculateScore(prediction, result);

        // Update prediction with new points
        await queryRunner.manager.update(
          Prediction,
          { id: prediction.id },
          { pointsEarned: breakdown.totalPoints },
        );

        // Update user score using increment
        if (match.phase === MatchPhase.GROUP) {
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'totalPoints',
            breakdown.totalPoints,
          );
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'groupStagePoints',
            breakdown.totalPoints,
          );
        } else {
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'totalPoints',
            breakdown.totalPoints,
          );
          await queryRunner.manager.increment(
            'user_scores',
            { userId: prediction.userId },
            'eliminationPoints',
            breakdown.totalPoints,
          );
        }

        updatedCount++;
      }

      await queryRunner.commitTransaction();
      return updatedCount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to recalculate scores for match ${matchId}: ${errorMessage}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get scoring breakdown for a specific prediction
   * Used for displaying score details to users
   */
  async getPredictionScoreBreakdown(
    predictionId: string,
  ): Promise<ScoringBreakdown | null> {
    const prediction = await this.predictionRepository.findOne({
      where: { id: predictionId },
      relations: ['match'],
    });

    if (!prediction) {
      return null;
    }

    const result = await this.matchResultRepository.findByMatchId(
      prediction.matchId,
    );

    if (!result) {
      return null;
    }

    return this.calculateScore(prediction, result);
  }
}
