# Backend

This document describes the **FastAPI backend** in detail: entry point, middleware, configuration, API structure, and core modules. The backend is the authority for identity, chat state, and AI orchestration.

---

## Entry point and application creation

The FastAPI application is created in **`backend/app/main.py`**. It:

- Configures logging (stdout for all; optional file handler for the `app` logger only, so platform/uvicorn logs stay on stdout).
- Defines a **lifespan** context manager: on shutdown it closes the Redis client so that connections are released cleanly.
- Creates the `FastAPI` instance with title, version, docs at `/docs`, redoc at `/redoc`, and the lifespan.
- Registers a **global exception handler** that logs errors with a unique `errorId` and returns a safe message to the client (no stack traces or internal details in responses).
- Adds middleware in order (first added = outermost): CORS, rate limit (if enabled), CSRF, cache-prevention. A small HTTP middleware adds `X-Session-Version` to `/api/auth/me` responses for MSAL deploy-time invalidation.
- Includes all v1 routers under their prefixes (see [API routers](#api-routers)).
- Exposes `/health` and `/` for liveness and basic info; optionally a `/test-log` endpoint for verifying logging.

The application does **not** start the database or Redis in the lifespan; those are used on first request via dependencies (`get_db`, Redis client). The lifespan is used only for cleanup on shutdown.

---

## Middleware (order: first added = outermost)

1. **CORS** — `CORSMiddleware` with `allow_origins` from settings, `allow_credentials=True`, and explicit methods/headers. Wildcard origins are not allowed when credentials are true (per spec and security).
2. **Rate limit** — When `RATE_LIMIT_ENABLED` is true, `RateLimitMiddleware` limits requests per client (by user id if authenticated, else by IP) per window; returns 429 when exceeded.
3. **CSRF** — Validates `Origin` / `Referer` for state-changing requests (POST, PUT, PATCH, DELETE) when configured (`CSRF_REQUIRE_ORIGIN_ALWAYS` and origin check).
4. **Cache prevention** — Sets `Cache-Control: no-store` (and related headers) on all responses so that browsers and proxies do not cache sensitive or dynamic content.

---

## Configuration

Configuration is centralized in **`backend/app/config.py`** using **Pydantic settings** loaded from the environment (and optional `.env` file). Key groups:

- **Database** — `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`; optional `POSTGRES_ALEMBIC_*` and `POSTGRES_URL_SYNC`. `POSTGRES_URL` and `ALEMBIC_POSTGRES_URL` are computed (async URLs); credentials are URL-encoded in the computed URLs. <!-- pragma: allowlist secret -->
- **JWT** — `JWT_SECRET_KEY`, optional `JWT_SECRET_KEY_OLD` (for rotation), `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`. Optional `SESSION_SECRET_KEY` for opaque session tokens; `SESSION_VERSION` for deploy-time session invalidation.
- **App** — `ENVIRONMENT`, `CORS_ORIGINS`, `NEXTJS_URL`, `CSRF_REQUIRE_ORIGIN_ALWAYS`, `COOKIE_DOMAIN`, logging (`LOG_FILE`, `LOG_LEVEL`, `LOG_MAX_BYTES`, `LOG_BACKUP_COUNT`), file upload limits, `USER_CACHE_TTL_SECONDS`, guest session TTL, `FEEDBACK_REVIEWER_EMAILS`.
- **Auth** — `AUTH_PROVIDER`, `MSAL_AUTH_COOKIE_NAME`, `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_VALID_AUDIENCES`, `AZURE_AD_SKIP_SIGNATURE_VERIFY`.
- **Redis** — `REDIS_URL` (optional).
- **Rate limit** — `RATE_LIMIT_ENABLED`, `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`.
- **AI** — Nested `ModelSettings`: `MODEL_PROVIDER`, `CHAT_MODEL`, `CHAT_MODEL_REASONING`, `TITLE_MODEL`, `ARTIFACT_MODEL`. Routing: `ROUTING_MODEL`, `ROUTING_HISTORY_LIMIT`.
- **MCP** — `MCPSettings` (env prefix `MCP_`): `server_url`, `ssl_verify`, `timeout`, `load_timeout`, `tools_cache_ttl_seconds`.

See [Deployment and operations](deployment-and-operations.md) for a full list of environment variables.

---

## API routers

All API routes are mounted under `/api` with the following prefixes. Routers live in **`backend/app/api/v1/`** (and are imported in `main.py`).

| Prefix | Router module | Purpose |
|--------|----------------|--------|
| `/api/auth` | `auth.py` | Login, register, logout, refresh, guest, guest/reset, me, password-reset/request, password-reset/confirm; MSAL set-token is handled by frontend + backend cookie endpoint. |
| `/api/chat` | `chat.py` | POST (create/continue conversation and stream), GET `/{id}`, GET `/{id}/messages/latest`, DELETE (chat or messages), PATCH (visibility), GET suggestions. |
| `/api/v1/chat` | `chat_stream.py` | POST `/stream` (stream-only endpoint). |
| `/api/chat` | `chat_resume.py` | Resumable stream (e.g. resume by stream id). |
| `/api/history` | `history.py` | Chat history listing. |
| `/api/vote` | `vote.py` | Get and patch message votes. |
| `/api/feedback` | `feedback.py` | Submit and (for reviewers) list app feedback. |
| `/api/document` | `document.py` | Document CRUD. |
| `/api/files` | `files.py` | File upload and get by id. |
| `/api/v1/charts` | `charts.py` | Create and get chart records. |
| `/api/v1/mcp` | `mcp_tools.py` | MCP tool list and proxy. |
| `/api/models` | `models.py` | List available models. |

Note: `thinking_stream.py` defines a router but is not included in `main.py` by default; if mounted, chat-ownership validation should be added.

---

## Core modules and dependencies

### `app/core/`

- **`database.py`** — Creates the async SQLAlchemy engine and `async_sessionmaker` from `settings.POSTGRES_URL`. Exposes `get_db()` dependency that yields an `AsyncSession` and ensures rollback on exception.
- **`redis.py`** — Redis client (optional). Used for caching and for storing stream chunks when resumable streams are enabled. Closed in app lifespan.
- **`auth/`** — JWT encode/decode (`jwt.py`), session token generation/validation (`session_token.py`), password hashing and verification (`password.py`), Azure AD token validation (`azure.py`). Used by auth routes and by `get_current_user`.
- **`csrf.py`** — CSRF middleware implementation (Origin/Referer check).
- **`rate_limit.py`** — Rate limit middleware (per user or per IP).
- **`cache_headers.py`** — Cache-prevention middleware.
- **`cookie_utils.py`** — Helpers for setting/clearing auth cookies (domain, httpOnly, etc.).
- **`password_validation.py`** — Password strength rules; optional HIBP check.
- **`errors.py`** — Shared exception types.
- **`logging_utils.py`** — Logging helpers.

### `app/api/deps.py`

- **`get_current_user`** — Resolves the authenticated user for the request. Tries in order: JWT from `auth_token` cookie or `Authorization` header; if that fails and Azure AD is configured, validates MSAL cookie; fallback to session tokens (`guest_session_id` / `user_session_id`) validated against the database. Checks revoked tokens and password-change invalidation. Can cache the resolved user for `USER_CACHE_TTL_SECONDS`. Used by almost all protected routes.
- **`get_current_user_optional`** — Same as above but returns `None` when no valid auth; used for routes that behave differently when logged in vs anonymous.
- **Feedback reviewer** — Dependency that allows access to feedback list only for users whose email is in `FEEDBACK_REVIEWER_EMAILS`.

### `app/models/`

SQLAlchemy declarative models for all persistent entities. See [Data and persistence](data-persistence.md) for the list and relationships.

### `app/db/queries/`

Async query layer: one module per domain (e.g. `chat_queries.py`, `user_queries.py`, `message` via chat_queries, `session_queries.py`, `document_queries.py`, `vote_queries.py`, `chart_queries.py`, `suggestion_queries.py`, `revoked_token_queries.py`, `password_reset_queries.py`, `password_reset_attempt_queries.py`, `login_attempt_queries.py`). Handlers and AI code call these functions with a `db: AsyncSession` instead of writing raw SQL. See [Data and persistence](data-persistence.md).

### `app/schemas/` and `app/api/v1/schemas/`

Pydantic models for request and response bodies. Re-exported or used from v1 routers.

---

## Request lifecycle (typical protected route)

1. Request hits FastAPI (after CORS, rate limit, CSRF, cache-prevention).
2. Route dependency `get_current_user` runs: reads cookie/header, validates JWT or MSAL or session, loads user from DB if needed, caches for TTL, attaches user to request state.
3. Route handler runs: may use `get_db()` for DB access, calls query layer and/or AI code, returns response or streams.
4. If an unhandled exception is raised, the global exception handler logs it and returns a safe JSON response with `errorId`.

The next document, [Frontend](frontend.md), describes the Next.js application structure and how it interacts with this API.
