# Requirements Document: Copa Mundial 2026 Sports Prediction System

## Introduction

The Copa Mundial 2026 Sports Prediction System is a web-based platform that enables users to make predictions on Copa Mundial 2026 match outcomes and earn points based on prediction accuracy. The system manages a complete tournament lifecycle including group stage matches, dynamic elimination phase configuration, real-time scoring, and competitive leaderboards. Users authenticate via Google, complete registration and payment by May 31, 2026, and participate in predicting 104 total matches across group and elimination phases.

## Glossary

- **System**: The Copa Mundial 2026 Sports Prediction System
- **User**: An authenticated player who makes predictions and competes for points
- **Admin**: A system administrator with content management and configuration privileges
- **Match**: A single Copa Mundial 2026 game with two competing teams
- **Prediction**: A user's forecast of a match outcome (score, winner, or draw)
- **Group Stage**: The initial tournament phase with 72 matches (June 1-30, 2026)
- **Elimination Phase**: The knockout tournament phase with 32 matches (July 1 - August 16, 2026)
- **Lockdown**: The state where predictions can no longer be edited (15 minutes before match start)
- **Cutoff Time**: The exact moment when predictions are locked (15 minutes before scheduled match time)
- **Knockout Round**: A single-elimination match where the winner advances
- **Bracket**: The dynamic structure of elimination phase matches based on group stage results
- **Leaderboard**: A ranked list of users sorted by accumulated points
- **La Paz Timezone**: UTC-4 timezone used for all match time conversions
- **Round of 16**: First elimination phase with 16 matches (32 teams)
- **Quarterfinals**: Second elimination phase with 8 matches (8 teams)
- **Semifinals**: Third elimination phase with 2 matches (4 teams)
- **Third Place Match**: Match determining 3rd and 4th place finishers
- **Final**: Championship match between the two semifinal winners
- **Goal Difference**: The absolute difference between goals scored by two teams in a match
- **Exact Score**: A prediction matching both the final score and the winner
- **Correct Winner**: A prediction matching the match winner but not the exact score
- **Correct Draw**: A prediction correctly forecasting a draw result

## Requirements

### Requirement 1: Google Authentication Integration

**User Story:** As a new user, I want to authenticate using my Google account, so that I can quickly access the platform without creating a separate password.

#### Acceptance Criteria

1. WHEN a user navigates to the login page, THE System SHALL display a "Sign in with Google" button
2. WHEN a user clicks the "Sign in with Google" button, THE System SHALL redirect to Google's OAuth 2.0 authentication flow
3. WHEN Google authentication succeeds, THE System SHALL create or retrieve the user's account and redirect to the registration page
4. WHEN Google authentication fails, THE System SHALL display an error message and remain on the login page
5. WHEN a user is already authenticated, THE System SHALL redirect them to the dashboard instead of the login page

### Requirement 2: User Registration and Payment Completion

**User Story:** As an authenticated user, I want to complete registration and payment, so that I can participate in the tournament predictions.

#### Acceptance Criteria

1. WHEN a user completes Google authentication, THE System SHALL present a registration form requiring user details
2. WHEN a user submits the registration form with valid information, THE System SHALL initiate a payment process
3. WHEN a user completes payment successfully, THE System SHALL mark the user account as active and record the registration timestamp
4. IF a user has not completed registration and payment by May 31, 2026 at 00:00 UTC-5, THEN THE System SHALL prevent them from submitting predictions
5. WHEN a user attempts to access prediction features before completing registration and payment, THE System SHALL display a message directing them to complete these steps
6. WHEN a user's payment fails, THE System SHALL display an error message and allow them to retry the payment process

### Requirement 3: User Account Management

**User Story:** As a registered user, I want to manage my account settings, so that I can update my profile information and preferences.

#### Acceptance Criteria

1. THE System SHALL provide a user profile page accessible from the main dashboard
2. WHEN a user accesses their profile page, THE System SHALL display their current account information
3. WHEN a user updates their profile information, THE System SHALL validate the changes and persist them to the database
4. WHEN a user requests to delete their account, THE System SHALL require confirmation and remove all associated data
5. THE System SHALL allow users to view their registration and payment status at any time

### Requirement 4: Admin Panel - News Publication

**User Story:** As an admin, I want to publish news articles about the tournament, so that users stay informed about important updates.

#### Acceptance Criteria

