import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { MatchResult } from '../entities/match-result.entity';
import { Match, MatchStatus } from '../entities/match.entity';
import { ScoringService } from '../services/scoring.service';
import { BracketService } from '../services/bracket.service';
import { ScoreUpdateGateway } from '../gateways/score-update.gateway';

@Injectable()
@EventSubscriber()
export class MatchResultSubscriber implements EntitySubscriberInterface<MatchResult> {
  constructor(
    dataSource: DataSource,
    private readonly scoringService: ScoringService,
    private readonly bracketService: BracketService,
    private readonly scoreUpdateGateway: ScoreUpdateGateway,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return MatchResult;
  }

  async afterInsert(event: InsertEvent<MatchResult>): Promise<void> {
    const matchId = event.entity?.matchId;
    if (!matchId) {
      return;
    }

    await event.manager.update(Match, { id: matchId }, { status: MatchStatus.COMPLETED });

    try {
      await this.scoringService.calculateAllScoresForMatch(matchId);
    } catch (error) {
      console.error(`Failed to calculate scores for match ${matchId}:`, error);
    }

    try {
      await this.bracketService.autoAdvanceFromMatch(matchId);
    } catch (error) {
      console.error(`Failed to auto-generate next phase after match ${matchId}:`, error);
    }

    this.scoreUpdateGateway.broadcastMatchResult(matchId, '⚽ Resultado publicado');
  }

  async afterUpdate(event: UpdateEvent<MatchResult>): Promise<void> {
    const matchId = event.entity?.matchId ?? event.databaseEntity?.matchId;
    if (!matchId) {
      return;
    }

    await event.manager.update(Match, { id: matchId }, { status: MatchStatus.COMPLETED });

    try {
      await this.scoringService.recalculateScoresForMatch(matchId);
    } catch (error) {
      console.error(`Failed to recalculate scores for match ${matchId}:`, error);
    }

    try {
      await this.bracketService.autoAdvanceFromMatch(matchId);
    } catch (error) {
      console.error(
        `Failed to auto-generate next phase after result update for match ${matchId}:`,
        error,
      );
    }

    this.scoreUpdateGateway.broadcastMatchResult(matchId, '⚽ Resultado actualizado');
  }
}
