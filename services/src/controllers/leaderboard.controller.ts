import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserScoreService } from '../services/user-score.service';
import { MatchResultService } from '../services/match-result.service';

type LeaderboardPhase = 'all' | 'group' | 'elimination';

@Controller('api/leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(
    private readonly userScoreService: UserScoreService,
    private readonly matchResultService: MatchResultService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getLeaderboard(
    @Query('phase') phaseQuery?: string,
    @Query('page') pageQuery?: string,
    @Query('limit') limitQuery?: string,
  ) {
    const phase = (phaseQuery ?? 'all') as LeaderboardPhase;
    if (!['all', 'group', 'elimination'].includes(phase)) {
      throw new BadRequestException('Invalid leaderboard phase');
    }

    const page = Math.max(parseInt(pageQuery ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitQuery ?? '50', 10) || 50, 1), 200);

    const { rows, total } = await this.userScoreService.getLeaderboardPage(
      phase,
      page,
      limit,
    );
    const publishedResults = await this.matchResultService.countResults();
    const hasPublishedResults = publishedResults > 0;

    const offset = (page - 1) * limit;

    return {
      data: rows.map((row, index) => ({
        rank: offset + index + 1,
        userId: row.userId,
        name: row.user?.name ?? 'Usuario',
        email: row.user?.email ?? '',
        totalPoints: hasPublishedResults ? row.totalPoints : 0,
        groupStagePoints: hasPublishedResults ? row.groupStagePoints : 0,
        eliminationPoints: hasPublishedResults ? row.eliminationPoints : 0,
        registrationTimestamp: row.user?.registrationTimestamp,
      })),
      total,
      page,
      limit,
    };
  }

  @Get('user/:userId')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getUserEntry(@Param('userId') userId: string, @Req() req: any) {
    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own leaderboard entry');
    }

    const score = await this.userScoreService.getUserScore(userId);
    const rank = await this.userScoreService.getLeaderboardRank(userId);
    const publishedResults = await this.matchResultService.countResults();
    const hasPublishedResults = publishedResults > 0;

    return {
      rank: rank ?? 0,
      userId: score.userId,
      name: score.user?.name ?? 'Usuario',
      email: score.user?.email ?? '',
      totalPoints: hasPublishedResults ? score.totalPoints : 0,
      groupStagePoints: hasPublishedResults ? score.groupStagePoints : 0,
      eliminationPoints: hasPublishedResults ? score.eliminationPoints : 0,
      registrationTimestamp: score.user?.registrationTimestamp,
    };
  }
}
