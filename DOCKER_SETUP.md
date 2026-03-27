# Docker Setup - Alternative Local Development

If you prefer using Docker instead of installing PostgreSQL and Redis locally, follow this guide.

## Prerequisites

- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)
- **Node.js** 18+ ([Download](https://nodejs.org/))

## Quick Start with Docker

### 1. Create docker-compose.yml

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: copa_postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: copa_prediction
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d copa_prediction"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: copa_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 2. Start Docker Services

```bash
# Start PostgreSQL and Redis in background
docker-compose up -d

# Verify services are running
docker-compose ps

# Should show:
# NAME                COMMAND                  SERVICE      STATUS
# copa_postgres       "docker-entrypoint.s…"   postgres     Up (healthy)
# copa_redis          "redis-server"           redis        Up (healthy)
```

### 3. Set Up Backend

```bash
cd services

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

### 4. Verify Everything Works

```bash
# Test API
curl http://localhost:3000/health

# Should return health status
```

## Docker Commands Reference

### View Logs

```bash
# PostgreSQL logs
docker-compose logs postgres

# Redis logs
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f postgres
```

### Access Services

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U user -d copa_prediction

# Connect to Redis
docker-compose exec redis redis-cli
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart postgres
```

## Advanced Docker Setup

### Custom Environment Variables

Create a `.env.docker` file:

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=copa_prediction
REDIS_PASSWORD=redis_password
```

Update `docker-compose.yml`:

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
```

Run with custom env:

```bash
docker-compose --env-file .env.docker up -d
```

### Persistent Data

Data is automatically persisted in Docker volumes:
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data

To backup:

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U user copa_prediction > backup.sql

# Backup Redis
docker-compose exec redis redis-cli BGSAVE
docker cp copa_redis:/data/dump.rdb ./redis_backup.rdb
```

To restore:

```bash
# Restore PostgreSQL
docker-compose exec -T postgres psql -U user copa_prediction < backup.sql

# Restore Redis
docker cp redis_backup.rdb copa_redis:/data/dump.rdb
docker-compose exec redis redis-cli BGSAVE
```

### Development with Hot Reload

The backend automatically reloads when you change files:

```bash
cd services
npm run start:dev
```

Edit files in `services/src/` and changes will be reflected immediately.

### Running Tests in Docker

```bash
# Run tests
docker-compose exec -T backend npm test

# Run tests with coverage
docker-compose exec -T backend npm run test:cov

# Run tests in watch mode
docker-compose exec -T backend npm test:watch
```

## Troubleshooting Docker

### Services won't start

```bash
# Check Docker daemon is running
docker ps

# View detailed logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### Port already in use

```bash
# Change ports in docker-compose.yml
# Or kill the process using the port:
lsof -ti:5432 | xargs kill -9  # PostgreSQL
lsof -ti:6379 | xargs kill -9  # Redis
lsof -ti:3000 | xargs kill -9  # Backend
```

### Database connection error

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait for it to be healthy
docker-compose exec postgres pg_isready -U user
```

### Redis connection error

```bash
# Check if Redis is healthy
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

### Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Docker vs Local Setup

| Aspect | Docker | Local |
|--------|--------|-------|
| Setup Time | 2 minutes | 5 minutes |
| Isolation | ✅ Complete | ❌ Shared system |
| Performance | ⚠️ Slightly slower | ✅ Faster |
| Disk Space | ⚠️ More | ✅ Less |
| Consistency | ✅ Same everywhere | ❌ OS-dependent |
| Cleanup | ✅ Easy | ⚠️ Manual |

## Switching Between Docker and Local

### From Docker to Local

```bash
# Stop Docker services
docker-compose down

# Install PostgreSQL and Redis locally
# (See LOCAL_DEVELOPMENT_SETUP.md)

# Update .env to use localhost
# Start local services
```

### From Local to Docker

```bash
# Stop local services
brew services stop postgresql
brew services stop redis

# Start Docker services
docker-compose up -d

# Update .env to use localhost (same as Docker)
```

## Production-Ready Docker

For production deployment, use a more comprehensive setup:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - copa_network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always
    networks:
      - copa_network

  backend:
    build:
      context: ./services
      dockerfile: Dockerfile
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ${DB_USER}
      DATABASE_PASSWORD: ${DB_PASSWORD}
      DATABASE_NAME: ${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: always
    networks:
      - copa_network

volumes:
  postgres_data:
  redis_data:

networks:
  copa_network:
    driver: bridge
```

## Next Steps

1. ✅ Services running in Docker
2. 📝 Implement remaining tasks (5-67)
3. ⚛️ Set up React frontend (Task 52+)
4. 🐳 Create Dockerfile for backend
5. 🚀 Deploy to production

---

**Happy coding with Docker!** 🐳
