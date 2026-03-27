import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchRepository } from '../repositories/match.repository';
import { PredictionRepository } from '../repositories/prediction.repository';
import { Match } from '../entities/match.entity';

@Injectable()
export class LockdownService {
  constructor(
    private matchRepository: MatchRepository,
    private predictionRepository: PredictionRepository,
  ) {}

  /**
   * Calculate lockdown time as 15 minutes before match start
   * Property 23: Lockdown time calculation
   * Validates: Requirements 9.1
   */
  calculateLockdownTime(scheduledTime: Date): Date {
    return new Date(scheduledTime.getTime() - 15 * 60 * 1000);
  }

  /**
   * Check if a match is currently locked
   * Property 24: Lockdown state transition
   * Validates: Requirements 9.2
   */
  async isMatchLocked(matchId: string): Promise<boolean> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    return new Date() >= match.lockdownTime;
  }

  /**
   * Get the lockdown time for a match
   */
  async getMatchLockdownTime(matchId: string): Promise<Date> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    return match.lockdownTime;
  }

  /**
   * Get time remaining until lockdown (in milliseconds)
   * Returns negative value if already locked
   */
  async getTimeUntilLockdown(matchId: string): Promise<number> {
    const lockdownTime = await this.getMatchLockdownTime(matchId);
    return lockdownTime.getTime() - new Date().getTime();
  }

  /**
   * Lock all predictions for a match
   * Property 24: Lockdown state transition
   * Validates: Requirements 9.2
   */
  async lockMatchPredictions(matchId: string): Promise<number> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    // Lock all unlocked predictions for this match
    await this.predictionRepository.lockPredictionsByMatch(matchId);

    // Count locked predictions
    const lockedPredictions = await this.predictionRepository.findLockedPredictions(matchId);
    return lockedPredictions.length;
  }

  /**
   * Check if a prediction is locked
   * Property 25: Locked predictions prevent modifications
   * Validates: Requirements 9.3
   */
  async isPredictionLocked(predictionId: string): Promise<boolean> {
    const prediction = await this.predictionRepository.findOne({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new NotFoundException(`Prediction with ID ${predictionId} not found`);
    }

    return prediction.lockedTimestamp !== null;
  }

  /**
   * Validate that a prediction can be submitted (not locked)
   * Property 15: Pre-lockdown predictions accepted
   * Property 16: Post-lockdown predictions rejected
   * Validates: Requirements 7.4, 7.5
   */
  async validatePredictionNotLocked(matchId: string): Promise<void> {
    const isLocked = await this.isMatchLocked(matchId);
    if (isLocked) {
      throw new BadRequestException('Predictions for this match are locked');
    }
  }

  /**
   * Validate that a prediction can be edited (not locked)
   * Property 21: Lockdown prevents edits
   * Validates: Requirements 8.4
   */
  async validatePredictionCanBeEdited(predictionId: string): Promise<void> {
    const isLocked = await this.isPredictionLocked(predictionId);
    if (isLocked) {
      throw new BadRequestException('Prediction is locked and cannot be edited');
    }
  }

  /**
   * Recalculate lockdown time when match is rescheduled
   * Property 27: Rescheduled match lockdown recalculation
   * Validates: Requirements 9.5
   */
  async recalculateLockdownTime(matchId: string, newScheduledTime: Date): Promise<Date> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const newLockdownTime = this.calculateLockdownTime(newScheduledTime);

    // Update match with new times
    match.scheduledTime = newScheduledTime;
    match.lockdownTime = newLockdownTime;

    await this.matchRepository.save(match);

    return newLockdownTime;
  }

  /**
   * Get matches approaching lockdown (within specified minutes)
   */
  async getMatchesApproachingLockdown(minutesBefore: number = 30): Promise<Match[]> {
    return this.matchRepository.findMatchesNearLockdown(minutesBefore);
  }

  /**
   * Get all currently locked matches
   */
  async getLockedMatches(): Promise<Match[]> {
    const now = new Date();
    const matches = await this.matchRepository.find({
      where: {},
    });

    return matches.filter((match) => now >= match.lockdownTime);
  }

  /**
   * Get all unlocked matches
   */
  async getUnlockedMatches(): Promise<Match[]> {
    const now = new Date();
    const matches = await this.matchRepository.find({
      where: {},
    });

    return matches.filter((match) => now < match.lockdownTime);
  }
}