1. WHEN an admin accesses the admin panel, THE System SHALL display a news management interface
2. WHEN an admin creates a new news article, THE System SHALL require a title, content, and publication date
3. WHEN an admin publishes a news article, THE System SHALL make it visible to all users on the news feed
4. WHEN an admin edits a published news article, THE System SHALL update the content and record the modification timestamp
5. WHEN an admin deletes a news article, THE System SHALL remove it from the news feed and archive it

### Requirement 5: Admin Panel - Match Results Publication

**User Story:** As an admin, I want to manually publish match results within 5 minutes of match completion, so that the system reflects the actual tournament outcomes and scores are updated promptly.

#### Acceptance Criteria

1. WHEN a match concludes, THE System SHALL display a notification to the admin indicating the match has finished
2. WHEN an admin accesses the match results management interface, THE System SHALL display a list of completed matches awaiting result entry
3. WHEN an admin enters a match result (final score and winner), THE System SHALL validate the input format
4. WHEN an admin publishes a match result within 5 minutes of match completion, THE System SHALL trigger automatic score calculation for all user predictions on that match
5. WHEN a match result is published, THE System SHALL update the leaderboard with new points for all affected users
6. IF an admin attempts to publish a result for a match that already has a published result, THEN THE System SHALL prevent the duplicate publication and display a warning
7. THE System SHALL record the timestamp when the result was published by the admin

### Requirement 6: Dynamic Fixture Configuration for Elimination Phases

**User Story:** As an admin, I want to configure elimination phase fixtures dynamically, so that the bracket reflects actual group stage results.

#### Acceptance Criteria

1. WHEN the group stage concludes, THE System SHALL provide an interface to configure the Round of 16 bracket
2. WHEN an admin configures the Round of 16 bracket, THE System SHALL accept the 16 qualified teams and their seeding
3. WHEN an admin submits the Round of 16 configuration, THE System SHALL generate all 16 Round of 16 matches with scheduled dates
4. WHEN Round of 16 matches conclude, THE System SHALL provide an interface to configure the Quarterfinals bracket
5. WHEN an admin configures the Quarterfinals bracket, THE System SHALL accept the 8 qualified teams from Round of 16
6. WHEN an admin submits the Quarterfinals configuration, THE System SHALL generate all 8 Quarterfinal matches
7. WHEN Quarterfinals conclude, THE System SHALL provide an interface to configure the Semifinals bracket
8. WHEN an admin configures the Semifinals bracket, THE System SHALL accept the 4 qualified teams from Quarterfinals
9. WHEN an admin submits the Semifinals configuration, THE System SHALL generate the 2 Semifinal matches and the Third Place match
10. WHEN Semifinals conclude, THE System SHALL automatically schedule the Final match between the two semifinal winners

### Requirement 7: Prediction Submission

**User Story:** As a registered user, I want to submit predictions for upcoming matches, so that I can compete for points based on prediction accuracy.

#### Acceptance Criteria

1. WHEN a user views an upcoming match, THE System SHALL display a prediction form with options for score prediction, winner prediction, or draw prediction
2. WHEN a user submits a prediction, THE System SHALL validate that the prediction format is correct
3. WHEN a user submits a valid prediction, THE System SHALL store it with the user ID, match ID, prediction details, and submission timestamp
4. WHEN a user submits a prediction before the lockdown time, THE System SHALL accept and store the prediction
5. IF a user attempts to submit a prediction after the lockdown time, THEN THE System SHALL reject the prediction and display an error message
6. WHEN a user submits a prediction for a match that has already concluded, THE System SHALL reject the prediction and display an error message

### Requirement 8: Prediction Editing and Lockdown

**User Story:** As a user, I want to edit my predictions before they are locked, so that I can correct mistakes or change my forecast.

#### Acceptance Criteria

1. WHEN a user views a prediction they submitted, THE System SHALL display an "Edit" button if the prediction is not locked
2. WHEN a user clicks the "Edit" button, THE System SHALL display the prediction form pre-populated with their current prediction
3. WHEN a user modifies and resubmits a prediction before lockdown, THE System SHALL update the stored prediction
4. WHEN the lockdown time arrives (15 minutes before scheduled match time), THE System SHALL prevent all further edits to predictions for that match
5. WHEN a user attempts to edit a locked prediction, THE System SHALL display a message indicating the prediction is locked
6. WHEN a prediction is locked, THE System SHALL record the lockdown timestamp

### Requirement 9: Prediction Lockdown Enforcement

