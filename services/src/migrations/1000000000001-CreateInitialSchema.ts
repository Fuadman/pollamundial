import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateInitialSchema1000000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create teams table
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '3',
            isUnique: true,
          },
          {
            name: 'group_stage_group',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on code
    await queryRunner.createIndex(
      'teams',
      new TableIndex({
        name: 'IDX_teams_code',
        columnNames: ['code'],
      }),
    );

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'google_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'registration_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'payment_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'registration_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'payment_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes on users
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_google_id',
        columnNames: ['google_id'],
      }),
    );

    // Create matches table
    await queryRunner.createTable(
      new Table({
        name: 'matches',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'team1_id',
            type: 'uuid',
          },
          {
            name: 'team2_id',
            type: 'uuid',
          },
          {
            name: 'scheduled_time',
            type: 'timestamp',
          },
          {
            name: 'lockdown_time',
            type: 'timestamp',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'scheduled'",
          },
          {
            name: 'phase',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'group_stage_group',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'elimination_round',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for matches
    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        columnNames: ['team1_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'matches',
      new TableForeignKey({
        columnNames: ['team2_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'RESTRICT',
      }),
    );

    // Create indexes on matches
    await queryRunner.createIndex(
      'matches',
      new TableIndex({
        name: 'IDX_matches_scheduled_time',
        columnNames: ['scheduled_time'],
      }),
    );

    await queryRunner.createIndex(
      'matches',
      new TableIndex({
        name: 'IDX_matches_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'matches',
      new TableIndex({
        name: 'IDX_matches_phase',
        columnNames: ['phase'],
      }),
    );

    await queryRunner.createIndex(
      'matches',
      new TableIndex({
        name: 'IDX_matches_team1_team2',
        columnNames: ['team1_id', 'team2_id'],
      }),
    );

    // Create match_results table
    await queryRunner.createTable(
      new Table({
        name: 'match_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'match_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'team1_score',
            type: 'int',
          },
          {
            name: 'team2_score',
            type: 'int',
          },
          {
            name: 'winner_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_draw',
            type: 'boolean',
            default: false,
          },
          {
            name: 'published_timestamp',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for match_results
    await queryRunner.createForeignKey(
      'match_results',
      new TableForeignKey({
        columnNames: ['match_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'matches',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'match_results',
      new TableForeignKey({
        columnNames: ['winner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'SET NULL',
      }),
    );

    // Create index on match_results
    await queryRunner.createIndex(
      'match_results',
      new TableIndex({
        name: 'IDX_match_results_match_id',
        columnNames: ['match_id'],
      }),
    );

    // Create predictions table
    await queryRunner.createTable(
      new Table({
        name: 'predictions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'match_id',
            type: 'uuid',
          },
          {
            name: 'predicted_team1_score',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'predicted_team2_score',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'predicted_winner_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'predicted_draw',
            type: 'boolean',
            default: false,
          },
          {
            name: 'submission_timestamp',
            type: 'timestamp',
          },
          {
            name: 'locked_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'points_earned',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for predictions
    await queryRunner.createForeignKey(
      'predictions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'predictions',
      new TableForeignKey({
        columnNames: ['match_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'matches',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique constraint on predictions
    await queryRunner.createIndex(
      'predictions',
      new TableIndex({
        name: 'UQ_predictions_user_match',
        columnNames: ['user_id', 'match_id'],
        isUnique: true,
      }),
    );

    // Create indexes on predictions
    await queryRunner.createIndex(
      'predictions',
      new TableIndex({
        name: 'IDX_predictions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'predictions',
      new TableIndex({
        name: 'IDX_predictions_match_id',
        columnNames: ['match_id'],
      }),
    );

    await queryRunner.createIndex(
      'predictions',
      new TableIndex({
        name: 'IDX_predictions_locked_timestamp',
        columnNames: ['locked_timestamp'],
      }),
    );

    // Create user_scores table
    await queryRunner.createTable(
      new Table({
        name: 'user_scores',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'total_points',
            type: 'int',
            default: 0,
          },
          {
            name: 'group_stage_points',
            type: 'int',
            default: 0,
          },
          {
            name: 'elimination_points',
            type: 'int',
            default: 0,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key for user_scores
    await queryRunner.createForeignKey(
      'user_scores',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on user_scores
    await queryRunner.createIndex(
      'user_scores',
      new TableIndex({
        name: 'IDX_user_scores_total_points',
        columnNames: ['total_points'],
      }),
    );

    // Create news_articles table
    await queryRunner.createTable(
      new Table({
        name: 'news_articles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'published_timestamp',
            type: 'timestamp',
          },
          {
            name: 'modified_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'archived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes on news_articles
    await queryRunner.createIndex(
      'news_articles',
      new TableIndex({
        name: 'IDX_news_articles_published_timestamp',
        columnNames: ['published_timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'news_articles',
      new TableIndex({
        name: 'IDX_news_articles_archived',
        columnNames: ['archived'],
      }),
    );

    // Create simulation_data table
    await queryRunner.createTable(
      new Table({
        name: 'simulation_data',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'prediction_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'match_result_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_test_data',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for simulation_data
    await queryRunner.createForeignKey(
      'simulation_data',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'simulation_data',
      new TableForeignKey({
        columnNames: ['prediction_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'predictions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'simulation_data',
      new TableForeignKey({
        columnNames: ['match_result_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'match_results',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes on simulation_data
    await queryRunner.createIndex(
      'simulation_data',
      new TableIndex({
        name: 'IDX_simulation_data_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'simulation_data',
      new TableIndex({
        name: 'IDX_simulation_data_prediction_id',
        columnNames: ['prediction_id'],
      }),
    );

    await queryRunner.createIndex(
      'simulation_data',
      new TableIndex({
        name: 'IDX_simulation_data_match_result_id',
        columnNames: ['match_result_id'],
      }),
    );

    await queryRunner.createIndex(
      'simulation_data',
      new TableIndex({
        name: 'IDX_simulation_data_is_test_data',
        columnNames: ['is_test_data'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order of creation
    await queryRunner.dropTable('simulation_data', true);
    await queryRunner.dropTable('news_articles', true);
    await queryRunner.dropTable('user_scores', true);
    await queryRunner.dropTable('predictions', true);
    await queryRunner.dropTable('match_results', true);
    await queryRunner.dropTable('matches', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('teams', true);
  }
}
