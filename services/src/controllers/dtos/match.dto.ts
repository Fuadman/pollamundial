import { IsString, IsDate, IsOptional, IsNumber } from 'class-validator';

/**
 * Timezone information for a match time
 */
export class TimezoneInfoDto {
  @IsDate()
  utcTime!: Date;

  @IsDate()
  localTime!: Date;

  @IsNumber()
  offsetMinutes!: number;

  @IsString()
  abbreviation!: string;
}

/**
 * Match response DTO with timezone-aware times
 */
export class MatchResponseDto {
  @IsString()
  id!: string;

  @IsString()
  team1Id!: string;

  @IsString()
  team2Id!: string;

  @IsString()
  team1Name!: string;

  @IsString()
  team2Name!: string;

  @IsOptional()
  @IsString()
  team1Code?: string;

  @IsOptional()
  @IsString()
  team2Code?: string;

  scheduledTime!: TimezoneInfoDto;

  lockdownTime!: TimezoneInfoDto;

  @IsString()
  status!: string;

  @IsString()
  phase!: string;

  @IsOptional()
  @IsString()
  groupStageGroup?: string | null;

  @IsOptional()
  @IsString()
  eliminationRound?: string | null;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsOptional()
  result?: {
    team1Score: number;
    team2Score: number;
    winner?: string | null;
    isDraw: boolean;
    publishedTimestamp: Date;
  };
}

/**
 * Match list response DTO
 */
export class MatchListResponseDto {
  matches!: MatchResponseDto[];

  @IsNumber()
  total!: number;
}
