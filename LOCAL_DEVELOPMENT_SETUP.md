# Local Development Setup Guide

## Overview

This guide walks you through setting up the Copa América 2024 Sports Prediction System for local development. The system consists of:

- **Backend**: NestJS API (Node.js/TypeScript)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Frontend**: React (to be implemented)

## Prerequisites

Before starting, ensure you have installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Redis** 6+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/))

### Verify Installations

```bash
node --version      # Should be v18+
npm --version       # Should be 9+
psql --version      # Should be 12+
redis-cli --version # Should be 6+
```

## Step 1: Set Up PostgreSQL Database

### 1.1 Start PostgreSQL

**On macOS (Homebrew)**:
```bash
brew services start postgresql
```

**On Linux (Ubuntu/Debian)**:
```bash
sudo systemctl start postgresql
```

**On Windows**:
- PostgreSQL should start automatically after installation
- Or use: `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`

### 1.2 Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, run:
CREATE DATABASE copa_prediction;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;
\q
```

### 1.3 Verify Connection

```bash
psql -U user -d copa_prediction -h localhost
# Should connect successfully
\q
```

## Step 2: Set Up Redis

### 2.1 Start Redis Server

**On macOS (Homebrew)**:
```bash
brew services start redis
```

**On Linux (Ubuntu/Debian)**:
```bash
sudo systemctl start redis-server
```

**On Windows**:
- Use Windows Subsystem for Linux (WSL) with the Linux commands above
- Or use Docker: `docker run -d -p 6379:6379 redis:latest`

### 2.2 Verify Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

## Step 3: Set Up Backend (NestJS)

### 3.1 Navigate to Services Directory

```bash
cd services
```

### 3.2 Install Dependencies

```bash
npm install
```

This will install all required packages including:
- NestJS framework
- TypeORM for database
- Redis client
- Passport for authentication
- And more...

### 3.3 Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=copa_prediction

# Redis
REDIS_URL=redis://localhost:6379

# Authentication (optional for local development)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRATION=3600

# Payment (optional for local development)
PAYMENT_API_KEY=test_key

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
TIMEZONE=America/La_Paz

# Feature Flags
ENABLE_TESTING_MODE=true
ENABLE_SIMULATION_API=true
```

### 3.4 Run Database Migrations

```bash
# Show pending migrations
npm run migration:show

# Run migrations to create tables
npm run migration:run
```

You should see output like:
```
Migration CreateInitialSchema1000000000001 has been executed successfully.
```

### 3.5 Start Development Server

```bash
npm run start:dev
```

You should see output like:
```
[Nest] 12345  - 01/01/2024, 12:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/01/2024, 12:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/01/2024, 12:00:00 PM     LOG Application is running on port 3000
```

### 3.6 Verify Backend is Running

Open a new terminal and test the API:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","database":{"status":"healthy","message":"Database connection is active"},"redis":{"status":"healthy","message":"Redis connection is active"},"timestamp":"2024-01-01T00:00:00.000Z"}
```

## Step 4: Verify All Services

### 4.1 Check Database Connection

```bash
# In the services directory
npm run migration:show

# Should show migration status
```

### 4.2 Check Redis Connection

```bash
redis-cli
> PING
PONG
> QUIT
```

### 4.3 Check API Health

```bash
curl http://localhost:3000/health/db
curl http://localhost:3000/health/redis
```

## Step 5: Running Tests

### 5.1 Run All Tests

```bash
npm test
```

### 5.2 Run Tests in Watch Mode

```bash
npm test:watch
```

### 5.3 Generate Coverage Report

```bash
npm run test:cov
```

## Step 6: Code Quality

### 6.1 Lint Code

```bash
npm run lint
```

### 6.2 Fix Linting Issues

```bash
npm run lint:fix
```

### 6.3 Format Code

```bash
npm run format
```

## Step 7: Build for Production

### 7.1 Compile TypeScript

```bash
npm run build
```

This creates a `dist/` directory with compiled JavaScript.

### 7.2 Run Production Build

```bash
npm start
```

## Troubleshooting

### PostgreSQL Connection Issues

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
1. Verify PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
2. Check credentials in `.env` file
3. Verify database exists: `psql -U user -d copa_prediction -h localhost`

### Redis Connection Issues

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solutions**:
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL in `.env` file
3. Start Redis: `brew services start redis` (macOS) or `sudo systemctl start redis-server` (Linux)

### Port Already in Use

**Error**: `Error: listen EADDRINUSE :::3000`

**Solutions**:
1. Change PORT in `.env` file to a different port (e.g., 3001)
2. Kill process using port 3000:
   - macOS/Linux: `lsof -ti:3000 | xargs kill -9`
   - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`

