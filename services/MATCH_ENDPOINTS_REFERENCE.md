# Match Endpoints Reference

## Overview

The Match API provides comprehensive endpoints for retrieving and filtering match schedules for the Copa Mundial 2026 tournament. All endpoints return match data with team information, scheduled times, and current status.

## Base URL

```
http://localhost:3000/api/matches
```

## Endpoints

### 1. Get All Matches (with optional filtering)

**Endpoint:** `GET /api/matches`

**Description:** Retrieve matches with optional filtering by phase, status, date range, and group.

**Query Parameters:**

| Parameter | Type | Required | Values | Description |
|-----------|------|----------|--------|-------------|
| phase | string | No | `group`, `elimination` | Filter by tournament phase |
| status | string | No | `scheduled`, `in_progress`, `completed`, `postponed` | Filter by match status |
| group | string | No | `A-H` | Filter by group (group stage only) |
| startDate | string | No | ISO 8601 | Start of date range (e.g., 2026-06-01T00:00:00Z) |
| endDate | string | No | ISO 8601 | End of date range (e.g., 2026-06-30T23:59:59Z) |

**Examples:**

```bash
# Get all matches
curl http://localhost:3000/api/matches

# Get all group stage matches
curl "http://localhost:3000/api/matches?phase=group"

# Get all scheduled matches
curl "http://localhost:3000/api/matches?status=scheduled"

# Get all matches in group A
curl "http://localhost:3000/api/matches?group=A"

# Get matches in June 2026
curl "http://localhost:3000/api/matches?startDate=2026-06-01T00:00:00Z&endDate=2026-06-30T23:59:59Z"

# Get scheduled group stage matches in group A
curl "http://localhost:3000/api/matches?phase=group&status=scheduled&group=A"

# Get completed matches in July 2026
curl "http://localhost:3000/api/matches?status=completed&startDate=2026-07-01T00:00:00Z&endDate=2026-07-31T23:59:59Z"
```

**Response:**

```json
[
  {
    "id": "match1",
    "team1Id": "team1",
    "team2Id": "team2",
    "team1": {
      "id": "team1",
      "name": "Argentina",
      "group": "A"
    },
    "team2": {
      "id": "team2",
      "name": "Canada",
      "group": "A"
    },
    "scheduledTime": "2026-06-11T14:00:00Z",
    "lockdownTime": "2026-06-11T13:45:00Z",
    "status": "scheduled",
    "phase": "group",
    "groupStageGroup": "A",
    "eliminationRound": null,
    "createdAt": "2026-03-27T19:22:35.385Z",
    "updatedAt": "2026-03-27T19:22:35.385Z",
    "predictions": [],
    "result": null
  }
]
```

**Status Codes:**
- `200 OK` - Successful retrieval
- `400 Bad Request` - Invalid filter parameters

**Error Examples:**

```bash
# Invalid phase
curl "http://localhost:3000/api/matches?phase=invalid"
# Response: 400 Bad Request - "Invalid phase. Must be one of: group, elimination"

# Invalid status
curl "http://localhost:3000/api/matches?status=invalid"
# Response: 400 Bad Request - "Invalid status. Must be one of: scheduled, in_progress, completed, postponed"

# Invalid date format
curl "http://localhost:3000/api/matches?startDate=invalid&endDate=2026-06-30"
# Response: 400 Bad Request - "Invalid date format. Use ISO 8601 format (e.g., 2026-06-01T00:00:00Z)"

# startDate after endDate
curl "http://localhost:3000/api/matches?startDate=2026-06-30T00:00:00Z&endDate=2026-06-01T00:00:00Z"
# Response: 400 Bad Request - "startDate must be before endDate"

# Group filter with elimination phase
curl "http://localhost:3000/api/matches?phase=elimination&group=A"
# Response: 400 Bad Request - "Group filter only applies to group stage matches"
```

---

### 2. Get Specific Match

**Endpoint:** `GET /api/matches/:matchId`

**Description:** Retrieve a specific match by its ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| matchId | string | Yes | UUID of the match |

**Examples:**

```bash
# Get specific match
curl http://localhost:3000/api/matches/match1
```

**Response:**

```json
{
  "id": "match1",
  "team1Id": "team1",
  "team2Id": "team2",
  "team1": {
    "id": "team1",
    "name": "Argentina",
    "group": "A"
  },
  "team2": {
    "id": "team2",
    "name": "Canada",
    "group": "A"
  },
  "scheduledTime": "2026-06-11T14:00:00Z",
  "lockdownTime": "2026-06-11T13:45:00Z",
  "status": "scheduled",
  "phase": "group",
  "groupStageGroup": "A",
  "eliminationRound": null,
  "createdAt": "2026-03-27T19:22:35.385Z",
  "updatedAt": "2026-03-27T19:22:35.385Z",
  "predictions": [],
  "result": null
}
```

**Status Codes:**
- `200 OK` - Match found
- `404 Not Found` - Match not found
- `400 Bad Request` - Invalid match ID format

---

### 3. Get Group Stage Schedule

**Endpoint:** `GET /api/matches/schedule/group`

**Description:** Retrieve all group stage matches (72 total).

**Examples:**

```bash
# Get all group stage matches
curl http://localhost:3000/api/matches/schedule/group
```

**Response:**

```json
[
  {
    "id": "match1",
    "team1Id": "team1",
    "team2Id": "team2",
    "team1": { "id": "team1", "name": "Argentina", "group": "A" },
    "team2": { "id": "team2", "name": "Canada", "group": "A" },
    "scheduledTime": "2026-06-11T14:00:00Z",
    "lockdownTime": "2026-06-11T13:45:00Z",
    "status": "scheduled",
    "phase": "group",
    "groupStageGroup": "A",
    "eliminationRound": null,
    "createdAt": "2026-03-27T19:22:35.385Z",
    "updatedAt": "2026-03-27T19:22:35.385Z",
    "predictions": [],
    "result": null
  },
  // ... 71 more matches
]
```

