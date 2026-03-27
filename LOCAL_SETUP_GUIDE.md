# Local Setup Guide - Copa América 2024 Sports Prediction System

## Prerequisites

Before starting, ensure you have installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Redis** 6+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/))

### Verify Installations

```bash
node --version      # Should be v18+
npm --version       # Should be v9+
psql --version      # Should be 12+
redis-cli --version # Should be 6+
```

## Step 1: Database Setup

### 1.1 Create PostgreSQL Database

```bash
# Connect to PostgreSQL (you may be prompted for password)
psql -U postgres

# Inside psql, run:
CREATE DATABASE copa_prediction;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;
\q
```

### 1.2 Verify PostgreSQL Connection

```bash
psql -U user -d copa_prediction -h localhost -c "SELECT 1;"
```

Expected output: `?column?` with value `1`

## Step 2: Redis Setup

### 2.1 Start Redis Server

**On macOS (with Homebrew):**
```bash
brew services start redis
```

**On Linux:**
```bash
sudo systemctl start redis-server
```

**On Windows (with WSL):**
```bash
wsl
sudo service redis-server start
```

**Or run Redis in Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

### 2.2 Verify Redis Connection

```bash
redis-cli ping
```

Expected output: `PONG`

## Step 3: Backend Setup

### 3.1 Navigate to Services Directory

```bash
cd services
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings (most defaults work for local development)
# nano .env  # or use your preferred editor
```

**Key environment variables for local development:**

```env
# Database (default values work for local setup)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=copa_prediction

# Redis (default works for local)
REDIS_URL=redis://localhost:6379

# Application
NODE_ENV=development
PORT=3000

# Authentication (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret_key_min_32_chars

# Payment (optional for local testing)
PAYMENT_API_KEY=test_key

# Feature Flags
ENABLE_TESTING_MODE=true
ENABLE_SIMULATION_API=true
```

### 3.4 Run Database Migrations

```bash
# Show pending migrations
npm run migration:show

# Run migrations to create schema
npm run migration:run
```

Expected output: Migration `CreateInitialSchema1000000000001` should run successfully.

### 3.5 Start Development Server

```bash
npm run start:dev
```

Expected output:
```
[Nest] 12345  - 01/01/2024, 12:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/01/2024, 12:00:00 PM     LOG [InstanceLoader] DatabaseModule dependencies initialized
[Nest] 12345  - 01/01/2024, 12:00:00 PM     LOG [InstanceLoader] CacheModule dependencies initialized
Application is running on port 3000
```

## Step 4: Verify Backend is Running

### 4.1 Health Check Endpoints

```bash
# Overall health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# Redis health
curl http://localhost:3000/health/redis
```

Expected responses:
```json
{
  "status": "ok",
  "database": { "status": "healthy", "message": "..." },
  "redis": { "status": "healthy", "message": "..." },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Step 5: Frontend Setup (Optional)

### 5.1 Navigate to UI Directory

```bash
cd ../ui
```

### 5.2 Install Dependencies

```bash
npm install
```

### 5.3 Configure Frontend Environment

Create `.env.local`:

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 5.4 Start Development Server

```bash
npm start
```

Frontend will be available at `http://localhost:3000` (React dev server typically uses port 3000, so backend should be on different port or use proxy).

## Step 6: Testing

### 6.1 Run Backend Tests

```bash
cd services
npm test
```

### 6.2 Run Tests in Watch Mode

```bash
npm run test:watch
```

### 6.3 Generate Coverage Report

```bash
npm run test:cov
```

## Step 7: Code Quality

### 7.1 Lint Code

```bash
npm run lint
```

### 7.2 Fix Linting Issues

```bash
npm run lint:fix
```

### 7.3 Format Code

```bash
npm run format
```

## Troubleshooting

### PostgreSQL Connection Issues

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Start PostgreSQL if not running
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

