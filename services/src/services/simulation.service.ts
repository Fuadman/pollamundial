import { Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserRepository } from '../repositories/user.repository';
import { MatchRepository } from '../repositories/match.repository';
import { PredictionRepository } from '../repositories/prediction.repository';
import { UserScoreRepository } from '../repositories/user-score.repository';
import { MatchResultRepository } from '../repositories/match-result.repository';

import { User } from '../entities/user.entity';
import { Prediction } from '../entities/prediction.entity';
import { MatchStatus, MatchPhase } from '../entities/match.entity';
import { UserScore } from '../entities/user-score.entity';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { MatchResult } from '../entities/match-result.entity';
import { NewsArticle } from '../entities/news-article.entity';
import { MatchResultService } from './match-result.service';
import { ScoringService } from './scoring.service';

const FAKE_NAMES = [
  'Alejandro García', 'María López', 'Carlos Martínez', 'Laura Hernández',
  'Diego Rodríguez', 'Valentina González', 'Andrés Pérez', 'Camila Torres',
  'Sebastián Ramírez', 'Isabella Flores', 'Felipe Morales', 'Sofía Castro',
  'Nicolás Ortega', 'Gabriela Jiménez', 'Mateo Ruiz', 'Fernanda Díaz',
  'Santiago Sánchez', 'Catalina Reyes', 'Emilio Vargas', 'Paola Ríos',
];

const SIM_EMAIL_SUFFIX = '@simulacro.test';
const SIM_GOOGLE_PREFIX = 'sim-google-';
const ADMIN_EMAIL = 'fuadsalo@gmail.com';

@Injectable()
export class SimulationService {
  constructor(
    private userRepository: UserRepository,
    private matchRepository: MatchRepository,
    private predictionRepository: PredictionRepository,
    private userScoreRepository: UserScoreRepository,
    private matchResultRepository: MatchResultRepository,
    private matchResultService: MatchResultService,
    private scoringService: ScoringService,
    private dataSource: DataSource,
  ) {}

