# Implementation Plan: Copa Mundial 2026 Sports Prediction System

## Overview

This implementation plan breaks down the Copa Mundial 2026 Sports Prediction System into discrete, incremental coding tasks. The system is built with Node.js/Express backend, PostgreSQL database, Redis caching, and React/Vue frontend. Each task builds on previous work, with property-based tests validating core correctness properties throughout development.

## Phase 1: Backend Infrastructure Setup

- [x] 1. Set up NestJS project structure and core dependencies
  - Initialize NestJS project with TypeScript and CLI
  - Install core dependencies (TypeORM, PostgreSQL driver, Redis, Socket.io, Passport)
  - Configure ESLint, Prettier, and testing frameworks (Jest)
  - Set up environment configuration and logging (Winston)
  - Create base NestJS app with global middleware and exception filters
  - _Requirements: 1.1, 2.1, 22.1_

- [x] 2. Configure PostgreSQL database connection and migrations
  - Set up TypeORM connection with PostgreSQL
  - Create migration framework with TypeORM CLI
  - Implement connection health checks and retry logic
  - _Requirements: 24.1, 24.2, 24.3_

- [x] 3. Configure Redis cache and session management
  - Set up Redis connection with connection pooling
  - Implement session store using Redis
  - Configure cache TTL policies for different data types
  - _Requirements: 17.2, 18.1_

## Phase 2: Database Schema and Models

- [x] 4. Create database schema and initial migrations
  - Create TypeORM entities for all tables (User, Team, Match, MatchResult, Prediction, UserScore, NewsArticle, SimulationData)
  - Define entity relationships and constraints
  - Create TypeORM migrations for schema creation
  - Add all required indexes for query performance
  - _Requirements: 21.1-21.6, 24.1_

- [x] 5. Implement TypeORM repositories and services
  - Create repository classes for each entity using TypeORM
  - Implement query builders for common operations
  - Create service classes for data access layer
  - Add transaction support for critical operations
  - _Requirements: 22.1-22.5_

- [x] 6. Seed initial tournament data
  - Load 32 Copa Mundial 2026 teams into teams table
  - Create group stage assignments (Groups A-H)
  - Generate 72 group stage matches with scheduled times (June 1-30, 2026)
  - _Requirements: 14.1, 21.1_

## Phase 3: Authentication and Authorization

- [x] 7. Implement Google OAuth 2.0 authentication with Passport.js
  - Set up Passport.js with Google OAuth strategy
  - Create OAuth callback handler in NestJS controller
  - Implement token validation and user creation/retrieval
  - Handle OAuth errors and edge cases
  - _Requirements: 1.1-1.5_

- [x] 8. Implement user registration and payment flow
  - Create registration DTO and validation pipes
  - Integrate payment processor (Stripe/PayPal) API
  - Implement payment verification and error handling
  - Record registration and payment timestamps
  - _Requirements: 2.1-2.6_

- [x] 9. Implement session management and JWT authentication
  - Create JWT strategy with Passport.js
  - Implement JWT token generation and validation
  - Create authentication guards for protected routes
  - Add session expiration and refresh logic
  - _Requirements: 1.5, 3.1_

- [x] 10. Implement authorization checks for admin operations
  - Create role-based access control (RBAC) guards
  - Implement permission checks for admin endpoints
  - Add audit logging decorator for admin actions
  - _Requirements: 5.1, 19.2.2_

## Phase 4: Core Prediction System

- [x] 11. Implement prediction submission and validation
  - Create prediction validation logic (format, match existence, user registration)
  - Implement lockdown time checking
  - Create prediction storage with transaction support
  - Handle duplicate prediction prevention
  - _Requirements: 7.1-7.6, 22.1-22.5_

- [x] 12. Implement prediction editing with lockdown enforcement
  - Create prediction update logic with lockdown checks
  - Implement lockdown timestamp recording
  - Add edit history tracking
  - _Requirements: 8.1-8.6, 9.1-9.5_

- [x] 13. Implement lockdown time calculation and enforcement
  - Create lockdown time calculation (15 minutes before match)
  - Implement background job for lockdown state transitions
  - Add real-time lockdown status checking
  - _Requirements: 9.1-9.5_

- [x]* 13.1 Write property test for lockdown time calculation
  - **Property 23: Lockdown time calculation**
  - **Validates: Requirements 9.1**

- [x] 14. Implement prediction retrieval and filtering
  - Create endpoints for user predictions with filtering
  - Implement prediction history with status tracking
  - Add pagination and sorting
  - _Requirements: 19.1, 19.2.1_

