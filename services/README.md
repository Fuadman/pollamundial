# Copa América 2024 Sports Prediction System - Backend

NestJS-based backend for the Copa América 2024 Sports Prediction System.

## Project Structure

```
services/
├── src/
│   ├── common/
│   │   ├── filters/          # Global exception filters
│   │   ├── logger/           # Winston logger service
│   │   └── middleware/       # HTTP middleware
│   ├── app.controller.ts     # Main controller
│   ├── app.service.ts        # Main service
│   ├── app.module.ts         # Root module
│   └── main.ts               # Application entry point
├── dist/                     # Compiled output
├── logs/                     # Application logs
├── .env                      # Environment variables
├── .env.example              # Example environment variables
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest testing configuration
├── .eslintrc.json            # ESLint configuration
└── .prettierrc                # Prettier configuration
```

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

## Development

Start the development server:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## Building

Build the project for production:

```bash
npm run build
```

## Running

Start the production server:

```bash
npm start
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:cov
```

## Code Quality

Lint code:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

Format code with Prettier:

```bash
npm run format
```

## API Endpoints

### Health Check

- `GET /` - API greeting
- `GET /health` - Health status

## Architecture

### Global Exception Filter

All exceptions are caught by the `GlobalExceptionFilter` which provides consistent error responses with proper HTTP status codes and logging.

### Logging

The `LoggerService` uses Winston for structured logging with support for:
- Console output in development
- File output (error.log, combined.log)
- Configurable log levels

### Middleware

- `LoggingMiddleware` - Logs all HTTP requests with method, URL, status code, and duration

## Database

The application uses PostgreSQL with TypeORM for ORM. Database configuration is managed through environment variables.

## Dependencies

### Core
- `@nestjs/common` - NestJS core
- `@nestjs/core` - NestJS core
- `@nestjs/platform-express` - Express adapter
- `reflect-metadata` - Metadata reflection
- `rxjs` - Reactive programming

### Database & Cache
- `typeorm` - ORM
- `pg` - PostgreSQL driver
- `redis` - Redis client
- `@nestjs/typeorm` - TypeORM integration

### Authentication
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy
- `@nestjs/passport` - Passport integration
- `@nestjs/jwt` - JWT support

### Validation & Transformation
- `class-validator` - DTO validation
- `class-transformer` - Object transformation

### Real-time
- `socket.io` - WebSocket library

### Logging
- `winston` - Logging library

### Development
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `jest` - Testing framework
- `ts-jest` - Jest TypeScript support
- `@nestjs/testing` - NestJS testing utilities
- `eslint` - Code linting
- `@typescript-eslint/parser` - TypeScript ESLint parser
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint rules
- `prettier` - Code formatting

## Next Steps

1. Configure PostgreSQL database connection
2. Create TypeORM entities for all domain models
3. Implement authentication modules
4. Create prediction and scoring modules
5. Set up WebSocket gateway for real-time updates