**User Story:** As the system, I want to enforce prediction lockdown 15 minutes before each match, so that predictions cannot be changed after the cutoff.

#### Acceptance Criteria

1. FOR each match, THE System SHALL calculate the lockdown time as 15 minutes before the scheduled match start time
2. WHEN the current time reaches the lockdown time, THE System SHALL transition all predictions for that match to locked status
3. WHEN a prediction is locked, THE System SHALL prevent any modifications to that prediction
4. WHEN a user attempts to submit a new prediction after lockdown, THE System SHALL reject it with an error message
5. WHEN a match is rescheduled, THE System SHALL recalculate the lockdown time based on the new scheduled start time

### Requirement 10: Exact Score Prediction Scoring

**User Story:** As a user, I want to earn 3 points for exact score predictions, so that I am rewarded for accurate forecasts.

#### Acceptance Criteria

1. WHEN a match concludes and the final score is published, THE System SHALL compare each user's prediction to the actual result
2. WHEN a user's prediction matches the exact final score (both teams' goals), THE System SHALL award 3 points to that user
3. WHEN a user's prediction does not match the exact score, THE System SHALL not award 3 points for this criterion
4. WHEN multiple users predict the exact same score, THE System SHALL award 3 points to each of them independently

### Requirement 11: Correct Winner with Goal Difference Scoring

**User Story:** As a user, I want to earn 2 points for predicting the correct winner with the correct goal difference, so that I am rewarded for partially accurate forecasts.

#### Acceptance Criteria

1. WHEN a match concludes and the final score is published, THE System SHALL calculate the goal difference (absolute difference between goals)
2. WHEN a user's prediction matches the correct winner AND the goal difference, THE System SHALL award 2 points to that user
3. WHEN a user's prediction matches the winner but not the goal difference, THE System SHALL not award 2 points for this criterion
4. WHEN a user's prediction does not match the winner, THE System SHALL not award 2 points regardless of goal difference
5. WHEN the actual result is a draw, THE System SHALL calculate goal difference as 0

### Requirement 12: Correct Winner or Draw Scoring

**User Story:** As a user, I want to earn 1 point for predicting the correct winner or a correct draw, so that I am rewarded for basic prediction accuracy.

#### Acceptance Criteria

1. WHEN a match concludes and the final score is published, THE System SHALL determine if the actual result is a win or draw
2. WHEN a user's prediction matches the correct winner (regardless of score), THE System SHALL award 1 point to that user
3. WHEN a user's prediction correctly forecasts a draw, THE System SHALL award 1 point to that user
4. WHEN a user's prediction does not match the winner or draw, THE System SHALL not award 1 point
5. WHEN a user earns 3 points for exact score, THE System SHALL NOT also award 1 point for correct winner (no double-counting)

### Requirement 13: Elimination Phase Team Advancement Scoring

**User Story:** As a user, I want to earn bonus points for correctly predicting team advancement through knockout rounds, so that I am rewarded for accurate bracket predictions.

#### Acceptance Criteria

1. WHEN a user submits a prediction for an elimination phase match, THE System SHALL allow them to predict which team advances to the next round
2. WHEN an elimination phase match concludes, THE System SHALL determine the advancing team
3. WHEN a user's advancement prediction is correct, THE System SHALL award 1 point to that user
4. WHEN a user's advancement prediction is incorrect, THE System SHALL not award advancement points
5. WHEN a user correctly predicts advancement through multiple consecutive rounds, THE System SHALL award 1 point per round (not cumulative multipliers)

### Requirement 14: Group Stage Match Schedule

**User Story:** As a user, I want to view the complete group stage schedule, so that I can plan my predictions.

#### Acceptance Criteria

1. THE System SHALL display all 72 group stage matches scheduled between June 1-30, 2026
2. WHEN a user views the match schedule, THE System SHALL display each match with teams, scheduled date/time, and current status
3. WHEN a user views a match time, THE System SHALL convert and display it in the user's local timezone (or UTC-5 for reference)
4. WHEN the group stage begins, THE System SHALL mark matches as "Upcoming", "In Progress", or "Completed" based on current time
5. THE System SHALL allow users to filter matches by group or date

### Requirement 15: Elimination Phase Match Schedule

**User Story:** As a user, I want to view the elimination phase schedule, so that I can make predictions on knockout matches.

#### Acceptance Criteria

