# Admin API Reference

The admin API backs the `/admin` dashboard (Analytics, Moderation, Health). All endpoints live under `/api/admin/*` and are documented here with their actual response field names.

Feature contract: [`REQUIREMENTS-admin-dashboard.md`](../REQUIREMENTS-admin-dashboard.md).

## Authentication

Every `/api/admin/*` endpoint requires:

- An authenticated user (`get_current_user` — cookie `auth_token`/`guest_session_id` or `Authorization: Bearer <token>`).
- An email present in the `ADMIN_EMAILS` allowlist (`require_admin` dependency).

Failure returns `403` with `{"detail": "..."}`. Cases:

| Condition | Detail |
| --------- | ------ |
| `ADMIN_EMAILS` empty | `Admin access is not configured` |
| User not found / no email | `You do not have admin access` |
| Email not in allowlist | `You do not have admin access` |
| Disabled user | `403` raised by the disabled-user auth block |

`ADMIN_EMAILS` is matched case-insensitively. Disabled users are blocked from login, guest, and token-refresh paths before they can reach admin endpoints. `/api/admin/*` paths are exempt from the global rate limit (guarded by `require_admin` instead).

The frontend gates the `/admin/*` route group on the `canViewAdmin` flag returned by `GET /api/auth/me`.

## Analytics

Base path: `/api/admin/analytics`

### Common query parameters

All four analytics endpoints accept the same optional date-range parameters:

| Param  | Type     | Default  | Description                                                        |
| ------ | -------- | -------- | ------------------------------------------------------------------ |
| `from` | `date`   | today − 30 days | Inclusive start date (`YYYY-MM-DD`)                        |
| `to`   | `date`   | today    | Inclusive end date (`YYYY-MM-DD`)                                  |

Validation rules (`analytics.py:_resolve_date_range`):

- `from > to` → `400` `{"detail": "from must be <= to"}`.
- `to` later than today is clamped to today.
- Range longer than 365 days is clamped to the trailing 365 days.
- The `7d`/`30d` windows inside responses are always relative to "now", independent of `from`/`to`.

### GET /api/admin/analytics/users

Aggregate user statistics.

```json
{
  "totalUsers": 128,
  "registeredUsers": 97,
  "guestUsers": 31,
  "newUsers7d": 5,
  "newUsers30d": 22,
  "activeUsers7d": 11,
  "activeUsers30d": 34
}
```

> `User` has no `created_at` column; "new"/"active" users are derived from first-chat timestamps (`Chat.createdAt`) in the window.

### GET /api/admin/analytics/chats

Aggregate chat and message statistics.

```json
{
  "totalChats": 402,
  "totalMessages": 3810,
  "chats7d": 33,
  "chats30d": 141,
  "avgMessagesPerChat": 9.48,
  "topModels": [
    { "model": "azure/gpt-4o-mini", "count": 261 },
    { "model": "azure/gpt-4o", "count": 141 }
  ]
}
```

> Soft-deleted messages are excluded from totals. `topModels` is derived from `Chat.lastContext` usage payloads (`usage.modelId`); chats without usage data are omitted.

### GET /api/admin/analytics/feedback

Aggregate feedback and vote statistics.

```json
{
  "avgRating": 4.2,
  "ratingDistribution": { "1": 3, "2": 5, "3": 12, "4": 38, "5": 87 },
  "totalFeedback": 145,
  "feedback7d": 9,
  "upvoteRatio": 0.73,
  "feedbackTrend": [
    { "date": "2026-07-20", "avgRating": 4.0, "count": 4 },
    { "date": "2026-07-21", "avgRating": 4.5, "count": 6 }
  ]
}
```

`ratingDistribution` always contains keys `"1"` through `"5"` (zero-filled). `feedbackTrend` covers the trailing 30 days. `upvoteRatio` is `upvotes / total votes`, `0.0` when no votes exist.

### GET /api/admin/analytics/tokens

Aggregate token usage from `Chat.lastContext` across the requested range (both legacy and current usage payload shapes are read).

```json
{
  "totalTokens": 1234567,
  "promptTokens": 812345,
  "completionTokens": 422222,
  "tokensByModel": { "azure/gpt-4o-mini": 987654, "azure/gpt-4o": 246913 },
  "tokensLast7d": 123456,
  "tokensLast30d": 654321,
  "costEstimate7d": 1.234567,
  "costEstimate30d": 6.54321
}
```

Cost figures are estimated from the `costUSD` field in each usage payload (`0.0` when absent), rounded to 6 decimals. Only chats with a non-null `lastContext` inside `from`/`to` are counted.

## Moderation

Base path: `/api/admin/moderation`

### GET /api/admin/moderation/users

Paginated user list, optionally filtered by email substring.