- [x]* 14.1 Write unit tests for prediction filtering
  - Test filtering by phase, status, and date range
  - Test pagination edge cases
  - _Requirements: 19.1_

## Phase 5: Scoring Engine

- [x] 15. Implement exact score scoring (3 points)
  - Create scoring logic for exact score matches
  - Implement score comparison and validation
  - Add edge case handling (draws, zero scores)
  - _Requirements: 10.1-10.4_

- [x]* 15.1 Write property test for exact score scoring
  - **Property 28: Exact score awards 3 points**
  - **Validates: Requirements 10.2**

- [x]* 15.2 Write property test for non-exact predictions
  - **Property 29: Non-exact predictions don't earn 3 points**
  - **Validates: Requirements 10.3**

- [x] 16. Implement winner with goal difference scoring (2 points)
  - Create goal difference calculation logic
  - Implement winner determination from scores
  - Add scoring logic for correct winner + difference
  - _Requirements: 11.1-11.5_

- [x]* 16.1 Write property test for goal difference scoring
  - **Property 32: Winner with correct difference awards 2 points**
  - **Validates: Requirements 11.2**

- [x] 17. Implement correct winner/draw scoring (1 point)
  - Create winner/draw determination logic
  - Implement 1-point scoring for correct winner or draw
  - Add no double-counting validation
  - _Requirements: 12.1-12.5_

- [x]* 17.1 Write property test for correct winner scoring
  - **Property 36: Correct winner awards 1 point**
  - **Validates: Requirements 12.2**

- [x]* 17.2 Write property test for no double-counting
  - **Property 39: No double-counting for exact scores**
  - **Validates: Requirements 12.5**

- [x] 18. Implement batch score calculation engine
  - Create transaction-based score calculation for all predictions on a match
  - Implement idempotent score updates
  - Add error handling and rollback logic
  - _Requirements: 23.1-23.5, 24.1-24.3_

- [x]* 18.1 Write unit tests for batch score calculation
  - Test transaction atomicity
  - Test idempotency of score updates
  - Test error recovery
  - _Requirements: 23.1-23.5_

## Phase 6: Match Management

- [x] 19. Implement match scheduling and status tracking
  - Create match creation and scheduling logic
  - Implement match status transitions (scheduled → in_progress → completed)
  - Add match filtering and retrieval endpoints
  - _Requirements: 14.1-14.5, 15.1-15.7_

- [x] 20. Implement match result publication
  - Create result entry validation and storage
  - Implement result publication with timestamp recording
  - Add duplicate result prevention
  - _Requirements: 5.1-5.7, 26.1-26.9_

- [ ]* 20.1 Write unit tests for result publication
  - Test duplicate prevention
  - Test validation of score format
  - Test timestamp recording
  - _Requirements: 5.6, 5.7_

- [x] 21. Implement real-time score updates during matches
  - Create score update ingestion logic
  - Implement WebSocket broadcasting of score changes
  - Add score update caching in Redis
  - _Requirements: 17.1-17.5_

- [x] 22. Implement timezone conversion for match times
  - Create UTC to La Paz (UTC-4) conversion utility
  - Implement timezone display in all match endpoints
  - Add daylight saving time handling
  - _Requirements: 14.3, 15.6, 16.1-16.5_

- [ ]* 22.1 Write property test for timezone conversion
  - **Property 52: Timezone conversion accuracy**
  - **Validates: Requirements 16.1-16.5**

## Phase 7: Bracket Configuration

- [x] 23. Implement Round of 16 bracket configuration
  - Create bracket generation logic for 16 teams
  - Implement match scheduling for Round of 16
  - Add bracket validation
  - _Requirements: 6.1-6.3, 21.2_

- [ ] 24. Implement Quarterfinals bracket configuration
  - Create bracket generation for 8 teams
  - Implement match scheduling for Quarterfinals
  - Add team advancement tracking
  - _Requirements: 6.4-6.6, 21.3_

- [ ] 25. Implement Semifinals and Third Place bracket configuration
  - Create bracket generation for 4 teams
  - Generate 2 Semifinal matches and 1 Third Place match
  - Implement match scheduling
  - _Requirements: 6.7-6.9, 21.4-21.5_

- [ ] 26. Implement Final match configuration
  - Create Final match generation from semifinal winners
  - Implement automatic scheduling
  - _Requirements: 6.10, 21.5_

