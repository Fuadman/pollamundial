import { Module } from '@nestjs/common';
import { SeedingController } from './seeding.controller';
import { SeedingService } from '../services/seeding.service';

@Module({
  controllers: [SeedingController],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeedingModule {}
