# Copa América Prediction System

Central project README for the current repository state.

## Overview

This repository currently contains a backend-first implementation of a sports prediction system for Copa América.

- `services/`: NestJS API, TypeORM entities and migrations, Redis cache integration, health endpoints.
- `ui/`: present but currently empty.
- root docs: legacy setup notes and summaries from earlier implementation steps.

At the moment, the runnable application is the backend API. There is no frontend application checked into `ui/` yet.

## Current Stack

- Node.js 18+
- NestJS + TypeScript
- PostgreSQL
- Redis
- TypeORM
- Jest
- Docker + Docker Compose

## What Is Implemented

- NestJS service bootstrap and module wiring
- PostgreSQL connection and TypeORM integration
- Redis client integration with retry logic
- Initial entity model and migrations
- Health endpoints:
   - `GET /`
   - `GET /health`
   - `GET /health/db`
   - `GET /health/redis`

## Project Layout

```text
.
├── docker-compose.yml        # Docker entrypoint for local runtime
├── services/
│   ├── Dockerfile            # Backend container image
│   ├── .dockerignore
│   ├── package.json
│   ├── ormconfig.ts
│   └── src/
└── ui/                       # Empty placeholder for future frontend
```

## Quick Start

### Option 1: Run Everything With Docker

Requirements:

- Docker
- Docker Compose v2 (`docker compose`)

Start the stack from the repository root:

```bash
docker compose up --build
```

This starts:

- `api` on `http://localhost:3001` by default
- `postgres` inside the Compose network
- `redis` inside the Compose network

The API container automatically runs TypeORM migrations before starting the server.

Stop the stack:

```bash
docker compose down
```

Stop and remove persisted database/cache volumes:

```bash
docker compose down -v
```

Verify the API:

```bash
curl http://localhost:3001/health
```

If you want Docker to publish the API on a different host port, set `API_PORT` when starting Compose.

### Option 2: Run Backend Locally

Requirements:

- Node.js 18+
- PostgreSQL running locally
- Redis running locally

Create the database and user:

```bash
psql -U postgres -c "CREATE DATABASE copa_prediction;"
psql -U postgres -c "CREATE USER user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;"
```

Start the service:

```bash
cd services
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

The default environment file sets `DATABASE_SSL=false`, which is correct for local PostgreSQL and the included Docker stack.

## Docker Files Added In This Repository

- `docker-compose.yml`: boots API, PostgreSQL, and Redis together.
- `services/Dockerfile`: builds and runs the NestJS backend.
- `services/.dockerignore`: keeps the build context small and avoids copying local artifacts.

## Useful Commands

From `services/`:

```bash
npm run build
npm test
npm run lint
npm run migration:show
npm run migration:run
npm run migration:revert
```

From the repository root:

```bash
docker compose up --build
docker compose logs -f api
docker compose exec postgres psql -U user -d copa_prediction
docker compose exec redis redis-cli
```

## Notes About Repository State

- The root documentation was previously split across multiple setup files. This README is intended to be the primary entry point.
- `services/package.json` migration scripts now use the explicit TypeORM datasource file so both local and containerized workflows resolve the same config.
- The frontend is not implemented in this repository yet, so the Docker setup only covers the backend and its dependencies.

## Related Docs

- `DOCKER_SETUP.md`
- `LOCAL_DEVELOPMENT_SETUP.md`
- `QUICK_START.md`
- `services/README.md`
- `services/DATABASE_SETUP.md`
- `services/REDIS_SETUP_SUMMARY.md`

**User**
- id (UUID)
- googleId (unique)
- email (unique)
- name
- registrationCompleted
- paymentCompleted
- registrationTimestamp
- paymentTimestamp

**Team**
- id (UUID)
- name
- code (unique, 3-letter)
- groupStageGroup (A-H)

**Match**
- id (UUID)
- team1Id, team2Id (FKs)
- scheduledTime (UTC)
- lockdownTime (15 min before scheduled)
- status (scheduled, in_progress, completed, postponed)
- phase (group, elimination)
- groupStageGroup (for group stage)
- eliminationRound (R16, QF, SF, THIRD, FINAL)

**Prediction**
- id (UUID)
- userId, matchId (FKs)
- predictedTeam1Score, predictedTeam2Score
- predictedWinnerId
- predictedDraw
- submissionTimestamp
- lockedTimestamp
- pointsEarned

**UserScore**
- id (UUID)
- userId (FK, unique)
- totalPoints
- groupStagePoints
- eliminationPoints

**MatchResult**
- id (UUID)
- matchId (FK, unique)
- team1Score, team2Score
- winnerId (FK, nullable)
- isDraw
- publishedTimestamp

**NewsArticle**
- id (UUID)
- title
- content
- publishedTimestamp
- modifiedTimestamp
- archived

**SimulationData**
- id (UUID)
- userId, predictionId, matchResultId (FKs, nullable)
- isTestData

## 🔐 Security Features

- Google OAuth 2.0 authentication
- JWT token-based sessions
- Role-based access control (RBAC)
- Input validation with class-validator
- Global exception handling
- Audit logging for admin actions
- Password hashing for sensitive data
- CORS configuration
- Rate limiting (to be implemented)

## 🧪 Testing

```bash
cd services

# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm run test:cov

# Run specific test file
npm test -- --testPathPattern="database"
```

## 📈 Performance Optimizations

- Redis caching for leaderboards (5-min TTL)
- Database indexes on frequently queried columns
- Connection pooling for PostgreSQL and Redis
- Sorted sets for efficient leaderboard ranking
- Lazy loading of relationships
- Query optimization with TypeORM

## 🚀 Deployment

### Production Build
```bash
cd services
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

### Environment Configuration
```env
NODE_ENV=production
DATABASE_HOST=prod-db.example.com
REDIS_URL=redis://prod-redis.example.com:6379
JWT_SECRET=your_production_secret
```

## 🐛 Troubleshooting

### PostgreSQL Issues
```bash
# Check if running
brew services list

# Start PostgreSQL
brew services start postgresql

# Test connection
psql -U user -d copa_prediction -h localhost
```

### Redis Issues
```bash
# Check if running
redis-cli ping

# Start Redis
brew services start redis
```

### Port Already in Use
```bash
# Change PORT in .env or kill process
lsof -ti:3000 | xargs kill -9
```

For more troubleshooting, see `LOCAL_DEVELOPMENT_SETUP.md`.

## 📝 Project Structure

```
copa-prediction-system/
├── services/                    # NestJS Backend
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── common/
│   │   ├── database/
│   │   ├── cache/
│   │   ├── entities/
│   │   └── migrations/
│   ├── dist/
│   ├── logs/
│   ├── package.json
│   ├── .env.example
│   └── tsconfig.json
├── ui/                         # React Frontend (to be implemented)
├── .kiro/specs/                # Specification documents
│   └── sports-prediction-system/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── GETTING_STARTED.md
├── QUICK_START.md
├── LOCAL_DEVELOPMENT_SETUP.md
├── DOCKER_SETUP.md
├── SETUP_FLOWCHART.md
└── README.md
```

## 🎯 Next Steps

1. **Get Backend Running** ✅
   - Choose setup method from `GETTING_STARTED.md`
   - Follow the guide
   - Verify with health check

2. **Implement Remaining Tasks** (63 tasks)
   - See `.kiro/specs/sports-prediction-system/tasks.md`
   - Tasks organized by phase
   - Each task references specific requirements

3. **Set Up Frontend** (React)
   - Task 52: React project setup
   - Tasks 53-62: React components
   - Socket.io integration

4. **Deploy to Production**
   - Task 63-67: Error handling, monitoring, deployment
   - Docker containerization
   - Cloud deployment

## 📞 Support

- **Setup Issues**: See `LOCAL_DEVELOPMENT_SETUP.md`
- **Docker Issues**: See `DOCKER_SETUP.md`
- **Code Issues**: Check service README files
- **Design Questions**: See `.kiro/specs/` documents

## 📄 License

ISC

## 👥 Contributors

- Development Team

## 🙏 Acknowledgments

- Copa América 2024 tournament
- NestJS community
- TypeORM community
- React community

---

**Ready to get started?** See `GETTING_STARTED.md` for setup instructions! 🚀