- [ ]* 26.1 Write unit tests for bracket configuration
  - Test correct number of matches generated
  - Test team advancement logic
  - Test bracket validation
  - _Requirements: 21.1-21.6_

## Phase 8: Leaderboard and Rankings

- [ ] 27. Implement leaderboard calculation and caching
  - Create leaderboard query logic with Redis caching
  - Implement ranking by total points
  - Add tiebreaker by registration timestamp
  - _Requirements: 18.1-18.6_

- [ ]* 27.1 Write property test for leaderboard ranking
  - **Property 42: Leaderboard ranks users by points**
  - **Validates: Requirements 18.1**

- [ ] 28. Implement real-time leaderboard updates
  - Create leaderboard update logic on score changes
  - Implement WebSocket broadcasting of leaderboard updates
  - Add Redis sorted set operations for efficient ranking
  - _Requirements: 18.1-18.6_

- [ ] 29. Implement leaderboard filtering and sorting
  - Create phase-specific leaderboard queries (group/elimination/all)
  - Implement pagination and limit parameters
  - Add user rank highlighting
  - _Requirements: 18.5-18.6_

- [ ]* 29.1 Write unit tests for leaderboard filtering
  - Test phase-specific filtering
  - Test pagination
  - Test user highlighting
  - _Requirements: 18.5-18.6_

## Phase 9: User Dashboards

- [ ] 30. Implement user prediction dashboard
  - Create dashboard endpoint with user predictions and scores
  - Implement prediction organization by phase
  - Add status indicators (pending, locked, completed)
  - _Requirements: 19.1-19.7_

- [ ] 31. Implement user profile management
  - Create profile page with account information
  - Implement profile update with validation
  - Add registration and payment status display
  - _Requirements: 3.1-3.5_

- [ ] 32. Implement account deletion
  - Create account deletion logic with confirmation
  - Implement cascading deletion of user data
  - Add audit logging for deletions
  - _Requirements: 3.4_

- [ ]* 32.1 Write property test for account deletion
  - **Property 5: Account deletion removes all data**
  - **Validates: Requirements 3.4**

## Phase 10: Admin Panel

- [ ] 33. Implement news management interface
  - Create news article CRUD operations
  - Implement publication and archival logic
  - Add modification timestamp tracking
  - _Requirements: 4.1-4.5_

- [ ]* 33.1 Write unit tests for news management
  - Test article creation, update, deletion
  - Test publication and archival
  - Test timestamp recording
  - _Requirements: 4.3-4.4_

- [ ] 34. Implement admin results entry interface
  - Create results entry form with validation
  - Implement pending results list
  - Add result confirmation and publishing
  - _Requirements: 26.1-26.9_

- [ ] 35. Implement admin user prediction viewer
  - Create user search and selection interface
  - Implement user prediction display with filtering
  - Add user score and rank display
  - _Requirements: 19.2.1-19.2.7_

- [ ] 36. Implement admin system statistics
  - Create statistics calculation (user count, predictions, scores)
  - Implement statistics endpoint
  - Add real-time statistics updates
  - _Requirements: 5.1_

## Phase 11: Real-Time Updates

- [ ] 37. Implement WebSocket server and connection management
  - Set up Socket.io or native WebSocket server
  - Implement connection establishment and cleanup
  - Add automatic reconnection logic
  - _Requirements: 17.2, 18.1_

- [ ] 38. Implement real-time event broadcasting
  - Create event emitters for score updates, lockdowns, results
  - Implement room-based broadcasting (match-specific, leaderboard-wide)
  - Add fallback to HTTP polling
  - _Requirements: 17.2, 18.1_

- [ ] 39. Implement real-time notification system
  - Create notification logic for lockdown warnings
  - Implement result publication notifications
  - Add leaderboard update notifications
  - _Requirements: 17.2_

## Phase 12: Testing and Simulation

- [ ] 40. Implement dummy user generation
  - Create realistic test user generation
  - Implement bulk user creation with test data flag
  - Add user data persistence
  - _Requirements: 27.1.1, 27.1.3_

- [ ] 41. Implement dummy prediction generation
  - Create varied prediction types (exact scores, winners, draws)
  - Implement realistic prediction distribution
  - Add test data flagging
  - _Requirements: 27.1.2-27.1.5_

- [ ] 42. Implement dummy result generation
  - Create realistic match result generation
  - Implement varied outcome distribution
  - Add test data flagging
  - _Requirements: 27.1.6_

