import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1000000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // This is a template migration. Actual migrations will be generated
    // using: npm run migration:generate -- src/migrations/MigrationName
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic
  }
}