1. WHEN the Round of 16 is configured, THE System SHALL display all 16 Round of 16 matches scheduled for July 1-6, 2026
2. WHEN the Quarterfinals are configured, THE System SHALL display all 8 Quarterfinal matches scheduled for July 7-10, 2026
3. WHEN the Semifinals are configured, THE System SHALL display the 2 Semifinal matches scheduled for July 14-15, 2026
4. THE System SHALL display the Third Place match scheduled for August 14, 2026
5. THE System SHALL display the Final match scheduled for August 16, 2026
6. WHEN a user views any elimination phase match time, THE System SHALL convert and display it in the user's local timezone
7. THE System SHALL display the bracket structure showing team progression through elimination rounds

### Requirement 16: Timezone Conversion to User's Local Time

**User Story:** As a user in any timezone, I want all match times displayed in my local timezone, so that I know the exact local time for predictions.

#### Acceptance Criteria

1. WHEN the System stores a match scheduled time, THE System SHALL store it in UTC
2. WHEN a user views a match time, THE System SHALL convert the UTC time to the user's local timezone and display it
3. WHEN daylight saving time changes occur, THE System SHALL maintain accurate timezone conversion
4. WHEN a user's browser timezone differs from UTC, THE System SHALL display times in the user's local timezone
5. THE System SHALL display the timezone abbreviation (e.g., "EST", "PST", "UTC") next to all displayed times

### Requirement 17: Real-Time Score Updates

**User Story:** As a user, I want to see real-time score updates during matches, so that I can follow the tournament as it happens.

#### Acceptance Criteria

1. WHEN a match is in progress, THE System SHALL display the current score
2. WHEN the score changes during a match, THE System SHALL update the displayed score within 30 seconds
3. WHEN a match concludes, THE System SHALL display the final score and mark the match as completed
4. WHEN a match result is published, THE System SHALL trigger score recalculation for all user predictions on that match
5. WHEN multiple users are viewing the same match, THE System SHALL ensure all users see consistent score information

### Requirement 18: Leaderboard and Ranking System

**User Story:** As a user, I want to view a leaderboard showing my ranking and other users' scores, so that I can see how I compare to other competitors.

#### Acceptance Criteria

1. THE System SHALL display a leaderboard showing all active users ranked by total accumulated points
2. WHEN a user views the leaderboard, THE System SHALL display their current rank, username, and total points
3. WHEN a user's points change, THE System SHALL update their leaderboard position in real-time
4. WHEN multiple users have the same points, THE System SHALL rank them by earliest registration timestamp (tiebreaker)
5. THE System SHALL allow users to filter the leaderboard by tournament phase (group stage, elimination phase, or all)
6. WHEN a user views the leaderboard, THE System SHALL highlight their own entry

### Requirement 19: User Prediction History

**User Story:** As a user, I want to view my prediction history, so that I can review my past predictions and their outcomes.

#### Acceptance Criteria

1. WHEN a user accesses their prediction history, THE System SHALL display all predictions they have submitted
2. WHEN a user views their prediction history, THE System SHALL display each prediction with the match details, their prediction, the actual result, and points earned
3. WHEN a user views their prediction history, THE System SHALL allow filtering by tournament phase or date range
4. WHEN a user views a completed prediction, THE System SHALL display whether it was correct and how many points were earned
5. WHEN a user views a pending prediction, THE System SHALL display the prediction status and time remaining until lockdown

### Requirement 19.1: User Predictions Dashboard

**User Story:** As a registered user, I want to view a personalized dashboard showing all my predictions and accumulated points, so that I can track my performance throughout the tournament.

#### Acceptance Criteria

1. WHEN a user accesses their dashboard, THE System SHALL display a summary of their total points and current leaderboard rank
2. WHEN a user views their dashboard, THE System SHALL display all their predictions organized by tournament phase
3. WHEN a user views a prediction on their dashboard, THE System SHALL display the match details, their prediction, the actual result (if available), and points earned
4. WHEN a user views their dashboard, THE System SHALL show the status of each prediction (pending, locked, completed)
5. WHEN a match result is published, THE System SHALL update the user's dashboard in real-time with new points and updated predictions
6. THE System SHALL allow users to filter their predictions by match status (pending, locked, completed)
7. THE System SHALL display a running total of points earned in each tournament phase

### Requirement 19.2: Admin Prediction Viewer

**User Story:** As an admin, I want to view the predictions of any user, so that I can monitor betting activity and verify prediction accuracy.

#### Acceptance Criteria

