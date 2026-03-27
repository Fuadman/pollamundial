import { Injectable } from '@nestjs/common';
import { SimulationDataRepository } from '../repositories/simulation-data.repository';
import { SimulationData } from '../entities/simulation-data.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SimulationDataService {
  constructor(private simulationDataRepository: SimulationDataRepository) {}

  async createTestUserRecord(userId: string): Promise<SimulationData> {
    const record = this.simulationDataRepository.create({
      id: uuid(),
      userId,
      isTestData: true,
    });

    return this.simulationDataRepository.save(record);
  }

  async createTestPredictionRecord(predictionId: string): Promise<SimulationData> {
    const record = this.simulationDataRepository.create({
      id: uuid(),
      predictionId,
      isTestData: true,
    });

    return this.simulationDataRepository.save(record);
  }

  async createTestResultRecord(matchResultId: string): Promise<SimulationData> {
    const record = this.simulationDataRepository.create({
      id: uuid(),
      matchResultId,
      isTestData: true,
    });

    return this.simulationDataRepository.save(record);
  }

  async getTestDataByUserId(userId: string): Promise<SimulationData[]> {
    return this.simulationDataRepository.findByUserId(userId);
  }

  async getTestDataByPredictionId(predictionId: string): Promise<SimulationData | null> {
    return this.simulationDataRepository.findByPredictionId(predictionId);
  }

  async getTestDataByMatchResultId(matchResultId: string): Promise<SimulationData | null> {
    return this.simulationDataRepository.findByMatchResultId(matchResultId);
  }

  async getAllTestData(): Promise<SimulationData[]> {
    return this.simulationDataRepository.findAllTestData();
  }

  async getTestUserIds(): Promise<string[]> {
    return this.simulationDataRepository.findTestUserIds();
  }

  async getTestPredictionIds(): Promise<string[]> {
    return this.simulationDataRepository.findTestPredictionIds();
  }

  async getTestMatchResultIds(): Promise<string[]> {
    return this.simulationDataRepository.findTestMatchResultIds();
  }

  async countTestData(): Promise<number> {
    return this.simulationDataRepository.countTestData();
  }

  async countTestUsers(): Promise<number> {
    return this.simulationDataRepository.countTestUsers();
  }

  async countTestPredictions(): Promise<number> {
    return this.simulationDataRepository.countTestPredictions();
  }

  async countTestResults(): Promise<number> {
    return this.simulationDataRepository.countTestResults();
  }

  async deleteAllTestData(): Promise<void> {
    await this.simulationDataRepository.deleteTestData();
  }

  async deleteTestUserData(userId: string): Promise<void> {
    await this.simulationDataRepository.deleteTestUserData(userId);
  }

  async deleteTestPredictionData(predictionId: string): Promise<void> {
    await this.simulationDataRepository.deleteTestPredictionData(predictionId);
  }

  async deleteTestResultData(matchResultId: string): Promise<void> {
    await this.simulationDataRepository.deleteTestResultData(matchResultId);
  }

  async getSimulationReport(): Promise<{
    totalTestData: number;
    testUsers: number;
    testPredictions: number;
    testResults: number;
  }> {
    return {
      totalTestData: await this.countTestData(),
      testUsers: await this.countTestUsers(),
      testPredictions: await this.countTestPredictions(),
      testResults: await this.countTestResults(),
    };
  }
}
