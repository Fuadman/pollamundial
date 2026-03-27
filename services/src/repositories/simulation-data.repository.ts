import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { SimulationData } from '../entities/simulation-data.entity';

@Injectable()
export class SimulationDataRepository extends Repository<SimulationData> {
  constructor(private dataSource: DataSource) {
    super(SimulationData, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<SimulationData[]> {
    return this.find({
      where: { userId, isTestData: true },
      relations: ['user', 'prediction', 'matchResult'],
    });
  }

  async findByPredictionId(predictionId: string): Promise<SimulationData | null> {
    return this.findOne({
      where: { predictionId, isTestData: true },
      relations: ['prediction', 'user'],
    });
  }

  async findByMatchResultId(matchResultId: string): Promise<SimulationData | null> {
    return this.findOne({
      where: { matchResultId, isTestData: true },
      relations: ['matchResult'],
    });
  }

  async findAllTestData(): Promise<SimulationData[]> {
    return this.find({
      where: { isTestData: true },
      relations: ['user', 'prediction', 'matchResult'],
    });
  }

  async findTestUserIds(): Promise<string[]> {
    const results = await this.createQueryBuilder('sim')
      .select('DISTINCT sim.userId', 'userId')
      .where('sim.isTestData = :isTestData', { isTestData: true })
      .andWhere('sim.userId IS NOT NULL')
      .getRawMany();

    return results.map((r) => r.userId).filter((id): id is string => id !== null);
  }

  async findTestPredictionIds(): Promise<string[]> {
    const results = await this.createQueryBuilder('sim')
      .select('DISTINCT sim.predictionId', 'predictionId')
      .where('sim.isTestData = :isTestData', { isTestData: true })
      .andWhere('sim.predictionId IS NOT NULL')
      .getRawMany();

    return results.map((r) => r.predictionId).filter((id): id is string => id !== null);
  }

  async findTestMatchResultIds(): Promise<string[]> {
    const results = await this.createQueryBuilder('sim')
      .select('DISTINCT sim.matchResultId', 'matchResultId')
      .where('sim.isTestData = :isTestData', { isTestData: true })
      .andWhere('sim.matchResultId IS NOT NULL')
      .getRawMany();

    return results.map((r) => r.matchResultId).filter((id): id is string => id !== null);
  }

  async countTestData(): Promise<number> {
    return this.count({ where: { isTestData: true } });
  }

  async countTestUsers(): Promise<number> {
    const result = await this.createQueryBuilder('sim')
      .select('COUNT(DISTINCT sim.userId)', 'count')
      .where('sim.isTestData = :isTestData', { isTestData: true })
      .andWhere('sim.userId IS NOT NULL')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async countTestPredictions(): Promise<number> {
    const result = await this.createQueryBuilder('sim')
      .select('COUNT(DISTINCT sim.predictionId)', 'count')
      .where('sim.isTestData = :isTestData', { isTestData: true })
      .andWhere('sim.predictionId IS NOT NULL')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async countTestResults(): Promise<number> {
    const result = await this.createQueryBuilder('sim')
      .select('COUNT(DISTINCT sim.matchResultId)', 'count')
      .where('sim.isTestData = :isTestData', { isTestData: true })
      .andWhere('sim.matchResultId IS NOT NULL')
      .getRawOne();

    return parseInt(result?.count || '0', 10);
  }

  async deleteTestData(): Promise<void> {
    await this.delete({ isTestData: true });
  }

  async deleteTestUserData(userId: string): Promise<void> {
    await this.delete({ userId, isTestData: true });
  }

  async deleteTestPredictionData(predictionId: string): Promise<void> {
    await this.delete({ predictionId, isTestData: true });
  }

  async deleteTestResultData(matchResultId: string): Promise<void> {
    await this.delete({ matchResultId, isTestData: true });
  }
}
