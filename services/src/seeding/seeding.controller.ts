import { Controller, Post, Logger } from '@nestjs/common';
import { SeedingService } from '../services/seeding.service';

@Controller('api/seeding')
export class SeedingController {
  private readonly logger = new Logger(SeedingController.name);

  constructor(private seedingService: SeedingService) {}

  @Post('copa-america-2024')
  async seedCopaAmerica2024(): Promise<{
    success: boolean;
    teamsCreated: number;
    matchesCreated: number;
    message: string;
  }> {
    try {
      const result = await this.seedingService.seedCopaAmerica2024();

      return {
        success: true,
        teamsCreated: result.teamsCreated,
        matchesCreated: result.matchesCreated,
        message: `Successfully seeded Copa América 2024 tournament with ${result.teamsCreated} teams and ${result.matchesCreated} matches`,
      };
    } catch (error) {
      this.logger.error('Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clears all existing data and seeds the real Copa Mundial 2026 schedule:
   * 48 teams in 12 groups (A–L), 72 matches with exact kickoff times (UTC).
   */
  @Post('copa-mundial-2026')
  async seedCopaMundial2026(): Promise<{
    success: boolean;
    teamsCreated: number;
    matchesCreated: number;
    message: string;
  }> {
    try {
      const result = await this.seedingService.reseedCopaMundial2026();

      return {
        success: true,
        teamsCreated: result.teamsCreated,
        matchesCreated: result.matchesCreated,
        message: `Copa Mundial 2026 seeded: ${result.teamsCreated} equipos, ${result.matchesCreated} partidos`,
      };
    } catch (error) {
      this.logger.error('Copa Mundial 2026 seeding failed:', error);
      throw error;
    }
  }
}
