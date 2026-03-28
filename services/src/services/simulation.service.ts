import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserRepository } from '../repositories/user.repository';
import { MatchRepository } from '../repositories/match.repository';
import { PredictionRepository } from '../repositories/prediction.repository';
import { UserScoreRepository } from '../repositories/user-score.repository';
import { SimulationDataRepository } from '../repositories/simulation-data.repository';

import { User } from '../entities/user.entity';
import { Prediction } from '../entities/prediction.entity';
import { SimulationData } from '../entities/simulation-data.entity';
import { MatchStatus } from '../entities/match.entity';

const FAKE_NAMES = [
  'Alejandro García', 'María López', 'Carlos Martínez', 'Laura Hernández',
  'Diego Rodríguez', 'Valentina González', 'Andrés Pérez', 'Camila Torres',
  'Sebastián Ramírez', 'Isabella Flores', 'Felipe Morales', 'Sofía Castro',
  'Nicolás Ortega', 'Gabriela Jiménez', 'Mateo Ruiz', 'Fernanda Díaz',
  'Santiago Sánchez', 'Catalina Reyes', 'Emilio Vargas', 'Paola Ríos',
];

@Injectable()
export class SimulationService {
  constructor(
    private userRepository: UserRepository,
    private matchRepository: MatchRepository,
    private predictionRepository: PredictionRepository,
    private userScoreRepository: UserScoreRepository,
    private simulationDataRepository: SimulationDataRepository,
    private dataSource: DataSource,
  ) {}

  /** Generate N fake registered users */
  async generateFakeUsers(count: number): Promise<User[]> {
    const users: User[] = [];

    for (let i = 0; i < count; i++) {
      const name = FAKE_NAMES[i % FAKE_NAMES.length] + (i >= FAKE_NAMES.length ? ` ${Math.floor(i / FAKE_NAMES.length) + 1}` : '');
      const googleId = `sim-google-${uuid()}`;
      const email = `sim-user-${uuid().slice(0, 8)}@simulacro.test`;

      const user = this.userRepository.create({
        id: uuid(),
        googleId,
        email,
        name,
        registrationCompleted: true,
        paymentCompleted: true,
        registrationTimestamp: new Date(),
        paymentTimestamp: new Date(),
        role: 'user',
      });

      const savedUser = await this.userRepository.save(user);

      // Register in simulation_data
      const simRecord = this.simulationDataRepository.create({
        id: uuid(),
        userId: savedUser.id,
        isTestData: true,
      });
      await this.simulationDataRepository.save(simRecord);

      // Create user score entry
      const scoreEntry = this.userScoreRepository.create({
        id: uuid(),
        userId: savedUser.id,
        totalPoints: 0,
        groupStagePoints: 0,
        eliminationPoints: 0,
      });
      await this.userScoreRepository.save(scoreEntry);

      users.push(savedUser);
    }

    return users;
  }

  /** Generate random predictions for all fake users for all scheduled matches */
  async generateRandomPredictions(): Promise<number> {
    const fakeUserIds = await this.simulationDataRepository.findTestUserIds();
    if (fakeUserIds.length === 0) {
      return 0;
    }

    const matches = await this.matchRepository.find({
      where: { status: MatchStatus.SCHEDULED },
    });

    let total = 0;

    for (const userId of fakeUserIds) {
      for (const match of matches) {
        // Skip if prediction already exists
        const existing = await this.predictionRepository.findByUserAndMatch(userId, match.id);
        if (existing) continue;

        const team1Score = Math.floor(Math.random() * 5);
        const team2Score = Math.floor(Math.random() * 5);
        const isDraw = team1Score === team2Score;
        const predictedWinnerId = isDraw
          ? null
          : team1Score > team2Score
          ? match.team1Id
          : match.team2Id;

        const prediction = this.predictionRepository.create({
          id: uuid(),
          userId,
          matchId: match.id,
          predictedTeam1Score: team1Score,
          predictedTeam2Score: team2Score,
          predictedWinnerId,
          predictedDraw: isDraw,
          submissionTimestamp: new Date(),
          lockedTimestamp: null,
          pointsEarned: 0,
        });

        const saved = await this.predictionRepository.save(prediction as unknown as Prediction);

        const simRecord = this.simulationDataRepository.create({
          id: uuid(),
          predictionId: saved.id,
          isTestData: true,
        });
        await this.simulationDataRepository.save(simRecord);

        total++;
      }
    }

    return total;
  }

  /**
   * Calculate a simulated leaderboard by assigning random points between
   * 0–3 per prediction saved for fake users, then returning the ranking.
   * This is purely for visualization — does not store points in user_scores.
   */
  async getSimulatedLeaderboard(): Promise<
    { rank: number; name: string; email: string; totalPoints: number; predictionsCount: number }[]
  > {
    const fakeUserIds = await this.simulationDataRepository.findTestUserIds();
    if (fakeUserIds.length === 0) return [];

    const users = await this.userRepository.find({ where: { id: In(fakeUserIds) } });

    const leaderboard = users.map((user) => {
      // Deterministic random: seed from userId chars so it's stable across calls
      const seed = user.id.charCodeAt(0) + user.id.charCodeAt(4);
      const predictionsCount = 30 + (seed % 43); // 30–72
      const totalPoints = predictionsCount * (1 + (seed % 3)); // 1–3 pts avg per prediction

      return {
        name: user.name,
        email: user.email,
        totalPoints,
        predictionsCount,
      };
    });

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    return leaderboard.map((entry, i) => ({ rank: i + 1, ...entry }));
  }

  /** Delete all simulation data (users, predictions, scores) */
  async clearSimulationData(): Promise<{ usersDeleted: number; predictionsDeleted: number }> {
    const fakeUserIds = await this.simulationDataRepository.findTestUserIds();
    const fakePredictionIds = await this.simulationDataRepository.findTestPredictionIds();

    // Delete prediction records
    if (fakePredictionIds.length > 0) {
      await this.predictionRepository.delete(fakePredictionIds);
    }

    // Delete simulation_data records (also cascades user-referenced ones)
    await this.simulationDataRepository.deleteTestData();

    // Delete fake users (cascade deletes scores)
    if (fakeUserIds.length > 0) {
      await this.userRepository.delete(fakeUserIds);
    }

    return {
      usersDeleted: fakeUserIds.length,
      predictionsDeleted: fakePredictionIds.length,
    };
  }

  /** Summary of current simulation state */
  async getSimulationStatus(): Promise<{
    fakeUsers: number;
    fakePredictions: number;
    scheduledMatches: number;
  }> {
    const [fakeUserIds, fakePredictionIds, scheduledMatches] = await Promise.all([
      this.simulationDataRepository.findTestUserIds(),
      this.simulationDataRepository.findTestPredictionIds(),
      this.matchRepository.count({ where: { status: MatchStatus.SCHEDULED } }),
    ]);

    return {
      fakeUsers: fakeUserIds.length,
      fakePredictions: fakePredictionIds.length,
      scheduledMatches,
    };
  }
}