### Redis Connection Issues

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
redis-server  # Direct start
# or
brew services start redis  # macOS
sudo systemctl start redis-server  # Linux
```

### Database Migration Issues

**Error**: `Migration ... has already been run before`

**Solution**:
```bash
# Revert last migration
npm run migration:revert

# Run migrations again
npm run migration:run
```

### Port Already in Use

**Error**: `Error: listen EADDRINUSE :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux

# Or use different port
PORT=3001 npm run start:dev
```

### Module Not Found Errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### 1. Start All Services

**Terminal 1 - PostgreSQL** (if not running as service):
```bash
postgres -D /usr/local/var/postgres  # macOS
# or use service manager
```

**Terminal 2 - Redis** (if not running as service):
```bash
redis-server
```

**Terminal 3 - Backend**:
```bash
cd services
npm run start:dev
```

**Terminal 4 - Frontend** (optional):
```bash
cd ui
npm start
```

### 2. Make Code Changes

Edit files in `services/src/` for backend or `ui/src/` for frontend.

Changes will automatically reload with hot-reload enabled.

### 3. Run Tests

```bash
cd services
npm test -- --testPathPatterns="your-test-file"
```

### 4. Check Code Quality

```bash
npm run lint
npm run format
```

## API Testing

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get all matches (once implemented)
curl http://localhost:3000/api/matches

# Create prediction (once implemented)
curl -X POST http://localhost:3000/api/predictions \
  -H "Content-Type: application/json" \
  -d '{"matchId":"...", "prediction":{}}'
```

### Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Import API collection (will be created in later tasks)
3. Set base URL to `http://localhost:3000`
4. Test endpoints

### Using REST Client (VS Code)

Install REST Client extension and create `requests.http`:

```http
### Health Check
GET http://localhost:3000/health

### Get Matches
GET http://localhost:3000/api/matches

### Create Prediction
POST http://localhost:3000/api/predictions
Content-Type: application/json

{
  "matchId": "...",
  "prediction": {}
}
```

## Database Management

### View Database

```bash
# Connect to database
psql -U user -d copa_prediction

# List tables
\dt

# View table structure
\d users

# Run queries
SELECT * FROM users;

# Exit
\q
```

### Reset Database

```bash
# Revert all migrations
npm run migration:revert

# Run migrations again
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

## Performance Monitoring

### Check Database Connections

```bash
psql -U user -d copa_prediction -c "SELECT * FROM pg_stat_activity;"
```

### Monitor Redis

```bash
redis-cli
> INFO
> DBSIZE
> KEYS *
```

### View Application Logs

Logs are stored in `services/logs/`:

```bash
tail -f services/logs/combined.log
tail -f services/logs/error.log
```

## Next Steps

1. **Complete remaining tasks** - Continue with tasks 5-67
2. **Seed tournament data** - Task 6 will populate teams and matches
3. **Implement authentication** - Tasks 7-10
4. **Build prediction system** - Tasks 11-18
5. **Create API endpoints** - Tasks 46-51
6. **Build frontend** - Tasks 52-62

## Useful Commands Reference

```bash
# Backend
cd services
npm install              # Install dependencies
npm run start:dev        # Start development server
npm test                 # Run tests
npm run lint             # Check code quality
npm run format           # Format code
npm run build            # Build for production
npm start                # Run production build

# Database
npm run migration:show   # Show pending migrations
npm run migration:run    # Run migrations
npm run migration:revert # Revert last migration

# Frontend
cd ../ui
npm install              # Install dependencies
npm start                # Start development server
npm test                 # Run tests
npm run build            # Build for production
```

## Getting Help

- Check logs in `services/logs/`
- Review error messages in terminal
- Check `.env` configuration
- Verify all services are running (PostgreSQL, Redis)
- Review task documentation in `.kiro/specs/sports-prediction-system/`

## Production Deployment

For production deployment, see `services/README.md` and deployment configuration in Task 66.

---

**Happy coding!** 🚀