| Param      | Type   | Default | Constraints       | Description                  |
| ---------- | ------ | ------- | ----------------- | ---------------------------- |
| `q`        | string | `""`    | —                 | Search by email substring    |
| `page`     | int    | `1`     | `>= 1`            | 1-based page number          |
| `pageSize` | int    | `20`    | `1..100`          | Page size                    |

Null bytes (`\x00`) are stripped from `q`; if stripping leaves an empty string, the response is an empty list (`{"users": [], "total": 0}`).

```json
{
  "users": [
    {
      "id": "6f3b...",
      "email": "user@org.com",
      "type": "regular",
      "name": "Some User",
      "chatCount": 12,
      "createdAt": "2026-01-15T10:00:00Z",
      "disabled": false
    }
  ],
  "total": 128
}
```

`chatCount` counts non-deleted chats; `createdAt` is the user's first non-deleted chat timestamp. Ordered by user id descending.

### POST /api/admin/moderation/users/{user_id}/disable

Toggle a user's disabled state. Disabled users cannot authenticate (login, guest, refresh all return 403). The cached auth entry is invalidated so the change applies immediately.

| Error      | Detail           |
| ---------- | ---------------- |
| `404`      | `User not found` |

```json
{ "ok": true, "disabled": true }
```

### GET /api/admin/moderation/chats

Paginated list of non-deleted chats with owner email and message counts.

| Param      | Type   | Default | Constraints       | Description                     |
| ---------- | ------ | ------- | ----------------- | ------------------------------- |
| `q`        | string | `""`    | —                 | Search by title substring       |
| `userId`   | uuid   | —       | —                 | Filter by owner user id         |
| `page`     | int    | `1`     | `>= 1`            | 1-based page number             |
| `pageSize` | int    | `20`    | `1..100`          | Page size                       |

Same null-byte stripping behavior as `GET /users`. Ordered by `createdAt` descending.

```json
{
  "chats": [
    {
      "id": "9a1c...",
      "title": "GDP by country",
      "userId": "6f3b...",
      "userEmail": "user@org.com",
      "messageCount": 34,
      "createdAt": "2026-07-28T14:22:00Z",
      "updatedAt": "2026-07-28T14:45:00Z"
    }
  ],
  "total": 402
}
```

`messageCount` counts non-deleted messages only.

### DELETE /api/admin/moderation/chats/{chat_id}

Soft-delete a chat and its messages (sets `deletedAt`); votes and streams are hard-deleted.

| Error      | Detail           |
| ---------- | ---------------- |
| `404`      | `Chat not found` |

```json
{ "ok": true }
```

## Health

Base path: `/api/admin/health`

### GET /api/admin/health

Liveness and connectivity summary.

```json
{
  "status": "ok",
  "db": "connected",
  "mcp": "connected",
  "uptimeSeconds": 86400
}
```

| Field           | Type   | Values                     | Description                        |
| --------------- | ------ | -------------------------- | ---------------------------------- |
| `status`        | string | `ok` \| `degraded`         | `ok` only when db and mcp both pass |
| `db`            | string | `connected` \| `error`     | `SELECT 1` probe result            |
| `mcp`           | string | `connected` \| `error`     | MCP client `list_tools` ping       |
| `uptimeSeconds` | int    | —                          | Seconds since process start        |

### GET /api/admin/health/metrics

Operational metrics (24-hour window).

```json
{
  "errorRate24h": 0.0,
  "avgResponseTimeMs": 0,
  "rateLimitHits24h": 0,
  "activeSessions": 42,
  "dbPoolSize": { "size": 10, "checkedOut": 3 },
  "totalTokens24h": 123456,
  "tokenRate24h": 85.7,
  "costEstimate24h": 0.654321
}
```

| Field              | Type   | Description                                                        |
| ------------------ | ------ | ------------------------------------------------------------------ |
| `errorRate24h`     | number | Error rate (currently always `0.0` — placeholder)                  |
| `avgResponseTimeMs`| int    | Average response time (currently always `0` — placeholder)         |
| `rateLimitHits24h` | int    | Rate-limit hits (currently always `0` — placeholder)               |
| `activeSessions`   | int    | Non-expired auth sessions                                          |
| `dbPoolSize`       | object | `{ "size", "checkedOut" }` — async engine pool state               |
| `totalTokens24h`   | int    | Sum of `ChatTokenUsage.total_tokens` in last 24h                   |
| `tokenRate24h`     | number | Tokens per minute averaged over 24h (`totalTokens24h / 1440`)      |
| `costEstimate24h`  | number | Sum of `ChatTokenUsage.cost_usd` in last 24h (6 decimals)          |

`totalTokens24h`, `tokenRate24h`, and `costEstimate24h` are read from the `ChatTokenUsage` table, which is populated per message by the chat background tasks.