  private async getFakeUsersEntities(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email LIKE :emailSuffix', {
        emailSuffix: `%${SIM_EMAIL_SUFFIX}`,
      })
      .orWhere('user.googleId LIKE :googlePrefix', {
        googlePrefix: `${SIM_GOOGLE_PREFIX}%`,
      })
      .getMany();
  }

  private async getFakeUserIds(): Promise<string[]> {
    const users = await this.getFakeUsersEntities();
    return users.map((user) => user.id);
  }

  private async getAdminUserId(): Promise<string | null> {
    const adminUser = await this.userRepository.findOne({
      where: { email: ADMIN_EMAIL },
    });
    return adminUser?.id ?? null;
  }

  private async ensureUserScoreEntry(userId: string): Promise<void> {
    const existing = await this.userScoreRepository.findOne({
      where: { userId },
    });

    if (existing) {
      return;
    }

    const newUserScore = this.userScoreRepository.create({
      id: uuid(),
      userId,
      totalPoints: 0,
      groupStagePoints: 0,
      eliminationPoints: 0,
    });
    await this.userScoreRepository.save(newUserScore);
  }

  private async getSimulatedResultMatchIds(fakeUserIds: string[]): Promise<string[]> {
    if (fakeUserIds.length === 0) {
      return [];
    }

    const rows = await this.dataSource
      .getRepository(Prediction)
      .createQueryBuilder('prediction')
      .select('DISTINCT prediction.matchId', 'matchId')
      .where('prediction.userId IN (:...userIds)', { userIds: fakeUserIds })
      .getRawMany<{ matchId: string }>();

    return rows.map((row) => row.matchId);
  }

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

  /** Generate random predictions for all fake users for all group-stage matches */
  async generateRandomPredictions(): Promise<number> {
    const fakeUserIds = await this.getFakeUserIds();
    const adminUserId = await this.getAdminUserId();
    const userIds = Array.from(
      new Set([
        ...fakeUserIds,
        ...(adminUserId ? [adminUserId] : []),
      ]),
    );

    if (userIds.length === 0) {
      return 0;
    }

    const matches = await this.matchRepository.find({
      where: { phase: MatchPhase.GROUP },
    });

    let total = 0;

    for (const userId of userIds) {
      await this.ensureUserScoreEntry(userId);

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

        await this.predictionRepository.save(prediction as unknown as Prediction);

        total++;
      }
    }

    return total;
  }

  /**
   * Generate or re-generate random published results for group stage and calculate points.
   * If a result already exists, it is updated with a new random score and scores are recalculated.
   */
  async generateRandomGroupResults(): Promise<{
    published: number;
    updated: number;
    scoredPredictions: number;
    matchIds: string[];
  }> {
    const groupMatches = await this.matchRepository.find({
      where: { phase: MatchPhase.GROUP },
    });

    let published = 0;
    let updated = 0;
    let scoredPredictions = 0;
    const matchIds: string[] = [];

    for (const match of groupMatches) {
      const team1Score = Math.floor(Math.random() * 5);
      const team2Score = Math.floor(Math.random() * 5);

      const existingResult = await this.matchResultService.getResultByMatchId(match.id);

      if (!existingResult) {
        await this.matchResultService.publishResult(
          match.id,
          team1Score,
          team2Score,
          undefined,
          undefined,
          'simulation-system',
        );
        published++;
      } else {
        await this.matchResultService.updateResult(
          match.id,
          team1Score,
          team2Score,
          undefined,
          undefined,
          'simulation-system',
        );
        updated++;
      }

      scoredPredictions += await this.predictionRepository.countByMatchId(match.id);

      matchIds.push(match.id);
    }

    return { published, updated, scoredPredictions, matchIds };
  }

  /**
   * Calculate a simulated leaderboard by assigning random points between
   * 0–3 per prediction saved for fake users, then returning the ranking.
   * This is purely for visualization — does not store points in user_scores.
   */
  async getSimulatedLeaderboard(): Promise<
    {
      rank: number;
      userId: string;
      name: string;
      email: string;
      totalPoints: number;
      groupStagePoints: number;
      eliminationPoints: number;
      predictionsCount: number;
    }[]
  > {
    const fakeUserIds = await this.getFakeUserIds();
    if (fakeUserIds.length === 0) return [];

    const [users, scores, predictionCountRows] = await Promise.all([
      this.userRepository.find({ where: { id: In(fakeUserIds) } }),
      this.userScoreRepository.find({ where: { userId: In(fakeUserIds) } }),
      this.dataSource
        .getRepository(Prediction)
        .createQueryBuilder('prediction')
        .select('prediction.userId', 'userId')
        .addSelect('COUNT(prediction.id)', 'count')
        .where('prediction.userId IN (:...userIds)', { userIds: fakeUserIds })
        .groupBy('prediction.userId')
        .getRawMany<{ userId: string; count: string }>(),
    ]);

    const scoreByUserId = new Map(scores.map((score) => [score.userId, score]));
    const predictionCountByUserId = new Map(
      predictionCountRows.map((row) => [row.userId, parseInt(row.count, 10)]),
    );

    const leaderboard = users.map((user) => {
      const score = scoreByUserId.get(user.id);

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        totalPoints: score?.totalPoints ?? 0,
        groupStagePoints: score?.groupStagePoints ?? 0,
        eliminationPoints: score?.eliminationPoints ?? 0,
        predictionsCount: predictionCountByUserId.get(user.id) ?? 0,
      };
    });

    leaderboard.sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.groupStagePoints - a.groupStagePoints ||
        b.eliminationPoints - a.eliminationPoints ||
        a.name.localeCompare(b.name),
    );

    return leaderboard.map((entry, i) => ({ rank: i + 1, ...entry }));
  }

  async getFakeUsers(): Promise<
    {
      userId: string;
      name: string;
      email: string;
      totalPoints: number;
      groupStagePoints: number;
      eliminationPoints: number;
      predictionsCount: number;
    }[]
  > {
    const fakeUserIds = await this.getFakeUserIds();
    if (fakeUserIds.length === 0) {
      return [];
    }

    const [users, scores, predictionCountRows] = await Promise.all([
      this.userRepository.find({ where: { id: In(fakeUserIds) } }),
      this.userScoreRepository.find({ where: { userId: In(fakeUserIds) } }),
      this.dataSource
        .getRepository(Prediction)
        .createQueryBuilder('prediction')
        .select('prediction.userId', 'userId')
        .addSelect('COUNT(prediction.id)', 'count')
        .where('prediction.userId IN (:...userIds)', { userIds: fakeUserIds })
        .groupBy('prediction.userId')
        .getRawMany<{ userId: string; count: string }>(),
    ]);

    const scoreByUserId = new Map(scores.map((score) => [score.userId, score]));
    const predictionCountByUserId = new Map(
      predictionCountRows.map((row) => [row.userId, parseInt(row.count, 10)]),
    );

    const rows = users.map((user) => {
      const score = scoreByUserId.get(user.id);

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        totalPoints: score?.totalPoints ?? 0,
        groupStagePoints: score?.groupStagePoints ?? 0,
        eliminationPoints: score?.eliminationPoints ?? 0,
        predictionsCount: predictionCountByUserId.get(user.id) ?? 0,
      };
    });

    rows.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));

    return rows;
  }

  async getSimulatedResults(): Promise<
    {
      resultId: string;
      matchId: string;
      team1Name: string;
      team2Name: string;
      team1Score: number;
      team2Score: number;
      isDraw: boolean;
      phase: MatchPhase;
      groupStageGroup: string | null;
      publishedTimestamp: Date;
    }[]
  > {
    const fakeUserIds = await this.getFakeUserIds();
    const simulatedMatchIds = await this.getSimulatedResultMatchIds(fakeUserIds);

    if (simulatedMatchIds.length === 0) {
      return [];
    }

    const results = await this.matchResultRepository.find({
      where: { matchId: In(simulatedMatchIds) },
      relations: ['match', 'match.team1', 'match.team2'],
    });

    const rows = results.map((result) => ({
      resultId: result.id,
      matchId: result.matchId,
      team1Name: result.match?.team1?.name ?? 'Equipo 1',
      team2Name: result.match?.team2?.name ?? 'Equipo 2',
      team1Score: result.team1Score,
      team2Score: result.team2Score,
      isDraw: result.isDraw,
      phase: result.match?.phase ?? MatchPhase.GROUP,
      groupStageGroup: result.match?.groupStageGroup ?? null,
      publishedTimestamp: result.publishedTimestamp,
    }));

    rows.sort(
      (a, b) =>
        new Date(b.publishedTimestamp).getTime() -
        new Date(a.publishedTimestamp).getTime(),
    );

    return rows;
  }

  /** Delete all simulation data (users, predictions, scores) */
  async clearSimulationData(): Promise<{
    usersDeleted: number;
    predictionsDeleted: number;
    resultsDeleted: number;
    matchesResetToScheduled: number;
  }> {
    const fakeUserIds = await this.getFakeUserIds();

    let fakePredictionIds: string[] = [];
    if (fakeUserIds.length > 0) {
      const predictionRows = await this.dataSource
        .getRepository(Prediction)
        .createQueryBuilder('prediction')
        .select('prediction.id', 'id')
        .where('prediction.userId IN (:...userIds)', { userIds: fakeUserIds })
        .getRawMany<{ id: string }>();
      fakePredictionIds = predictionRows.map((row) => row.id);
    }

    const simulatedMatchIds = await this.getSimulatedResultMatchIds(fakeUserIds);

    let fakeResultIds: string[] = [];
    if (simulatedMatchIds.length > 0) {
      const resultRows = await this.matchResultRepository
        .createQueryBuilder('result')
        .select('result.id', 'id')
        .where('result.matchId IN (:...matchIds)', { matchIds: simulatedMatchIds })
        .getRawMany<{ id: string }>();
      fakeResultIds = resultRows.map((row) => row.id);
    }

    let matchesResetToScheduled = 0;

    if (fakeResultIds.length > 0) {
      const simulatedResults = await this.matchResultRepository.find({
        where: { id: In(fakeResultIds) },
      });

      const matchIds = simulatedResults.map((result) => result.matchId);

      await this.matchResultRepository.delete(fakeResultIds);

      if (matchIds.length > 0) {
        for (const matchId of matchIds) {
          await this.matchRepository.updateStatus(matchId, MatchStatus.SCHEDULED);
          matchesResetToScheduled++;
        }
      }
    }

    // Delete prediction records
    if (fakePredictionIds.length > 0) {
      await this.predictionRepository.delete(fakePredictionIds);
    }

    // Delete fake users (cascade deletes scores)
    if (fakeUserIds.length > 0) {
      await this.userRepository.delete(fakeUserIds);
    }

    return {
      usersDeleted: fakeUserIds.length,
      predictionsDeleted: fakePredictionIds.length,
      resultsDeleted: fakeResultIds.length,
      matchesResetToScheduled,
    };
  }

  /** Summary of current simulation state */
  async getSimulationStatus(): Promise<{
    fakeUsers: number;
    fakePredictions: number;
    fakeResults: number;
    scheduledMatches: number;
    pendingGroupMatches: number;
  }> {
    const fakeUserIds = await this.getFakeUserIds();
    const simulatedMatchIds = await this.getSimulatedResultMatchIds(fakeUserIds);

    const [fakePredictionsCountRows, scheduledMatches, pendingGroupMatches] =
      await Promise.all([
        fakeUserIds.length > 0
          ? this.dataSource
              .getRepository(Prediction)
              .createQueryBuilder('prediction')
              .select('COUNT(prediction.id)', 'count')
              .where('prediction.userId IN (:...userIds)', { userIds: fakeUserIds })
              .getRawOne<{ count: string }>()
          : Promise.resolve({ count: '0' }),
        this.matchRepository.count({ where: { status: MatchStatus.SCHEDULED } }),
        this.matchRepository.count({
          where: {
            phase: MatchPhase.GROUP,
            status: MatchStatus.SCHEDULED,
          },
        }),
      ]);

    const fakePredictions = parseInt(fakePredictionsCountRows?.count ?? '0', 10);
    const fakeResults =
      simulatedMatchIds.length > 0
        ? await this.matchResultRepository.count({ where: { matchId: In(simulatedMatchIds) } })
        : 0;

    return {
      fakeUsers: fakeUserIds.length,
      fakePredictions,
      fakeResults,
      scheduledMatches,
      pendingGroupMatches,
    };
  }

  async resetToAdminOnly(): Promise<{
    usersDeleted: number;
    predictionsDeleted: number;
    resultsDeleted: number;
    matchesDeleted: number;
    teamsDeleted: number;
    userScoresDeleted: number;
    newsDeleted: number;
    adminEmail: string;
  }> {
    const adminUser = await this.userRepository.findOne({
      where: { email: ADMIN_EMAIL },
    });

    if (!adminUser) {
      throw new Error(`Admin user not found: ${ADMIN_EMAIL}`);
    }

    const [usersCount, predictionsCount, resultsCount, matchesCount, teamsCount, userScoresCount, newsCount] =
      await Promise.all([
        this.userRepository.count({ where: { id: Not(adminUser.id) } }),
        this.predictionRepository.count(),
        this.matchResultRepository.count(),
        this.matchRepository.count(),
        this.dataSource.getRepository(Team).count(),
        this.userScoreRepository.count(),
        this.dataSource.getRepository(NewsArticle).count(),
      ]);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Prediction, {});
      await manager.delete(MatchResult, {});
      await manager.delete(Match, {});
      await manager.delete(Team, {});
      await manager.delete(UserScore, {});
      await manager.delete(NewsArticle, {});
      await manager.delete(User, { id: Not(adminUser.id) });

      await manager.update(
        User,
        { id: adminUser.id },
        {
          role: 'admin',
          registrationCompleted: true,
          paymentCompleted: true,
          registrationTimestamp: adminUser.registrationTimestamp ?? new Date(),
          paymentTimestamp: adminUser.paymentTimestamp ?? new Date(),
        },
      );

      const adminScore = manager.create(UserScore, {
        id: uuid(),
        userId: adminUser.id,
        totalPoints: 0,
        groupStagePoints: 0,
        eliminationPoints: 0,
      });
      await manager.save(UserScore, adminScore);
    });

    return {
      usersDeleted: usersCount,
      predictionsDeleted: predictionsCount,
      resultsDeleted: resultsCount,
      matchesDeleted: matchesCount,
      teamsDeleted: teamsCount,
      userScoresDeleted: userScoresCount,
      newsDeleted: newsCount,
      adminEmail: ADMIN_EMAIL,
    };
  }

  async recalculatePositions(): Promise<{
    matchesProcessed: number;
    predictionsScored: number;
    usersInitialized: number;
  }> {
    const predictionUsersRows = await this.dataSource
      .getRepository(Prediction)
      .createQueryBuilder('prediction')
      .select('DISTINCT prediction.userId', 'userId')
      .getRawMany<{ userId: string }>();

    const userIds = predictionUsersRows.map((row) => row.userId);
    let usersInitialized = 0;

    if (userIds.length > 0) {
      const existingScores = await this.userScoreRepository.find({
        where: { userId: In(userIds) },
      });
      const existingScoreUserIds = new Set(existingScores.map((score) => score.userId));

      const missingUserIds = userIds.filter((userId) => !existingScoreUserIds.has(userId));

      for (const userId of missingUserIds) {
        const scoreEntry = this.userScoreRepository.create({
          id: uuid(),
          userId,
          totalPoints: 0,
          groupStagePoints: 0,
          eliminationPoints: 0,
        });
        await this.userScoreRepository.save(scoreEntry);
      }

      usersInitialized = missingUserIds.length;
    }

    await this.userScoreRepository
      .createQueryBuilder()
      .update(UserScore)
      .set({
        totalPoints: 0,
        groupStagePoints: 0,
        eliminationPoints: 0,
      })
      .execute();

    await this.predictionRepository
      .createQueryBuilder()
      .update(Prediction)
      .set({ pointsEarned: 0 })
      .execute();

    const resultRows = await this.dataSource
      .getRepository(MatchResult)
      .createQueryBuilder('result')
      .select('DISTINCT result.matchId', 'matchId')
      .getRawMany<{ matchId: string }>();

    const matchIds = resultRows.map((row) => row.matchId);
    let predictionsScored = 0;

    for (const matchId of matchIds) {
      const scoredCount = await this.scoringService.calculateAllScoresForMatch(matchId);
      predictionsScored += scoredCount;
    }

    return {
      matchesProcessed: matchIds.length,
      predictionsScored,
      usersInitialized,
    };
  }
}
