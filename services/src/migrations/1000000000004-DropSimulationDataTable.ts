import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSimulationDataTable1000000000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('simulation_data');
    if (hasTable) {
      await queryRunner.dropTable('simulation_data', true);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('simulation_data');
    if (hasTable) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE simulation_data (
        id uuid PRIMARY KEY,
        user_id uuid NULL,
        prediction_id uuid NULL,
        match_result_id uuid NULL,
        is_test_data boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT FK_simulation_data_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_simulation_data_prediction FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE,
        CONSTRAINT FK_simulation_data_match_result FOREIGN KEY (match_result_id) REFERENCES match_results(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IDX_simulation_data_user_id ON simulation_data(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_simulation_data_prediction_id ON simulation_data(prediction_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_simulation_data_match_result_id ON simulation_data(match_result_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_simulation_data_is_test_data ON simulation_data(is_test_data);`,
    );
  }
}
