import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PredictionService } from '../services/prediction.service';
import { SubmitPredictionDto, UpdatePredictionDto } from './dtos/prediction.dto';

@Controller('api/predictions')
@UseGuards(JwtAuthGuard)
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  async submitPrediction(@Body() dto: SubmitPredictionDto, @Req() req: any) {
    return this.predictionService.submitPrediction(
      req.user.id,
      dto.matchId,
      dto.predictedTeam1Score ?? undefined,
      dto.predictedTeam2Score ?? undefined,
      dto.predictedWinnerId ?? undefined,
      dto.predictedDraw,
    );
  }

  @Get('user/:userId')
  async getUserPredictions(@Param('userId') userId: string, @Req() req: any) {
    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own predictions');
    }

    return this.predictionService.getUserPredictions(userId);
  }

  @Get(':matchId')
  async getPredictionForMatch(@Param('matchId') matchId: string, @Req() req: any) {
    return this.predictionService.getPredictionByUserAndMatch(req.user.id, matchId);
  }

  @Put(':predictionId')
  async updatePrediction(
    @Param('predictionId') predictionId: string,
    @Body() dto: UpdatePredictionDto,
    @Req() req: any,
  ) {
    return this.predictionService.editPrediction(
      req.user.id,
      predictionId,
      dto.predictedTeam1Score ?? undefined,
      dto.predictedTeam2Score ?? undefined,
      dto.predictedWinnerId ?? undefined,
      dto.predictedDraw,
    );
  }
}