### Migration Issues

**Error**: `Migration ... has already been run before`

**Solutions**:
1. Check migration status: `npm run migration:show`
2. Revert last migration: `npm run migration:revert`
3. Verify database is clean and retry

### Dependencies Installation Issues

**Error**: `npm ERR! code ERESOLVE`

**Solutions**:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Reinstall: `npm install`

## Development Workflow

### 1. Start All Services

**Terminal 1 - PostgreSQL** (usually runs in background):
```bash
# macOS
brew services start postgresql
# Linux
sudo systemctl start postgresql
```

**Terminal 2 - Redis** (usually runs in background):
```bash
# macOS
brew services start redis
# Linux
sudo systemctl start redis-server
```

**Terminal 3 - NestJS Backend**:
```bash
cd services
npm run start:dev
```

### 2. Make Code Changes

Edit files in `services/src/` and the server will automatically reload (hot reload enabled).

### 3. Run Tests

```bash
npm test
```

### 4. Check Code Quality

```bash
npm run lint
npm run format
```

### 5. Commit Changes

```bash
git add .
git commit -m "Your commit message"
```

## Database Management

### View Database Schema

```bash
psql -U user -d copa_prediction -h localhost

# In psql:
\dt                    # List all tables
\d users               # Describe users table
\d+ predictions        # Describe predictions table with details
SELECT * FROM users;   # Query users
\q                     # Quit
```

### Reset Database

```bash
# Revert all migrations
npm run migration:revert

# Or manually drop and recreate
psql -U user -d copa_prediction -h localhost
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

# Then run migrations again
npm run migration:run
```

### Backup Database

```bash
pg_dump -U user -d copa_prediction > backup.sql
```

### Restore Database

```bash
psql -U user -d copa_prediction < backup.sql
```

## Redis Management

### View Redis Data

```bash
redis-cli

# In redis-cli:
KEYS *                           # List all keys
GET session:token123            # Get a session
ZRANGE leaderboard:all 0 -1     # Get leaderboard
FLUSHDB                         # Clear all data
QUIT
```

## API Endpoints (Current)

### Health Checks

- `GET /` - API greeting
- `GET /health` - Overall health status
- `GET /health/db` - Database health
- `GET /health/redis` - Redis health

## Next Steps

1. **Implement Task 5**: TypeORM repositories and services
2. **Implement Task 6**: Seed initial tournament data
3. **Implement Tasks 7-10**: Authentication and authorization
4. **Implement Tasks 11-18**: Core prediction system and scoring
5. **Set up Frontend**: React application (Task 52+)

## Useful Commands Reference

```bash
# Backend Development
npm run start:dev          # Start development server
npm test                   # Run tests
npm run lint              # Check code quality
npm run format            # Format code
npm run build             # Build for production

# Database
npm run migration:show    # Show migration status
npm run migration:run     # Run migrations
npm run migration:revert  # Revert last migration

# Database Management
psql -U user -d copa_prediction -h localhost

# Redis Management
redis-cli

# Git
git status
git add .
git commit -m "message"
git push
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| DATABASE_HOST | PostgreSQL host | localhost |
| DATABASE_PORT | PostgreSQL port | 5432 |
| DATABASE_USER | PostgreSQL user | user |
| DATABASE_PASSWORD | PostgreSQL password | password |
| DATABASE_NAME | Database name | copa_prediction |
| REDIS_URL | Redis connection URL | redis://localhost:6379 |
| NODE_ENV | Environment | development |
| PORT | API port | 3000 |
| LOG_LEVEL | Logging level | debug |
| TIMEZONE | Application timezone | America/La_Paz |
| ENABLE_TESTING_MODE | Enable test mode | true |
| ENABLE_SIMULATION_API | Enable simulation endpoints | true |

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in `services/logs/` directory
3. Check `.env` configuration
4. Verify all services are running
5. Review the README files in each module

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Express.js Documentation](https://expressjs.com/)

---

**Happy coding!** 🚀
