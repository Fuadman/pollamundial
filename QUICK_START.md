# Copa Mundial 2026 Sports Prediction System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites Check (1 min)

```bash
# Verify you have everything installed
node --version      # Should be v18+
npm --version       # Should be v9+
psql --version      # Should be 12+
redis-cli --version # Should be 6+
```

### Step 2: Database Setup (1 min)

```bash
# Create database and user
psql -U postgres

# Inside psql:
CREATE DATABASE copa_prediction;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;
\q

# Verify connection
psql -U user -d copa_prediction -h localhost -c "SELECT 1;"
```

### Step 3: Redis Setup (1 min)

```bash
# Start Redis
redis-server

# In another terminal, verify:
redis-cli ping  # Should return PONG
```

### Step 4: Backend Setup (1 min)

```bash
cd services
npm install
cp .env.example .env
npm run migration:run
npm run seed
npm run start:dev
```

### Step 5: Verify Everything Works (1 min)

```bash
# In another terminal:
curl http://localhost:3000/health

# Should return:
# {
#   "status": "ok",
#   "database": { "status": "healthy", ... },
#   "redis": { "status": "healthy", ... },
#   "timestamp": "..."
# }
```

✅ **You're done!** Backend is running on `http://localhost:3000`

---

## 📁 Project Structure

```
services/
├── src/
│   ├── common/          # Global middleware, filters, logger
│   ├── database/        # Database module and health checks
│   ├── cache/           # Redis and session management
│   ├── entities/        # Database models (8 entities)
│   ├── repositories/    # Data access layer (8 repositories)
│   ├── services/        # Business logic (8 services)
│   ├── seeds/           # Database seeding scripts
│   └── main.ts          # Application entry point
├── migrations/          # Database migrations
├── logs/                # Application logs
├── .env                 # Environment variables
└── package.json         # Dependencies and scripts
```

---

## 🛠️ Common Commands

```bash
cd services

# Development
npm run start:dev        # Start development server
npm test                 # Run tests
npm run lint             # Check code quality
npm run format           # Format code

# Database
npm run migration:show   # Show pending migrations
npm run migration:run    # Run migrations
npm run migration:revert # Revert last migration
npm run seed             # Seed tournament data

# Production
npm run build            # Build for production
npm start                # Run production build
```

---

## 🗄️ Database

### What's Included

- **32 Teams**: Copa Mundial 2026 teams in 8 groups (A-H)
- **48 Matches**: Group stage matches (June 1-30, 2026)
- **8 Entities**: User, Team, Match, MatchResult, Prediction, UserScore, NewsArticle, SimulationData

### Verify Data

```bash
# Connect to database
psql -U user -d copa_prediction

# Check teams
SELECT COUNT(*) FROM teams;  -- Should be 32

# Check matches
SELECT COUNT(*) FROM matches WHERE phase = 'group';  -- Should be 48

# Check groups
SELECT group_stage_group, COUNT(*) FROM teams GROUP BY group_stage_group;
-- Should show 4 teams per group (A-H)

# Exit
\q
```

---

## 🔍 API Endpoints (Currently Available)

```bash
# Health Checks
GET /health              # Overall system health
GET /health/db           # Database health
GET /health/redis        # Redis health

# Example:
curl http://localhost:3000/health
```

---

## 📊 What's Implemented

✅ **Backend Infrastructure**
- NestJS project with TypeScript
- PostgreSQL database with migrations
- Redis caching and sessions
- Global exception handling and logging
- Health check endpoints

✅ **Database Layer**
- 8 TypeORM entities with relationships
- 8 repositories with specialized queries
- 8 services with business logic
- 20+ performance indexes
- Cascade deletion for data consistency

✅ **Tournament Data**
- 32 Copa Mundial 2026 teams
- 8 groups (A-H) with 4 teams each
- 48 group stage matches (June 1-30, 2026)
- Seeding script with idempotent design

---

## 🚧 What's Next

