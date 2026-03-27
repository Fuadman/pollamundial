import { Module } from '@nestjs/common';
import { MatchController } from '../controllers/match.controller';
import { AdminMatchResultController } from '../controllers/admin-match-result.controller';
import { DataAccessModule } from '../data-access/data-access.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { ScoreUpdateService } from '../services/score-update.service';
import { ScoreUpdateGateway } from '../gateways/score-update.gateway';
import { LoggerService } from '../common/logger/logger.service';
import { BracketService } from '../services/bracket.service';
import { MatchService } from '../services/match.service';

@Module({
  imports: [DataAccessModule, AuthModule, CacheModule],
  controllers: [MatchController, AdminMatchResultController],
  providers: [
    ScoreUpdateService,
    ScoreUpdateGateway,
    LoggerService,
    BracketService,
    MatchService,
  ],
  exports: [BracketService, MatchService],
})
export class MatchModule {}
