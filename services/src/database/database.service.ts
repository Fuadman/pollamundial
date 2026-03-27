import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000; // 3 seconds
  private isHealthy = false;

  constructor(
    private dataSource: DataSource,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    await this.ensureConnection();
  }

  async onModuleDestroy() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.log('Database connection closed');
    }
  }

  /**
   * Ensures database connection with retry logic
   */
  private async ensureConnection(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.dataSource.isInitialized) {
          await this.dataSource.initialize();
        }

        // Verify connection with a simple query
        await this.dataSource.query('SELECT 1');
        this.isHealthy = true;
        this.logger.log('Database connection established successfully');
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Database connection attempt ${attempt}/${this.maxRetries} failed: ${lastError.message}`,
        );

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }

    this.isHealthy = false;
    this.logger.error(
      `Failed to connect to database after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
    throw new Error(
      `Database connection failed after ${this.maxRetries} retries: ${lastError?.message}`,
    );
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: 'unhealthy',
          message: 'Database connection not initialized',
        };
      }

      await this.dataSource.query('SELECT 1');
      this.isHealthy = true;
      return {
        status: 'healthy',
        message: 'Database connection is active',
      };
    } catch (error) {
      this.isHealthy = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        message: `Database health check failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): boolean {
    return this.isHealthy;
  }

  /**
   * Get DataSource instance
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Helper method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
