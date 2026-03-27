# Database Setup and Migration Guide

## Overview

This document describes the PostgreSQL database setup and TypeORM migration framework for the Copa América 2024 Sports Prediction System.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ installed
- Environment variables configured in `.env` file

## Environment Configuration

Create a `.env` file in the `services` directory with the following variables:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=copa_prediction

# Application
NODE_ENV=development
PORT=3000
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE copa_prediction;

# Create user (if not exists)
CREATE USER user WITH PASSWORD 'password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;

# Exit psql
\q
```

### 2. Install Dependencies

```bash
cd services
npm install
```

## TypeORM Migration Framework

### Configuration Files

- **ormconfig.ts**: TypeORM CLI configuration file for running migrations
- **src/migrations/**: Directory containing all migration files
- **src/database/database.module.ts**: NestJS module for database configuration

### Migration Commands

#### Generate a New Migration

After modifying entities, generate a migration:

```bash
npm run migration:generate -- src/migrations/MigrationName
```

Example:
```bash
npm run migration:generate -- src/migrations/CreateUsersTable
```

#### Create an Empty Migration

For manual migration creation:

```bash
npm run migration:create -- src/migrations/MigrationName
```

#### Run Pending Migrations

```bash
npm run migration:run
```

#### Revert Last Migration

```bash
npm run migration:revert
```

#### Show Migration Status

```bash
npm run migration:show
```

## Connection Health Checks

### Health Check Endpoints

The application provides health check endpoints:

- **GET /health** - Overall application health
- **GET /health/db** - Database connection health

### Health Check Response

```json
{
  "status": "healthy",
  "message": "Database connection is active"
}
```

### Retry Logic

The database service implements automatic retry logic:

- **Max Retries**: 5 attempts
- **Retry Delay**: 3 seconds between attempts
- **Automatic Initialization**: Connection is established on module initialization

### Manual Health Check

```typescript
import { DatabaseService } from './database/database.service';

constructor(private databaseService: DatabaseService) {}

async checkHealth() {
  const health = await this.databaseService.healthCheck();
  console.log(health);
}
```

## Development Workflow

### 1. Start Development Server

```bash
npm run start:dev
```

The application will:
1. Load environment variables from `.env`
2. Attempt to connect to PostgreSQL with retry logic
3. Run pending migrations automatically
4. Start the NestJS server on port 3000

### 2. Create New Entity

Create a new entity file in `src/entities/`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;
}
```

### 3. Generate Migration

```bash
npm run migration:generate -- src/migrations/CreateUsersTable
```

### 4. Review and Run Migration

```bash
npm run migration:run
```

## Production Deployment

### Pre-Deployment Checklist

1. Set `NODE_ENV=production` in environment variables
2. Configure SSL for database connection
3. Run migrations before starting the application
4. Verify database backups are in place

### Running Migrations in Production

```bash
# Show pending migrations
npm run migration:show

# Run migrations
npm run migration:run
```

## Troubleshooting

### Connection Refused

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check DATABASE_HOST and DATABASE_PORT in `.env`
3. Verify database credentials

### Authentication Failed

**Error**: `FATAL: password authentication failed for user "user"`

**Solution**:
1. Verify DATABASE_USER and DATABASE_PASSWORD in `.env`
2. Reset PostgreSQL user password:
   ```bash
   sudo -u postgres psql
   ALTER USER user WITH PASSWORD 'new_password';
   ```

### Migration Conflicts

**Error**: `Migration ... has already been run before`

**Solution**:
1. Check migration history: `npm run migration:show`
2. Verify migration files are not duplicated
3. If needed, manually revert: `npm run migration:revert`

### Database Not Found

**Error**: `database "copa_prediction" does not exist`

**Solution**:
1. Create the database: `createdb -U user copa_prediction`
2. Or use psql to create it (see Database Setup section)

## Best Practices

1. **Always generate migrations** after entity changes
2. **Review generated migrations** before running
3. **Test migrations** in development before production
4. **Keep migrations small** and focused on one change
5. **Never modify** already-run migrations
6. **Use transactions** for data migrations
7. **Document** complex migrations with comments

## References

- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
