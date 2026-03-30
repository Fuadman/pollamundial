import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPenaltiesToMatchResults1000000000005
  implements MigrationInterface
{
  name = 'AddPenaltiesToMatchResults1000000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "match_results" ADD COLUMN IF NOT EXISTS "team1PenaltyScore" integer',
    );
    await queryRunner.query(
      'ALTER TABLE "match_results" ADD COLUMN IF NOT EXISTS "team2PenaltyScore" integer',
    );
    await queryRunner.query(
      'ALTER TABLE "match_results" ADD COLUMN IF NOT EXISTS "decidedByPenalties" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "match_results" DROP COLUMN IF EXISTS "decidedByPenalties"',
    );
    await queryRunner.query(
      'ALTER TABLE "match_results" DROP COLUMN IF EXISTS "team2PenaltyScore"',
    );
    await queryRunner.query(
      'ALTER TABLE "match_results" DROP COLUMN IF EXISTS "team1PenaltyScore"',
    );
  }
}
