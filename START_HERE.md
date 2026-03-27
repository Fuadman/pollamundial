# 🚀 START HERE - Local Development Setup

Welcome! This file will guide you to the right documentation for your needs.

## ⚡ I Want to Get Running in 5 Minutes

👉 **Go to: `QUICK_START.md`**

Copy-paste commands and you'll have the backend running in 5 minutes.

```bash
# Quick preview:
psql -U postgres -c "CREATE DATABASE copa_prediction;"
psql -U postgres -c "CREATE USER user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;"

brew services start postgresql
brew services start redis

cd services
npm install
cp .env.example .env
npm run migration:run
npm run start:dev

# Test:
curl http://localhost:3000/health
```

---

## 📚 I Want to Understand Each Step

👉 **Go to: `LOCAL_DEVELOPMENT_SETUP.md`**

Detailed step-by-step guide with:
- Prerequisites for your OS
- Troubleshooting section
- Database management
- Development workflow

---

## 🐳 I Prefer Docker

👉 **Go to: `DOCKER_SETUP.md`**

Docker-based setup with:
- docker-compose.yml configuration
- Container management
- Data persistence
- Production setup

---

## 🎯 I'm Not Sure Which Path to Take

👉 **Go to: `GETTING_STARTED.md`**

This guide helps you choose:
- Quick Start (5 min)
- Local Setup (10 min)
- Docker Setup (5 min)

---

## 📊 I'm a Visual Learner

👉 **Go to: `SETUP_FLOWCHART.md`**

Visual flowcharts and diagrams for:
- Setup decision trees
- Service status checks
- Development workflow
- Troubleshooting

---

## 📖 I Want Project Overview

👉 **Go to: `README.md`**

Complete project documentation:
- Architecture overview
- Technology stack
- Current features
- Implementation status
- API documentation

---

## 🆘 I'm Stuck or Have Issues

### PostgreSQL won't connect?
```bash
brew services start postgresql
psql -U user -d copa_prediction -h localhost
```

### Redis won't connect?
```bash
brew services start redis
redis-cli ping
```

### Port 3000 already in use?
```bash
# Change PORT in .env to 3001
# Or kill the process:
lsof -ti:3000 | xargs kill -9
```

### Still stuck?
👉 **Go to: `LOCAL_DEVELOPMENT_SETUP.md`** → Troubleshooting section

---

## 🎓 Documentation Map

```
START_HERE.md (you are here)
    ↓
Choose your path:
    ├── QUICK_START.md (5 min)
    ├── LOCAL_DEVELOPMENT_SETUP.md (10 min)
    ├── DOCKER_SETUP.md (5 min)
    ├── GETTING_STARTED.md (help choosing)
    ├── SETUP_FLOWCHART.md (visual guide)
    └── README.md (overview)
```

---

## ✅ Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] PostgreSQL 12+ installed
- [ ] Redis 6+ installed
- [ ] Git installed
- [ ] Text editor (VS Code recommended)

**Don't have these?** Each guide includes installation instructions for your OS.

---

## 🚀 Fastest Path (Copy-Paste)

```bash
# 1. Create database
psql -U postgres
CREATE DATABASE copa_prediction;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE copa_prediction TO user;
\q

# 2. Start services (3 separate terminals)
# Terminal 1:
brew services start postgresql

# Terminal 2:
brew services start redis

# Terminal 3:
cd services
npm install
cp .env.example .env
npm run migration:run
npm run start:dev

# 4. Verify (new terminal)
curl http://localhost:3000/health
```

**Done!** Your backend is running at `http://localhost:3000`

---

## 📋 What's Already Done

✅ Backend infrastructure set up
✅ Database schema created
✅ Redis cache configured
✅ Health check endpoints working
✅ All documentation written

**Next:** Implement remaining 63 tasks

---

## 🎯 Your Next Steps

1. **Choose a setup method** (Quick, Local, or Docker)
2. **Follow the guide** (5-10 minutes)
3. **Verify it works** (`curl http://localhost:3000/health`)
4. **Start coding** (implement remaining tasks)

---

## 💡 Pro Tips

1. **Keep services running**: Use separate terminals or tmux
2. **Watch logs**: `npm run start:dev` shows real-time logs
3. **Test frequently**: `npm test` after changes
4. **Format code**: `npm run format` before committing
5. **Use Git**: Commit frequently with meaningful messages

---

## 🆘 Quick Help

| Issue | Solution |
|-------|----------|
| PostgreSQL won't start | `brew services start postgresql` |
| Redis won't start | `brew services start redis` |
| Port 3000 in use | Change PORT in .env or kill process |
| npm install fails | `npm cache clean --force && npm install` |
| Migrations fail | `npm run migration:revert && npm run migration:run` |
| Tests fail | `npm test -- --clearCache` |

---

## 📞 Documentation Quick Links

| Document | Purpose | Time |
|----------|---------|------|
| QUICK_START.md | Fast setup | 5 min |
| LOCAL_DEVELOPMENT_SETUP.md | Detailed setup | 10 min |
| DOCKER_SETUP.md | Docker setup | 5 min |
| GETTING_STARTED.md | Choose path | 2 min |
| SETUP_FLOWCHART.md | Visual guide | 5 min |
| README.md | Overview | 10 min |

---

## 🎉 Ready?

**Pick your setup method above and get started!**

The backend will be running in 5-10 minutes. Then you can start implementing the remaining tasks.

---

**Questions?** Check the relevant documentation file above.

**Ready to code?** Pick a setup method and follow the guide!

---

**Happy coding!** 🚀
