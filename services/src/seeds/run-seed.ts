import { DataSource } from 'typeorm';
import { seedCopaMundial2026 } from './copa-mundial-2026.seed';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
    username: process.env.DATABASE_USER || process.env.DB_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || process.env.DB_NAME || 'copa_prediction',
    entities: ['src/entities/**/*.entity.ts'],
    migrations: ['src/migrations/**/*.ts'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const force = process.argv.includes('--force');
    if (force) {
      console.log('--force flag detected: will clear existing data before seeding');
    }

    await seedCopaMundial2026(dataSource, force);

    await dataSource.destroy();
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
