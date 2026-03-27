# Data Access Layer

This module provides repositories and services for all entities in the Copa América 2024 Sports Prediction System.

## Repositories

Each repository extends TypeORM's Repository class and provides specialized query methods:

- **UserRepository**: User account queries and updates
- **TeamRepository**: Team data and group assignments
- **MatchRepository**: Match scheduling, status, and filtering
- **MatchResultRepository**: Match results and scoring data
- **PredictionRepository**: User predictions with filtering and locking
- **UserScoreRepository**: User scores and leaderboard rankings
- **NewsArticleRepository**: News article management
- **SimulationDataRepository**: Test data tracking

## Services

Each service provides business logic and transaction support:

- **UserService**: User registration, payment, profile management
- **TeamService**: Team CRUD and group queries
- **MatchService**: Match creation, status updates, lockdown enforcement
- **MatchResultService**: Result publication and validation
- **PredictionService**: Prediction submission, editing, locking
- **UserScoreService**: Score calculation and leaderboard management
- **NewsArticleService**: Article publishing and archival
- **SimulationDataService**: Test data generation and cleanup

## Usage

Import DataAccessModule in your feature modules to access all repositories and services.