- [ ] 43. Implement simulation workflow
  - Create end-to-end simulation orchestration
  - Implement sequential result publication and scoring
  - Add simulation report generation
  - _Requirements: 27.1.7-27.1.9_

- [ ] 44. Implement simulation data cleanup
  - Create test data identification and removal
  - Implement system reset logic
  - Add cleanup verification
  - _Requirements: 27.1.10_

- [ ] 45. Implement simulation mode indicator
  - Create TEST MODE display on all pages
  - Implement feature flag for simulation mode
  - Add simulation mode detection
  - _Requirements: 27.1.11_

## Phase 13: API Implementation (NestJS Controllers)

- [ ] 46. Implement authentication controllers
  - Create AuthController with endpoints for Google OAuth callback
  - POST /api/auth/google - Google OAuth callback handler
  - POST /api/auth/register - User registration completion
  - POST /api/auth/payment - Payment processing
  - GET /api/auth/session - Session validation
  - POST /api/auth/logout - Session termination
  - _Requirements: 1.1-1.5, 2.1-2.6_

- [ ] 47. Implement prediction controllers
  - Create PredictionController with prediction management endpoints
  - POST /api/predictions - Submit prediction
  - GET /api/predictions/:matchId - Get user's prediction for match
  - PUT /api/predictions/:predictionId - Edit prediction
  - GET /api/predictions/user/:userId - Get all user predictions
  - GET /api/predictions/match/:matchId/all - Get all predictions for match (admin)
  - _Requirements: 7.1-7.6, 8.1-8.6_

- [ ] 48. Implement match controllers
  - Create MatchController with match management endpoints
  - GET /api/matches - Get matches with filtering
  - GET /api/matches/:matchId - Get specific match
  - POST /api/matches/:matchId/result - Publish match result
  - GET /api/matches/schedule/group - Get group stage schedule
  - GET /api/matches/schedule/elimination - Get elimination schedule
  - _Requirements: 14.1-14.5, 15.1-15.7, 5.1-5.7_

- [ ] 49. Implement leaderboard controllers
  - Create LeaderboardController with ranking endpoints
  - GET /api/leaderboard - Get leaderboard with filtering
  - GET /api/leaderboard/user/:userId - Get user's leaderboard entry
  - _Requirements: 18.1-18.6_

- [ ] 50. Implement admin controllers
  - Create AdminController with admin management endpoints
  - POST /api/admin/news - Create news article
  - PUT /api/admin/news/:articleId - Update news article
  - DELETE /api/admin/news/:articleId - Delete news article
  - GET /api/admin/users/:userId/predictions - Get user predictions
  - POST /api/admin/bracket/round16 - Configure Round of 16
  - POST /api/admin/bracket/quarterfinals - Configure Quarterfinals
  - POST /api/admin/bracket/semifinals - Configure Semifinals
  - GET /api/admin/stats - Get system statistics
  - _Requirements: 4.1-4.5, 5.1-5.7, 6.1-6.10, 19.2.1-19.2.7_

- [ ] 51. Implement simulation controllers
  - Create SimulationController with testing endpoints
  - POST /api/simulation/generate-users - Generate dummy users
  - POST /api/simulation/generate-predictions - Generate dummy predictions
  - POST /api/simulation/generate-results - Generate dummy results
  - POST /api/simulation/clear - Clear simulation data
  - GET /api/simulation/report - Get simulation report
  - _Requirements: 27.1.1-27.1.11_

- [ ]* 51.1 Write unit tests for all NestJS controllers
  - Test request validation with DTOs
  - Test response formats and status codes
  - Test error handling and exception filters
  - _Requirements: 22.1-22.5, 25.1-25.5_

## Phase 14: Frontend Implementation (React + TypeScript + Redux)

- [ ] 52. Set up React project with TypeScript and Redux
  - Initialize React project with Create React App or Vite
  - Configure TypeScript with strict mode
  - Set up Redux Toolkit with Redux DevTools
  - Configure Redux Thunk for async actions
  - Set up React Router for navigation
  - Configure Axios with interceptors for API calls
  - _Requirements: 1.1-1.5, 2.1-2.6_

- [ ] 53. Implement Redux slices and state management
  - Create Auth slice (user, token, registration status, payment status)
  - Create Predictions slice (user predictions, prediction status, filters)
  - Create Matches slice (schedule, results, match details)
  - Create Leaderboard slice (rankings, user scores, filters)
  - Create UI slice (modals, notifications, loading states)
  - Implement selectors for efficient state access
  - _Requirements: 7.1-7.6, 18.1-18.6, 19.1-19.7_