### Immediate (Next 3 Tasks)
1. **Task 7**: Google OAuth 2.0 authentication
2. **Task 8**: User registration and payment flow
3. **Task 9**: Session management and JWT authentication

### Short Term (Next 10 Tasks)
- Complete authentication (Tasks 7-10)
- Implement prediction system (Tasks 11-14)
- Build scoring engine (Tasks 15-18)
- Implement match management (Tasks 19-22)

### Medium Term (Tasks 23-45)
- Configure elimination brackets
- Build leaderboards
- Create user dashboards
- Build admin panel
- Implement real-time updates

### Long Term (Tasks 46-67)
- Implement all API controllers
- Build React frontend
- Integration and deployment

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Start PostgreSQL if needed
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Start Redis if needed
redis-server
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux

# Or use different port
PORT=3001 npm run start:dev
```

### Database Migration Issues

```bash
# Revert and re-run migrations
npm run migration:revert
npm run migration:run
```

---

## 📚 Documentation

- **Local Setup**: `LOCAL_SETUP_GUIDE.md` - Comprehensive setup guide
- **Implementation Progress**: `IMPLEMENTATION_PROGRESS.md` - Detailed progress report
- **Database Setup**: `services/DATABASE_SETUP.md` - Database configuration
- **Redis Setup**: `services/REDIS_SETUP_SUMMARY.md` - Redis configuration
- **Seeding Guide**: `services/SEEDING_GUIDE.md` - Tournament data seeding
- **Backend README**: `services/README.md` - Backend documentation
- **Spec Files**: `.kiro/specs/sports-prediction-system/` - Requirements, design, tasks

---

## 🎯 Key Features

### Implemented
- ✅ NestJS backend with TypeScript
- ✅ PostgreSQL database with TypeORM
- ✅ Redis caching and sessions
- ✅ Global exception handling
- ✅ Comprehensive logging
- ✅ Health check endpoints
- ✅ Database migrations
- ✅ Tournament data seeding
- ✅ 81+ unit tests (all passing)

### In Progress
- 🔄 Authentication (OAuth, JWT)
- 🔄 Prediction system
- 🔄 Scoring engine

### Coming Soon
- ⏳ Real-time updates (WebSocket)
- ⏳ Admin panel
- ⏳ React frontend
- ⏳ Leaderboards
- ⏳ User dashboards

---

## 📈 Project Statistics

| Metric | Value |
|--------|-------|
| Tasks Completed | 6/67 (9%) |
| Code Files | 50+ |
| Database Entities | 8 |
| Repository Methods | 92 |
| Service Methods | 123 |
| Unit Tests | 81+ |
| Lines of Code | 5,000+ |

---

## 🔗 Useful Links

- **NestJS Docs**: https://docs.nestjs.com/
- **TypeORM Docs**: https://typeorm.io/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/documentation
- **Socket.io Docs**: https://socket.io/docs/

---

## 💡 Tips

1. **Keep terminals open**: You'll need separate terminals for PostgreSQL, Redis, and the backend
2. **Check logs**: Application logs are in `services/logs/`
3. **Use health endpoints**: Always verify services are running with `/health`
4. **Read documentation**: Each task has a summary document in `services/TASK_*_SUMMARY.md`
5. **Run tests**: `npm test` to verify everything is working

---

## 🎓 Learning Resources

- **Backend Architecture**: See `services/README.md`
- **Database Schema**: See `services/DATABASE_SCHEMA_SUMMARY.md`
- **Entity Quick Reference**: See `services/ENTITY_QUICK_REFERENCE.md`
- **Seeding Guide**: See `services/SEEDING_GUIDE.md`

---

## ✨ Next Steps

1. ✅ Verify everything is running: `curl http://localhost:3000/health`
2. 📖 Read `LOCAL_SETUP_GUIDE.md` for detailed setup
3. 📊 Check `IMPLEMENTATION_PROGRESS.md` for project status
4. 🚀 Start working on Task 7 (Google OAuth 2.0)

---

**Happy coding!** 🚀

For questions or issues, check the relevant documentation file or review the task summaries.
