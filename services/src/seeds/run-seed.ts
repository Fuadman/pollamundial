import { DataSource } from 'typeorm';
import { seedCopaAmerica2024 } from './copa-america-2024.seed';
import { seedCopaMundial2026 } from './copa-mundial-2026.seed';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sports_prediction',
    entities: ['src/entities/**/*.entity.ts'],
    migrations: ['src/migrations/**/*.ts'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Seed Copa América 2024 (if not already seeded)
    await seedCopaAmerica2024(dataSource);

    // Seed Copa Mundial 2026
    await seedCopaMundial2026(dataSource);

    await dataSource.destroy();
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
