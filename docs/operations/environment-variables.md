# Environment Variables

Full reference for backend and frontend environment variables.

---

## Backend (`backend/.env`)

Variables are loaded by Pydantic settings in `app/config.py`.

### Database

| Variable | Required | Notes |
|----------|----------|-------|
| `POSTGRES_HOST` | Yes | Database host |
| `POSTGRES_PORT` | Yes | Database port |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_ALEMBIC_USER` | No | For migrations |
| `POSTGRES_ALEMBIC_PASSWORD` | No | For migrations |

### JWT / Session

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET_KEY` | Yes | **Must not be default in production** |
| `JWT_ALGORITHM` | No | Default: HS256 |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token expiry |
| `JWT_SECRET_KEY_OLD` | No | For key rotation |
| `SESSION_SECRET_KEY` | No | For opaque session tokens |
| `SESSION_VERSION` | No | Deploy-time session invalidation |

### App

| Variable | Required | Notes |
|----------|----------|-------|
| `ENVIRONMENT` | No | development / production |
| `CORS_ORIGINS` | Yes | Comma-separated frontend origins |
| `NEXTJS_URL` | No | Frontend URL for redirects |
| `CSRF_REQUIRE_ORIGIN_ALWAYS` | No | Stricter CSRF |
| `COOKIE_DOMAIN` | No | For shared domain (e.g. .example.com) |

### Logging

| Variable | Required | Notes |
|----------|----------|-------|
| `LOG_FILE` | No | File path for app logger |
| `LOG_LEVEL` | No | DEBUG, INFO, WARNING, ERROR |
| `LOG_MAX_BYTES` | No | Rotating file handler |
| `LOG_BACKUP_COUNT` | No | Rotating file handler |

### Auth

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_PROVIDER` | No | guest / email / azure |
| `USER_CACHE_TTL_SECONDS` | No | User cache TTL |
| `GUEST_SESSION_MAX_AGE_DAYS` | No | Guest session expiry |
| `GUEST_SESSION_IDLE_DAYS` | No | Guest idle expiry |

### Azure AD (when using MSAL)

| Variable | Required | Notes |
|----------|----------|-------|
| `MSAL_AUTH_COOKIE_NAME` | No | Cookie name for MSAL token |
| `AZURE_AD_TENANT_ID` | Yes | Azure tenant |
| `AZURE_AD_CLIENT_ID` | Yes | Azure app client ID |
| `AZURE_AD_VALID_AUDIENCES` | No | Comma-separated audiences |
| `AZURE_AD_SKIP_SIGNATURE_VERIFY` | No | Dev only |

### Redis

| Variable | Required | Notes |
|----------|----------|-------|
| `REDIS_URL` | No | e.g. redis://localhost:6379 |

### Rate limit

| Variable | Required | Notes |
|----------|----------|-------|
| `RATE_LIMIT_ENABLED` | No | Enable rate limiting |
| `RATE_LIMIT_REQUESTS` | No | Requests per window |
| `RATE_LIMIT_WINDOW_SECONDS` | No | Window size |

### AI / LLM

| Variable | Required | Notes |
|----------|----------|-------|
| `MODEL_PROVIDER` | Yes | e.g. azure/ |
| `CHAT_MODEL` | Yes | Main chat model |
| `CHAT_MODEL_REASONING` | No | For RESEARCH mode |
| `TITLE_MODEL` | No | Chat title generation |
| `ROUTING_MODEL` | No | Intent routing |
| `ROUTING_HISTORY_LIMIT` | No | Messages for routing |

### MCP

| Variable | Required | Notes |
|----------|----------|-------|
| `MCP_SERVER_URL` | Yes | Data360 MCP URL |
| `MCP_SSL_VERIFY` | No | Verify TLS |
| `MCP_TIMEOUT` | No | Request timeout |
| `MCP_LOAD_TIMEOUT` | No | Tool list load timeout |
| `MCP_TOOLS_CACHE_TTL_SECONDS` | No | Tool cache TTL |

---

## Frontend (`.env.local` or `.env`)

### API

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (browser) |
| `NEXT_PUBLIC_APP_URL` | No | App URL for redirects |
| `SERVER_API_URL` | No | Backend URL (server-side, e.g. Docker) |
| `INTERNAL_API_SECRET` | No | Server-to-server auth |

### Auth (MSAL)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_AUTH_PROVIDER` | No | guest / email / azure |
| `NEXT_PUBLIC_MSAL_CLIENT_ID` | No | Azure app client ID |
| `NEXT_PUBLIC_MSAL_TENANT_ID` | No | Azure tenant |

### UX / Feature

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_APPLICATION_STATUS` | No | Status banner |
| `NEXT_PUBLIC_SHOW_REASONING_PART_TYPE` | No | Show thinking UI |
| `MAINTENANCE_MODE` | No | Show maintenance page |
