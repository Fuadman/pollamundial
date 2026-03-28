import { IsString, IsDate, IsOptional, IsNumber } from 'class-validator';

/**
 * Team response DTO
 */
export class TeamDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  groupStageGroup?: string | null;
}

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

  team1!: TeamDto;
  team2!: TeamDto;

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

  predictionsBlocked!: boolean;

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
