# Getting Started - Choose Your Path

Welcome to the Copa América 2024 Sports Prediction System! Here's how to get up and running locally.

## 📋 Choose Your Setup Method

### Option 1: Quick Start (Recommended for Beginners)
**Time: 5 minutes**

👉 See: `QUICK_START.md`

Best for:
- First-time setup
- Simple local development
- macOS/Linux users

Steps:
1. Install Node.js, PostgreSQL, Redis
2. Create database
3. Start services
4. Run backend

### Option 2: Detailed Setup (Recommended for Troubleshooting)
**Time: 10 minutes**

👉 See: `LOCAL_DEVELOPMENT_SETUP.md`

Best for:
- Understanding each step
- Troubleshooting issues
- Advanced configuration
- Windows users

Includes:
- Detailed prerequisites
- Step-by-step instructions
- Troubleshooting guide
- Database management
- Development workflow

### Option 3: Docker Setup (Recommended for Consistency)
**Time: 5 minutes**

👉 See: `DOCKER_SETUP.md`

Best for:
- Consistent environments
- No local installation needed
- Team collaboration
- Production-like setup

Includes:
- Docker Compose configuration
- Container management
- Data persistence
- Production setup

---

## 🚀 Quick Reference

### Minimum Setup (5 min)

```bash
# 1. Install prerequisites
# Node.js, PostgreSQL, Redis

# 2. Create database
psql -U postgres -c "CREATE DATABASE copa_prediction;"
psql -U postgres -c "CREATE USER user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;"

# 3. Start services
brew services start postgresql
brew services start redis

# 4. Start backend
cd services
npm install
cp .env.example .env
npm run migration:run
npm run start:dev

# 5. Test
curl http://localhost:3000/health
```

### Docker Setup (5 min)

```bash
# 1. Create docker-compose.yml (see DOCKER_SETUP.md)

# 2. Start services
docker-compose up -d

# 3. Start backend
cd services
npm install
cp .env.example .env
npm run migration:run
npm run start:dev

# 4. Test
curl http://localhost:3000/health
```

---

## 📁 Project Structure

```
copa-prediction-system/
├── services/                    # NestJS Backend
│   ├── src/
│   │   ├── app.module.ts       # Main module
│   │   ├── main.ts             # Entry point
│   │   ├── common/             # Shared utilities
│   │   ├── database/           # Database config
│   │   ├── cache/              # Redis cache
│   │   ├── entities/           # Database entities
│   │   └── migrations/         # Database migrations
│   ├── package.json            # Dependencies
│   ├── .env.example            # Environment template
│   └── tsconfig.json           # TypeScript config
├── ui/                         # React Frontend (to be implemented)
├── .kiro/specs/                # Specification documents
│   └── sports-prediction-system/
│       ├── requirements.md     # Requirements
│       ├── design.md           # Design document
│       └── tasks.md            # Implementation tasks
├── QUICK_START.md              # Quick setup guide
├── LOCAL_DEVELOPMENT_SETUP.md  # Detailed setup guide
├── DOCKER_SETUP.md             # Docker setup guide
└── GETTING_STARTED.md          # This file
```

---

## 🔧 Common Commands

### Backend Development

```bash
cd services

# Start development server (auto-reload)
npm run start:dev

# Run tests
npm test

# Check code quality
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

### Database Management

```bash
cd services

# Show pending migrations
npm run migration:show

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Connect to database
psql -U user -d copa_prediction -h localhost
```

### Redis Management

```bash
# Connect to Redis
redis-cli

# In redis-cli:
PING                    # Test connection
KEYS *                  # List all keys
GET session:token123    # Get a value
FLUSHDB                 # Clear all data
QUIT                    # Exit
```

---

## 🌐 API Endpoints (Current)

### Health Checks

```bash
# Overall health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health/db

