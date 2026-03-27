# Database Module

This module provides PostgreSQL database connectivity with TypeORM, including health checks and automatic retry logic.

## Components

### DatabaseService

Manages database connections with automatic retry logic and health checks.

**Features:**
- Automatic connection initialization with retry logic (5 attempts, 3-second intervals)
- Health check endpoint for monitoring connection status
- Graceful shutdown with connection cleanup
- Detailed logging of connection attempts and failures

**Usage:**

```typescript
import { DatabaseService } from './database.service';

@Injectable()
export class MyService {
  constructor(private databaseService: DatabaseService) {}

  async checkHealth() {
    const health = await this.databaseService.healthCheck();
    console.log(health);
  }

  getDataSource() {
    return this.databaseService.getDataSource();
  }
}
```

### HealthController

Provides HTTP endpoints for health checks.

**Endpoints:**

- `GET /health` - Overall application health
- `GET /health/db` - Database connection health

**Response Format:**

```json
{
  "status": "healthy",
  "message": "Database connection is active",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### DatabaseModule

NestJS module that configures TypeORM and exports database services.

**Configuration:**
- Reads database settings from environment variables
- Supports both development and production configurations
- Enables SSL for production environments
- Configures migration table name as `typeorm_migrations`

## Environment Variables

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=copa_prediction
NODE_ENV=development
```

## Migration Management

### Creating Migrations

After modifying entities, generate a migration:

```bash
npm run migration:generate -- src/migrations/CreateUsersTable
```

### Running Migrations

```bash
npm run migration:run
```

### Reverting Migrations

```bash
npm run migration:revert
```

### Viewing Migration Status

```bash
npm run migration:show
```

## Connection Retry Logic

The database service implements automatic retry logic:

1. **Initial Connection**: Attempts to connect on module initialization
2. **Retry Attempts**: Up to 5 attempts with 3-second delays
3. **Verification**: Runs a simple query (`SELECT 1`) to verify connection
4. **Error Handling**: Logs detailed error messages for troubleshooting

### Retry Configuration

To modify retry behavior, edit `database.service.ts`:

```typescript
private readonly maxRetries = 5;        // Number of retry attempts
private readonly retryDelay = 3000;     // Delay between retries (ms)
```

## Health Checks

### Automatic Health Checks

The service performs health checks on:
- Module initialization
- Each health check endpoint request
- Connection verification queries

### Manual Health Checks

```typescript
const health = await this.databaseService.healthCheck();
if (health.status === 'healthy') {
  console.log('Database is ready');
} else {
  console.error('Database connection failed:', health.message);
}
```

## Error Handling

### Common Errors

**Connection Refused**
- Verify PostgreSQL is running
- Check DATABASE_HOST and DATABASE_PORT
- Ensure database credentials are correct

**Authentication Failed**
- Verify DATABASE_USER and DATABASE_PASSWORD
- Check PostgreSQL user permissions

**Database Not Found**
- Create the database: `createdb -U user copa_prediction`
- Verify DATABASE_NAME in environment variables

## Testing

Unit tests are provided for both DatabaseService and HealthController:

```bash
npm test -- --testPathPatterns="database"
```

Tests cover:
- Successful health checks
- Connection failures
- Uninitialized connections
- Module lifecycle (initialization and destruction)

## Best Practices

1. **Always use the DatabaseService** for database operations
2. **Check health status** before critical operations
3. **Handle connection errors** gracefully in your services
4. **Use migrations** for all schema changes
5. **Test migrations** in development before production
6. **Monitor health endpoints** in production

## Integration with NestJS

The DatabaseModule is imported in AppModule:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
  ],
  // ...
})
export class AppModule {}
```

This ensures:
- Database connection is established before other modules
- Health checks are available throughout the application
- Proper cleanup on application shutdown