**Status Codes:**
- `200 OK` - Successful retrieval

**Notes:**
- Returns 72 matches total (6 per group, 8 groups)
- Matches sorted by scheduled time
- All matches have `phase: "group"`
- `groupStageGroup` field contains group letter (A-H)

---

### 4. Get Elimination Schedule

**Endpoint:** `GET /api/matches/schedule/elimination`

**Description:** Retrieve all elimination phase matches (32 total).

**Examples:**

```bash
# Get all elimination matches
curl http://localhost:3000/api/matches/schedule/elimination
```

**Response:**

```json
[
  {
    "id": "match73",
    "team1Id": "team5",
    "team2Id": "team6",
    "team1": { "id": "team5", "name": "Team E", "group": null },
    "team2": { "id": "team6", "name": "Team F", "group": null },
    "scheduledTime": "2026-07-01T14:00:00Z",
    "lockdownTime": "2026-07-01T13:45:00Z",
    "status": "scheduled",
    "phase": "elimination",
    "groupStageGroup": null,
    "eliminationRound": "R16",
    "createdAt": "2026-03-27T19:22:35.385Z",
    "updatedAt": "2026-03-27T19:22:35.385Z",
    "predictions": [],
    "result": null
  },
  // ... 31 more matches
]
```

**Status Codes:**
- `200 OK` - Successful retrieval

**Notes:**
- Returns 32 matches total:
  - 16 Round of 16 (R16)
  - 8 Quarterfinals (QF)
  - 4 Semifinals (SF)
  - 2 Finals (Final)
- Matches sorted by scheduled time
- All matches have `phase: "elimination"`
- `eliminationRound` field contains round identifier
- `groupStageGroup` is null for elimination matches

---

## Response Format

### Match Object

```typescript
{
  id: string;                    // UUID of the match
  team1Id: string;               // UUID of team 1
  team2Id: string;               // UUID of team 2
  team1: Team;                   // Team 1 object with name and group
  team2: Team;                   // Team 2 object with name and group
  scheduledTime: Date;           // Match scheduled time (UTC)
  lockdownTime: Date;            // Prediction lockdown time (15 min before)
  status: MatchStatus;           // Current match status
  phase: MatchPhase;             // Tournament phase (group or elimination)
  groupStageGroup: string | null; // Group letter (A-H) for group stage
  eliminationRound: string | null; // Round identifier for elimination
  createdAt: Date;               // Record creation timestamp
  updatedAt: Date;               // Record last update timestamp
  predictions: Prediction[];     // User predictions for this match
  result: MatchResult | null;    // Match result (if completed)
}
```

### Match Status Values

- `scheduled` - Match not yet started
- `in_progress` - Match currently being played
- `completed` - Match finished
- `postponed` - Match rescheduled

### Match Phase Values

- `group` - Group stage match
- `elimination` - Knockout stage match

---

## Filter Combinations

### Valid Combinations

| Filters | Example |
|---------|---------|
| None | `GET /api/matches` |
| Phase only | `GET /api/matches?phase=group` |
| Status only | `GET /api/matches?status=scheduled` |
| Group only | `GET /api/matches?group=A` |
| Date range only | `GET /api/matches?startDate=...&endDate=...` |
| Phase + Status | `GET /api/matches?phase=group&status=scheduled` |
| Phase + Group | `GET /api/matches?phase=group&group=A` |
| Date range + Phase | `GET /api/matches?startDate=...&endDate=...&phase=group` |
| Date range + Status | `GET /api/matches?startDate=...&endDate=...&status=scheduled` |
| Date range + Phase + Status | `GET /api/matches?startDate=...&endDate=...&phase=group&status=scheduled` |
| Date range + Phase + Status + Group | `GET /api/matches?startDate=...&endDate=...&phase=group&status=scheduled&group=A` |

### Invalid Combinations

| Filters | Reason |
|---------|--------|
| Elimination + Group | Group filter only applies to group stage |

---

## Common Use Cases

### 1. Get upcoming group stage matches
```bash
curl "http://localhost:3000/api/matches?phase=group&status=scheduled"
```

### 2. Get all matches in a specific group
```bash
curl "http://localhost:3000/api/matches?group=A"
```

### 3. Get matches for a specific date
```bash
curl "http://localhost:3000/api/matches?startDate=2026-06-11T00:00:00Z&endDate=2026-06-11T23:59:59Z"
```

### 4. Get completed matches
```bash
curl "http://localhost:3000/api/matches?status=completed"
```

### 5. Get all Round of 16 matches
```bash
curl "http://localhost:3000/api/matches?phase=elimination"
```

### 6. Get matches approaching lockdown
```bash
# Use the service method directly in code
matchService.getMatchesNearLockdown(30) // 30 minutes before lockdown
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid parameters or filter combinations
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error responses include a descriptive message:

```json
{
  "statusCode": 400,
  "message": "Invalid phase. Must be one of: group, elimination",
  "error": "Bad Request"
}
```

---

## Performance Notes

- All queries are indexed for optimal performance
- Date range queries use efficient database indexes
- Results are sorted by scheduled time
- No pagination implemented (consider for large result sets)
- Consider caching frequently accessed schedules

---

## Related Tasks

- **Task 20**: Match result publication
- **Task 21**: Real-time score updates
- **Task 22**: Timezone conversion for display
- **Task 23-26**: Bracket configuration for elimination rounds

