import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPredictionsBlockedToMatches1000000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'matches',
      new TableColumn({
        name: 'predictions_blocked',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('matches', 'predictions_blocked');
  }
}
