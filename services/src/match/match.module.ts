import { Module } from '@nestjs/common';
import { MatchController } from '../controllers/match.controller';
import { PredictionController } from '../controllers/prediction.controller';
import { LeaderboardController } from '../controllers/leaderboard.controller';
import { AdminMatchResultController } from '../controllers/admin-match-result.controller';
import { AdminBracketController } from '../controllers/admin-bracket.controller';
import { AdminUserController } from '../controllers/admin-user.controller';
import { SimulationController } from '../controllers/simulation.controller';
import { DataAccessModule } from '../data-access/data-access.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { ScoreUpdateService } from '../services/score-update.service';
import { ScoreUpdateGateway } from '../gateways/score-update.gateway';
import { LoggerService } from '../common/logger/logger.service';
import { BracketService } from '../services/bracket.service';
import { MatchService } from '../services/match.service';
import { SimulationService } from '../services/simulation.service';
import { MatchResultSubscriber } from '../subscribers/match-result.subscriber';

@Module({
  imports: [DataAccessModule, AuthModule, CacheModule],
  controllers: [
    MatchController,
    PredictionController,
    LeaderboardController,
    AdminMatchResultController,
    AdminBracketController,
    AdminUserController,
    SimulationController,
  ],
  providers: [
    ScoreUpdateService,
    ScoreUpdateGateway,
    LoggerService,
    BracketService,
    MatchService,
    SimulationService,
    MatchResultSubscriber,
  ],
  exports: [BracketService, MatchService],
})
export class MatchModule {}
