import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class SubmitPredictionDto {
  @IsUUID()
  matchId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  predictedTeam1Score?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  predictedTeam2Score?: number | null;

  @IsOptional()
  @IsString()
  predictedWinnerId?: string | null;

  @IsBoolean()
  predictedDraw!: boolean;
}

export class UpdatePredictionDto {
  @IsOptional()
  @IsUUID()
  matchId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  predictedTeam1Score?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  predictedTeam2Score?: number | null;

  @IsOptional()
  @IsString()
  predictedWinnerId?: string | null;

  @IsOptional()
  @IsBoolean()
  predictedDraw?: boolean;
}
