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
}