1. WHEN an admin accesses the admin panel, THE System SHALL provide a user search or selection interface
2. WHEN an admin selects a specific user, THE System SHALL display all predictions submitted by that user
3. WHEN an admin views a user's predictions, THE System SHALL display each prediction with match details, the user's prediction, actual result, and points earned
4. WHEN an admin views a user's predictions, THE System SHALL display the user's total points and current leaderboard rank
5. WHEN an admin views a user's predictions, THE System SHALL allow filtering by tournament phase or match status
6. WHEN a match result is published, THE System SHALL update the admin's view of user predictions in real-time
7. THE System SHALL record and display when each prediction was submitted and when it was locked

### Requirement 20: Match Results Display

**User Story:** As a user, I want to view match results and final scores, so that I can see how my predictions performed.

#### Acceptance Criteria

1. WHEN a match concludes, THE System SHALL display the final score and result status (win/draw/loss for each team)
2. WHEN a user views a completed match, THE System SHALL display the final score, match date/time, and teams involved
3. WHEN a user views a completed match, THE System SHALL display how many points they earned on their prediction for that match
4. THE System SHALL display match results organized by tournament phase and date
5. WHEN a user views match results, THE System SHALL allow filtering by group (for group stage) or round (for elimination phase)

### Requirement 21: Tournament Structure Validation

**User Story:** As the system, I want to validate the tournament structure, so that the correct number of matches are scheduled.

#### Acceptance Criteria

1. WHEN the group stage is configured, THE System SHALL validate that exactly 72 matches are scheduled
2. WHEN the Round of 16 is configured, THE System SHALL validate that exactly 16 matches are scheduled
3. WHEN the Quarterfinals are configured, THE System SHALL validate that exactly 8 matches are scheduled
4. WHEN the Semifinals are configured, THE System SHALL validate that exactly 2 matches are scheduled
5. WHEN the Third Place and Final are configured, THE System SHALL validate that exactly 2 matches are scheduled
6. WHEN all tournament phases are complete, THE System SHALL validate that exactly 104 total matches have been scheduled

### Requirement 22: Prediction Validation

**User Story:** As the system, I want to validate all predictions, so that only valid predictions are accepted.

#### Acceptance Criteria

1. WHEN a user submits a prediction, THE System SHALL validate that the match exists and is scheduled
2. WHEN a user submits a prediction, THE System SHALL validate that the prediction format is correct (valid score or winner selection)
3. WHEN a user submits a prediction, THE System SHALL validate that the current time is before the lockdown time
4. WHEN a user submits a prediction, THE System SHALL validate that the user has completed registration and payment
5. IF any validation fails, THEN THE System SHALL reject the prediction and display a specific error message

### Requirement 23: Score Calculation Accuracy

**User Story:** As the system, I want to calculate scores accurately, so that users receive correct points for their predictions.

#### Acceptance Criteria

