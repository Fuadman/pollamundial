# Setup Flowchart - Visual Guide

## Choose Your Setup Path

```
                    START HERE
                        ↓
            Do you have Docker installed?
                    ↙           ↘
                  YES            NO
                   ↓              ↓
            ┌──────────────┐  ┌──────────────────┐
            │ Docker Setup │  │ Choose Platform  │
            │ (5 min)      │  └──────────────────┘
            └──────────────┘         ↙    ↘
                   ↓            macOS/Linux  Windows
                   ↓                 ↓         ↓
            See: DOCKER_SETUP.md  Quick   Detailed
                                  Start   Setup
                                   ↓        ↓
                            QUICK_START  LOCAL_DEV
                            .md          _SETUP.md
```

---

## Quick Start Path (5 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INSTALL PREREQUISITES (if not already installed)         │
│    • Node.js 18+                                            │
│    • PostgreSQL 12+                                         │
│    • Redis 6+                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CREATE DATABASE                                          │
│    psql -U postgres                                         │
│    CREATE DATABASE copa_prediction;                         │
│    CREATE USER user WITH PASSWORD 'password';               │
│    GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;│
│    \q                                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. START SERVICES (in separate terminals)                   │
│                                                             │
│    Terminal 1:                                              │
│    brew services start postgresql                           │
│                                                             │
│    Terminal 2:                                              │
│    brew services start redis                                │
│                                                             │
│    Terminal 3:                                              │
│    cd services                                              │
│    npm install                                              │
│    cp .env.example .env                                     │
│    npm run migration:run                                    │
│    npm run start:dev                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. VERIFY                                                   │
│    curl http://localhost:3000/health                        │
│    ✅ Should return health status                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    🎉 YOU'RE DONE!
```

---

## Docker Path (5 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INSTALL PREREQUISITES                                    │
│    • Docker Desktop                                         │
│    • Node.js 18+                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CREATE docker-compose.yml                                │
│    (See DOCKER_SETUP.md for full file)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. START SERVICES                                           │
│    docker-compose up -d                                     │
│    docker-compose ps                                        │
│    (Verify postgres and redis are healthy)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. START BACKEND                                            │
│    cd services                                              │
│    npm install                                              │
│    cp .env.example .env                                     │
│    npm run migration:run                                    │
│    npm run start:dev                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. VERIFY                                                   │
│    curl http://localhost:3000/health                        │
│    ✅ Should return health status                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    🎉 YOU'RE DONE!
```

---

## Detailed Setup Path (10 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│ See LOCAL_DEVELOPMENT_SETUP.md for:                         │
│ • Detailed prerequisites for your OS                        │
│ • Step-by-step instructions                                 │
│ • Troubleshooting guide                                     │
│ • Database management                                       │
│ • Development workflow                                      │
│ • Advanced configuration                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting Decision Tree

```
                    Something not working?
                            ↓
                    ┌───────────────────┐
                    │ Check error type  │
                    └───────────────────┘
                    ↙        ↓        ↘
            PostgreSQL   Redis      Port
            won't start  won't start already
                ↓          ↓         in use
                ↓          ↓            ↓
            Check if   Check if    Change PORT
            running    running     in .env
                ↓          ↓            ↓
            Start it   Start it    Restart
                ↓          ↓        backend
                ↓          ↓            ↓
            Test        Test        Test
            connection  connection  API
                ↓          ↓            ↓
            ✅ OK      ✅ OK        ✅ OK
```

---

## Service Status Check

```
┌─────────────────────────────────────────────────────────────┐
│ VERIFY ALL SERVICES ARE RUNNING                             │
└─────────────────────────────────────────────────────────────┘

PostgreSQL:
  Command: psql -U user -d copa_prediction -h localhost
  Expected: psql prompt (postgres=#)
  ✅ Connected

Redis:
  Command: redis-cli ping
  Expected: PONG
  ✅ Connected

Backend:
  Command: curl http://localhost:3000/health
  Expected: {"status":"ok",...}
  ✅ Running

Database Health:
  Command: curl http://localhost:3000/health/db
  Expected: {"status":"healthy",...}
  ✅ Healthy

Redis Health:
  Command: curl http://localhost:3000/health/redis
  Expected: {"status":"healthy",...}
  ✅ Healthy
```

---

## Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ DAILY DEVELOPMENT WORKFLOW                                  │
└─────────────────────────────────────────────────────────────┘

Morning:
  1. Start services (if not running)
     brew services start postgresql
     brew services start redis
  
  2. Start backend
     cd services
     npm run start:dev

During Day:
  3. Edit code in services/src/
     (Auto-reload enabled)
  
  4. Run tests
     npm test
  
  5. Check code quality
     npm run lint
  
  6. Format code
     npm run format

Before Commit:
  7. Run all tests
     npm test
  
  8. Check linting
     npm run lint
  
  9. Format code
     npm run format
  
  10. Commit changes
      git add .
      git commit -m "Your message"

End of Day:
  11. Stop services (optional)
      brew services stop postgresql
      brew services stop redis
```

---

## File Structure After Setup

```
services/
├── src/
│   ├── app.module.ts              ← Main module
│   ├── main.ts                    ← Entry point
│   ├── common/
│   │   ├── filters/               ← Exception filters
│   │   ├── logger/                ← Logging
│   │   └── middleware/            ← HTTP middleware
│   ├── database/
│   │   ├── database.service.ts    ← DB connection
│   │   ├── database.module.ts     ← DB module
│   │   └── health.controller.ts   ← Health checks
│   ├── cache/
│   │   ├── redis.service.ts       ← Redis operations
│   │   ├── session.store.ts       ← Session management
│   │   ├── cache.service.ts       ← Cache operations
│   │   └── cache.module.ts        ← Cache module
│   ├── entities/                  ← Database entities
│   │   ├── user.entity.ts
│   │   ├── team.entity.ts
│   │   ├── match.entity.ts
│   │   ├── prediction.entity.ts
│   │   └── ...
│   └── migrations/                ← Database migrations
│       └── 1000000000001-CreateInitialSchema.ts
├── dist/                          ← Compiled output
├── logs/                          ← Application logs
├── node_modules/                  ← Dependencies
├── .env                           ← Environment variables
├── .env.example                   ← Environment template
├── package.json                   ← Dependencies list
├── tsconfig.json                  ← TypeScript config
├── jest.config.js                 ← Jest config
├── .eslintrc.json                 ← ESLint config
└── .prettierrc                    ← Prettier config
```

---

## Environment Variables

```
.env file should contain:

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=copa_prediction

# Redis
REDIS_URL=redis://localhost:6379

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
TIMEZONE=America/La_Paz

# Feature Flags
ENABLE_TESTING_MODE=true
ENABLE_SIMULATION_API=true
```

---

## Common Issues & Solutions

```
Issue: PostgreSQL connection refused
Solution: brew services start postgresql

Issue: Redis connection refused
Solution: brew services start redis

Issue: Port 3000 already in use
Solution: Change PORT in .env or kill process

Issue: npm install fails
Solution: npm cache clean --force && npm install

Issue: Migrations fail
Solution: npm run migration:revert && npm run migration:run

Issue: Tests fail
Solution: npm test -- --clearCache

Issue: Code won't compile
Solution: npm run build (check for TypeScript errors)
```

---

## Next Steps After Setup

```
✅ Backend running locally
   ↓
📝 Implement remaining tasks (5-67)
   ├── Tasks 5-6: Data access layer
   ├── Tasks 7-10: Authentication
   ├── Tasks 11-18: Prediction system
   ├── Tasks 19-26: Match management
   ├── Tasks 27-32: Leaderboards
   ├── Tasks 33-39: Admin panel
   ├── Tasks 40-45: Testing/simulation
   ├── Tasks 46-51: API controllers
   ├── Tasks 52-62: React frontend
   └── Tasks 63-67: Deployment
   ↓
⚛️ Set up React frontend
   ↓
🚀 Deploy to production
```

---

## Quick Command Reference

```bash
# Backend
npm run start:dev          # Start development server
npm test                   # Run tests
npm run lint              # Check code quality
npm run format            # Format code
npm run build             # Build for production

# Database
npm run migration:show    # Show migration status
npm run migration:run     # Run migrations
npm run migration:revert  # Revert last migration

# Services
brew services start postgresql
brew services stop postgresql
brew services start redis
brew services stop redis

# Database
psql -U user -d copa_prediction -h localhost

# Redis
redis-cli
```

---

**Ready to get started?** Pick a setup method and follow the flowchart! 🚀