# Redis health
curl http://localhost:3000/health/redis
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│                    (To be implemented)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (NestJS API)                        │
│                  localhost:3000                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Controllers, Services, Business Logic               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓                                    ↓
┌──────────────────────┐          ┌──────────────────────┐
│   PostgreSQL DB      │          │   Redis Cache        │
│   localhost:5432     │          │   localhost:6379     │
│                      │          │                      │
│  - Users             │          │  - Sessions          │
│  - Teams             │          │  - Leaderboard       │
│  - Matches           │          │  - Match Scores      │
│  - Predictions       │          │  - User Scores       │
│  - Results           │          │  - Lockdown Status   │
│  - Scores            │          │                      │
└──────────────────────┘          └──────────────────────┘
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] PostgreSQL is running: `psql -U user -d copa_prediction -h localhost`
- [ ] Redis is running: `redis-cli ping` → `PONG`
- [ ] Backend is running: `curl http://localhost:3000/health`
- [ ] Database is healthy: `curl http://localhost:3000/health/db`
- [ ] Redis is healthy: `curl http://localhost:3000/health/redis`
- [ ] Tests pass: `npm test`
- [ ] Code quality: `npm run lint`

---

## 🐛 Troubleshooting

### Issue: PostgreSQL won't connect

```bash
# Check if running
brew services list

# Start it
brew services start postgresql

# Test connection
psql -U user -d copa_prediction -h localhost
```

### Issue: Redis won't connect

```bash
# Check if running
redis-cli ping

# Start it
brew services start redis
```

### Issue: Port 3000 already in use

```bash
# Change PORT in .env to 3001
# Or kill the process:
lsof -ti:3000 | xargs kill -9
```

### Issue: Dependencies won't install

```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstall
npm install
```

For more troubleshooting, see `LOCAL_DEVELOPMENT_SETUP.md`.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `QUICK_START.md` | Fast 5-minute setup |
| `LOCAL_DEVELOPMENT_SETUP.md` | Detailed setup with troubleshooting |
| `DOCKER_SETUP.md` | Docker-based setup |
| `.kiro/specs/sports-prediction-system/requirements.md` | System requirements |
| `.kiro/specs/sports-prediction-system/design.md` | System design |
| `.kiro/specs/sports-prediction-system/tasks.md` | Implementation tasks |
| `services/README.md` | Backend documentation |
| `services/DATABASE_SETUP.md` | Database setup guide |
| `services/REDIS_SETUP_SUMMARY.md` | Redis setup guide |

---

## 🎯 Next Steps

### 1. Get Backend Running ✅
- Choose setup method (Quick Start, Local, or Docker)
- Follow the guide
- Verify with health check

### 2. Implement Remaining Tasks (63 tasks)
- Tasks 5-6: Data access layer
- Tasks 7-10: Authentication
- Tasks 11-18: Prediction system
- Tasks 19-26: Match management
- Tasks 27-32: Leaderboards
- Tasks 33-39: Admin panel
- Tasks 40-45: Testing/simulation
- Tasks 46-51: API controllers
- Tasks 52-62: React frontend
- Tasks 63-67: Deployment

### 3. Set Up Frontend (React)
- Task 52: React project setup
- Tasks 53-62: React components
- Socket.io integration

### 4. Deploy to Production
- Task 63-67: Error handling, monitoring, deployment
- Docker containerization
- Cloud deployment

---

## 💡 Tips

1. **Keep services running**: Use terminal multiplexer (tmux/screen) or multiple terminals
2. **Watch logs**: Use `npm run start:dev` to see real-time logs
3. **Test frequently**: Run `npm test` after changes
4. **Format code**: Run `npm run format` before committing
5. **Use Git**: Commit frequently with meaningful messages

---

## 🆘 Need Help?

1. **Quick questions**: Check `QUICK_START.md`
2. **Setup issues**: Check `LOCAL_DEVELOPMENT_SETUP.md` troubleshooting
3. **Docker issues**: Check `DOCKER_SETUP.md` troubleshooting
4. **Code issues**: Check service README files
5. **System design**: Check `.kiro/specs/` documents

---

## 🎉 You're Ready!

Choose your setup method above and get started. The backend will be running in 5 minutes!

**Questions?** Check the relevant documentation file above.

**Ready to code?** Pick a setup method and follow the guide!

---

**Happy coding!** 🚀