1. WHEN a match result is published, THE System SHALL recalculate scores for all predictions on that match
2. WHEN calculating scores, THE System SHALL apply the correct point values (3 for exact, 2 for winner+difference, 1 for winner/draw)
3. WHEN calculating scores, THE System SHALL not double-count points (e.g., if a user earns 3 points, they don't also earn 1 point)
4. WHEN calculating elimination phase scores, THE System SHALL award advancement points separately from match outcome points
5. WHEN a match result is corrected, THE System SHALL recalculate all affected user scores

### Requirement 24: Data Persistence and Consistency

**User Story:** As the system, I want to persist all data consistently, so that no predictions or scores are lost.

#### Acceptance Criteria

1. WHEN a user submits a prediction, THE System SHALL persist it to the database before confirming to the user
2. WHEN a match result is published, THE System SHALL persist it to the database before updating leaderboards
3. WHEN user scores are updated, THE System SHALL persist the changes to the database
4. WHEN the system experiences an error, THE System SHALL maintain data consistency and not create duplicate records
5. THE System SHALL maintain transaction integrity for all score calculations and updates

### Requirement 25: Error Handling and Recovery

**User Story:** As the system, I want to handle errors gracefully, so that users experience reliable service.

#### Acceptance Criteria

1. WHEN a database error occurs, THE System SHALL log the error and display a user-friendly message
2. WHEN a payment processing error occurs, THE System SHALL allow the user to retry without losing their registration data
3. WHEN a match result publication fails, THE System SHALL not partially update scores and allow retry
4. WHEN a prediction submission fails, THE System SHALL not create a partial record and allow the user to retry
5. WHEN the system recovers from an error, THE System SHALL verify data consistency before resuming normal operations

### Requirement 26: Admin Results Entry Interface

**User Story:** As an admin, I want a dedicated interface to quickly enter match results, so that I can publish results within 5 minutes of match completion.

#### Acceptance Criteria

1. WHEN an admin accesses the results entry interface, THE System SHALL display a list of all completed matches that are awaiting result entry
2. WHEN an admin views the results entry interface, THE System SHALL display each match with teams, scheduled time, and current status
3. WHEN an admin selects a match, THE System SHALL display a form to enter the final score for both teams
4. WHEN an admin enters a score, THE System SHALL validate that the score format is correct (non-negative integers)
5. WHEN an admin submits a match result, THE System SHALL confirm the result before publishing
6. WHEN an admin publishes a result, THE System SHALL immediately trigger score calculation for all user predictions on that match
7. WHEN a result is published, THE System SHALL display a confirmation message and remove the match from the pending results list
8. THE System SHALL display a timer or indicator showing how much time has elapsed since the match ended
9. THE System SHALL allow admins to view previously published results and edit them if necessary (with audit trail)

### Requirement 27: Testing and Simulation Mode

**User Story:** As a developer/tester, I want to test the system with dummy data including mock predictions and results, so that I can verify the scoring and leaderboard functionality before production.

#### Acceptance Criteria

1. WHEN the system is in testing mode, THE System SHALL provide a simulation interface accessible only to admins with testing privileges
2. WHEN an admin accesses the simulation interface, THE System SHALL display options to generate dummy data
3. WHEN an admin selects "Generate Dummy Users", THE System SHALL create test user accounts with realistic names and registration data
4. WHEN an admin selects "Generate Dummy Predictions", THE System SHALL create random predictions for test users across multiple matches
5. WHEN dummy predictions are generated, THE System SHALL vary the prediction types (exact scores, winners, draws) to simulate realistic betting patterns
6. WHEN an admin selects "Generate Dummy Results", THE System SHALL create match results with various outcomes
7. WHEN dummy results are generated, THE System SHALL trigger automatic score calculation for all dummy predictions
8. WHEN an admin publishes dummy results, THE System SHALL update the leaderboard with calculated scores
9. WHEN testing is complete, THE System SHALL provide an option to clear all dummy data and reset the system
10. THE System SHALL maintain a clear separation between test data and production data
11. WHEN the system is in testing mode, THE System SHALL display a clear indicator (e.g., "TEST MODE") on all pages

### Requirement 27.1: Dummy Data Generation

**User Story:** As a tester, I want to generate realistic dummy data for predictions and results, so that I can test the entire scoring workflow.

#### Acceptance Criteria

1. WHEN generating dummy predictions, THE System SHALL allow specifying the number of test users to create
2. WHEN generating dummy predictions, THE System SHALL allow specifying the number of matches to generate predictions for
3. WHEN generating dummy predictions, THE System SHALL create varied prediction types (exact scores ranging from 0-5 goals per team, winners, draws)
4. WHEN generating dummy results, THE System SHALL allow specifying which matches to generate results for
5. WHEN generating dummy results, THE System SHALL create realistic match outcomes (scores, winners, draws)
6. WHEN dummy data is generated, THE System SHALL display a summary showing number of users, predictions, and results created
7. THE System SHALL allow exporting dummy data for analysis and debugging
8. THE System SHALL provide a way to generate specific test scenarios (e.g., "all users predict exact score", "mixed predictions")

### Requirement 27.2: Simulation Workflow Testing

**User Story:** As a tester, I want to simulate the complete workflow from predictions to scoring, so that I can verify the system works end-to-end.

#### Acceptance Criteria

1. WHEN a tester initiates a simulation workflow, THE System SHALL create dummy users, matches, and predictions in sequence
2. WHEN the simulation is running, THE System SHALL allow the tester to manually publish results for dummy matches
3. WHEN results are published in simulation mode, THE System SHALL immediately calculate scores and update the leaderboard
4. WHEN the simulation is complete, THE System SHALL display a report showing:
   - Number of predictions made
   - Number of results published
   - Score distribution across test users
   - Leaderboard rankings
5. WHEN a tester views the simulation report, THE System SHALL allow filtering and sorting by various metrics
6. THE System SHALL allow running multiple simulation scenarios sequentially or in parallel
7. WHEN simulation data is cleared, THE System SHALL verify that all dummy data is removed and the system is clean

