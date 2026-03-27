import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PredictionRepository } from '../repositories/prediction.repository';
import { MatchRepository } from '../repositories/match.repository';
import { UserRepository } from '../repositories/user.repository';
import { UserScoreRepository } from '../repositories/user-score.repository';
import { Prediction } from '../entities/prediction.entity';
import { MatchStatus } from '../entities/match.entity';
import { LockdownService } from './lockdown.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PredictionService {
  constructor(
    private predictionRepository: PredictionRepository,
    private matchRepository: MatchRepository,
    private userRepository: UserRepository,
    private userScoreRepository: UserScoreRepository,
    private lockdownService: LockdownService,
    private dataSource: DataSource,
  ) {}

  async submitPrediction(
    userId: string,
    matchId: string,
    predictedTeam1Score?: number,
    predictedTeam2Score?: number,
    predictedWinnerId?: string,
    predictedDraw?: boolean,
  ): Promise<Prediction> {
    // Validate user exists and is registered
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.registrationCompleted || !user.paymentCompleted) {
      throw new ForbiddenException(
        'User must complete registration and payment to submit predictions',
      );
    }

    // Validate match exists
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    // Check if match is locked using lockdown service
    await this.lockdownService.validatePredictionNotLocked(matchId);

    // Check if match has already concluded
    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot predict on concluded matches',
      );
    }

    // Validate prediction format
    if (!predictedDraw && !predictedWinnerId && 
        (predictedTeam1Score === undefined || predictedTeam2Score === undefined)) {
      throw new BadRequestException(
        'Prediction must include either a score, winner, or draw',
      );
    }

    // Check for duplicate prediction
    const existingPrediction = await this.predictionRepository.findByUserAndMatch(
      userId,
      matchId,
    );
    if (existingPrediction) {
      throw new BadRequestException(
        'User already has a prediction for this match',
      );
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prediction = this.predictionRepository.create({
        id: uuid(),
        userId,
        matchId,
        predictedTeam1Score: predictedTeam1Score ?? null,
        predictedTeam2Score: predictedTeam2Score ?? null,
        predictedWinnerId: predictedWinnerId ?? null,
        predictedDraw: predictedDraw || false,
        submissionTimestamp: new Date(),
      });

      const savedPrediction = await queryRunner.manager.save(prediction);

      // Ensure user score exists
      let userScore = await queryRunner.manager.findOne(
        'user_scores',
        {
          where: { userId },
        },
      );

      if (!userScore) {
        userScore = {
          id: uuid(),
          userId,
          totalPoints: 0,
          groupStagePoints: 0,
          eliminationPoints: 0,
        };
        await queryRunner.manager.save('user_scores', userScore);
      }

      await queryRunner.commitTransaction();
      return savedPrediction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to submit prediction: ${errorMessage}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async editPrediction(
    userId: string,
    predictionId: string,
    predictedTeam1Score?: number,
    predictedTeam2Score?: number,
    predictedWinnerId?: string,
    predictedDraw?: boolean,
  ): Promise<Prediction> {
    const prediction = await this.predictionRepository.findOne({
      where: { id: predictionId },
      relations: ['match'],
    });

    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${predictionId} not found`);
    }

    // Verify ownership
    if (prediction.userId !== userId) {
      throw new ForbiddenException(
        'User can only edit their own predictions',
      );
    }

    // Check if prediction is locked using lockdown service
    await this.lockdownService.validatePredictionCanBeEdited(predictionId);

    // Check if match lockdown has passed
    await this.lockdownService.validatePredictionNotLocked(prediction.matchId);

    // Update prediction
    prediction.predictedTeam1Score = predictedTeam1Score ?? null;
    prediction.predictedTeam2Score = predictedTeam2Score ?? null;
    prediction.predictedWinnerId = predictedWinnerId ?? null;
    prediction.predictedDraw = predictedDraw || false;

    return this.predictionRepository.save(prediction);
  }

  async getPredictionByUserAndMatch(
    userId: string,
    matchId: string,
  ): Promise<Prediction | null> {
    return this.predictionRepository.findByUserAndMatch(userId, matchId);
  }

  async getUserPredictions(userId: string): Promise<Prediction[]> {
    return this.predictionRepository.findByUserId(userId);
  }

  async getMatchPredictions(matchId: string): Promise<Prediction[]> {
    return this.predictionRepository.findByMatchId(matchId);
  }

  async getUserPredictionsByPhase(
    userId: string,
    phase: 'group' | 'elimination',
  ): Promise<Prediction[]> {
    return this.predictionRepository.findUserPredictionsByPhase(userId, phase);
  }

  async getUserPredictionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Prediction[]> {
    return this.predictionRepository.findUserPredictionsByDateRange(
      userId,
      startDate,
      endDate,
    );
  }

  async getPendingPredictions(userId: string): Promise<Prediction[]> {
    return this.predictionRepository.findPendingPredictions(userId);
  }

  async getCompletedPredictions(userId: string): Promise<Prediction[]> {
    return this.predictionRepository.findCompletedPredictions(userId);
  }

  async lockPrediction(predictionId: string): Promise<void> {
    await this.predictionRepository.lockPrediction(predictionId);
  }

  async lockPredictionsByMatch(matchId: string): Promise<void> {
    await this.predictionRepository.lockPredictionsByMatch(matchId);
  }

  async updatePredictionPoints(predictionId: string, points: number): Promise<void> {
    await this.predictionRepository.updatePoints(predictionId, points);
  }

  async countUserPredictions(userId: string): Promise<number> {
    return this.predictionRepository.countByUserId(userId);
  }

  async countMatchPredictions(matchId: string): Promise<number> {
    return this.predictionRepository.countByMatchId(matchId);
  }

  async predictionExists(userId: string, matchId: string): Promise<boolean> {
    return this.predictionRepository.existsForUserAndMatch(userId, matchId);
  }

  async getHighestScoringPredictions(limit: number = 10): Promise<Prediction[]> {
    return this.predictionRepository.findWithHighestPoints(limit);
  }

  async deletePrediction(predictionId: string): Promise<void> {
    const prediction = await this.predictionRepository.findOne({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${predictionId} not found`);
    }

    await this.predictionRepository.remove(prediction);
  }
}