- [ ] 54. Implement authentication pages and flows
  - Create login page with Google OAuth button
  - Create registration form component with user details
  - Create payment form integration component
  - Implement session validation and redirects
  - Create logout functionality
  - _Requirements: 1.1-1.5, 2.1-2.6_

- [ ] 55. Implement prediction submission interface
  - Create prediction form component with score/winner/draw options
  - Implement form validation with TypeScript types
  - Add lockdown countdown timer component
  - Implement submission confirmation modal
  - Add error handling and user feedback
  - _Requirements: 7.1-7.6_

- [ ] 56. Implement prediction editing interface
  - Create edit form component with pre-populated data
  - Implement lockdown status checking and UI feedback
  - Add edit confirmation and history display
  - Implement Redux actions for prediction updates
  - _Requirements: 8.1-8.6_

- [ ] 57. Implement user dashboard
  - Create dashboard layout with predictions and scores
  - Implement prediction list with filtering and sorting
  - Add real-time score updates via Socket.io
  - Display status indicators and points earned
  - Create Redux selectors for dashboard data
  - _Requirements: 19.1-19.7_

- [ ] 58. Implement leaderboard display
  - Create leaderboard table component with rankings
  - Implement user highlighting for current user
  - Add phase filtering (group/elimination/all)
  - Implement real-time updates via Socket.io
  - Add pagination and sorting
  - _Requirements: 18.1-18.6_

- [ ] 59. Implement match schedule display
  - Create match list component with teams and times
  - Implement timezone conversion display (UTC-4)
  - Add filtering by group/phase
  - Display match status and results
  - Create match detail modal
  - _Requirements: 14.1-14.5, 15.1-15.7, 16.1-16.5_

- [ ] 60. Implement admin panel
  - Create admin dashboard layout
  - Create news management interface (CRUD)
  - Create results entry interface with form validation
  - Create user prediction viewer with search
  - Create bracket configuration interface
  - Implement admin-only route guards
  - _Requirements: 4.1-4.5, 5.1-5.7, 6.1-6.10, 19.2.1-19.2.7_

- [ ] 61. Implement real-time updates with Socket.io
  - Create Socket.io client connection management
  - Implement score update listeners and Redux dispatch
  - Add leaderboard update listeners
  - Implement lockdown notification listeners
  - Add result publication listeners
  - Implement automatic reconnection logic
  - _Requirements: 17.1-17.5, 18.1-18.6_

- [ ] 62. Implement user profile management
  - Create profile page component
  - Implement profile update form with validation
  - Add registration and payment status display
  - Create account deletion confirmation modal
  - _Requirements: 3.1-3.5_

- [ ]* 62.1 Write unit tests for React components
  - Test component rendering with React Testing Library
  - Test user interactions and event handlers
  - Test Redux integration and state updates
  - Test async actions with Redux Thunk
  - _Requirements: 7.1-7.6, 8.1-8.6, 18.1-18.6_

## Phase 15: Integration and Deployment

- [ ] 63. Implement NestJS error handling and exception filters
  - Create global exception filter for error handling
  - Implement custom exception classes for domain errors
  - Add validation pipes for request validation
  - Implement user-friendly error messages
  - Add error logging with Winston
  - _Requirements: 25.1-25.5_

- [ ] 64. Implement data persistence and consistency
  - Create transaction management for critical operations
  - Implement idempotent operations for score calculations
  - Add data consistency validation in services
  - Create database transaction decorators
  - _Requirements: 24.1-24.5_

- [ ] 65. Implement monitoring and alerting
  - Create performance metrics collection with Prometheus
  - Implement alerting for error thresholds
  - Add logging for audit trail with Winston
  - Create health check endpoints
  - _Requirements: 5.1-5.7_

- [ ] 66. Implement deployment configuration
  - Create environment configuration management (.env files)
  - Implement database migration automation
  - Add Docker configuration for containerization
  - Create deployment documentation
  - _Requirements: 24.1-24.5_

- [ ] 67. Checkpoint - Ensure all tests pass and system is ready for production
  - Run all NestJS unit tests and integration tests
  - Run all React component tests
  - Run property-based tests for core logic
  - Verify all endpoints are functional
  - Test end-to-end workflows
  - Ensure all requirements are met
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation
- All timestamps use UTC internally, converted to La Paz timezone (UTC-4) for display
- Scoring engine prevents double-counting through careful property validation
- WebSocket fallback to HTTP polling ensures compatibility
- Simulation mode is completely isolated from production data
