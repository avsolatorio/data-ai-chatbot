# Data and Persistence

This document describes how **persistent state** is stored and accessed: PostgreSQL (engine, models, query layer), optional Redis (caching and resumable streams), and Alembic migrations.

---

## PostgreSQL

The backend uses **PostgreSQL** as the only durable store for application data. All access is **async** via **SQLAlchemy** with the **asyncpg** driver.

### Engine and session

- **`backend/app/core/database.py`**:
  - Builds the async engine from `settings.POSTGRES_URL` with `pool_pre_ping=True` and `pool_recycle=300` so that connections are checked and recycled and do not outlive server-side idle timeouts.
  - Defines **`AsyncSessionLocal`** (`async_sessionmaker`) with `expire_on_commit=False` so that committed objects remain usable in the same request.
  - Exposes **`get_db()`**: an async generator that yields an `AsyncSession` and closes it in a `finally` block. Used as a FastAPI dependency so that each request gets a session and rollback is performed on exception.

### Models (SQLAlchemy)

Models live in **`backend/app/models/`**. They use the declarative **`Base`** from `core.database` and UUID primary keys (PostgreSQL UUID type). Naming uses camelCase for application-facing fields (e.g. `userId`, `createdAt`).

| Model | Table | Purpose |
|-------|--------|--------|
| **User** | `User` | User account: email, password (nullable for guest/MSAL), type (guest/regular), name, azure_oid, password_changed_at. |
| **Chat** | `Chat` | Conversation: id, createdAt, title, userId, visibility, lastContext (JSONB for usage etc.). |
| **Message** | (message table) | Single message in a chat: role, content/parts, association to chat. |
| **Vote** | (vote table) | Message vote (e.g. thumbs up/down). |
| **Document** | (document table) | User-created document. |
| **File** | (file table) | Uploaded file metadata. |
| **Chart** | (chart table) | Chart record (e.g. reference to MCP/chart spec). |
| **Stream** | (stream table) | Stream metadata for resumable streams. |
| **Suggestion** | (suggestion table) | Chat suggestions. |
| **AuthSession** | (auth session table) | Opaque session token (guest or user) with expiry. |
| **RevokedToken** | (revoked token table) | JWT JTI blacklist (logout, password change). |
| **LoginAttempt** | (login attempt table) | Login attempt tracking. |
| **PasswordResetToken** | (password reset table) | Password reset token. |
| **PasswordResetAttempt** | (password reset attempt table) | Reset attempt tracking. |
| **AppFeedback** | (app feedback table) | User feedback. |

Relationships (e.g. `User.chats`, `Chat.messages`) are defined so that the ORM can load related entities when needed. The **query layer** (see below) is the preferred way to read/write; handlers and AI code should not bypass it for consistency and testability.

---

## Query layer

All database reads and writes go through **`backend/app/db/queries/`**. Each module encapsulates operations for one or more models and exposes async functions that take `db: AsyncSession` (injected via `get_db()`).

| Module | Domain |
|--------|--------|
| **`chat_queries.py`** | Create/get/update/delete chats; list messages; visibility. |
| **`user_queries.py`** | Get user by id, email, azure_oid; create user; update (e.g. password_changed_at). |
| **`session_queries.py`** | Create/validate/delete auth sessions (opaque tokens). |
| **`document_queries.py`** | Document CRUD. |
| **`vote_queries.py`** | Get/patch votes for messages. |
| **`chart_queries.py`** | Chart create/get. |
| **`suggestion_queries.py`** | Suggestions. |
| **`revoked_token_queries.py`** | Add JTI to revoked list; check if JTI is revoked. |
| **`password_reset_queries.py`** | Password reset token create/consume. |
| **`password_reset_attempt_queries.py`** | Reset attempt tracking. |
| **`login_attempt_queries.py`** | Login attempt tracking. |

Feedback and file operations may be in one of these modules or in the API layer; the principle is that **persistence is centralized in the query layer** so that business logic does not scatter raw SQL.

---

## Redis (optional)

When **`REDIS_URL`** is set, the backend uses **Redis** for:

1. **Caching** — For example, resolved user (by id or token) can be cached for `USER_CACHE_TTL_SECONDS` to reduce DB round-trips on every request.
2. **Resumable streams** — When a user disconnects during a long LLM response, the backend can continue writing stream chunks to Redis keyed by stream id and sequence. When the client reconnects (e.g. with the same stream id), it can request the remaining chunks and the backend reads from Redis and streams them. This avoids re-running the full generation.

The Redis client is initialized on first use and **closed in the FastAPI lifespan** (in `main.py`) so that connections are released on shutdown. If `REDIS_URL` is empty, Redis-dependent features (e.g. resumable stream storage) are disabled.

---

## Migrations (Alembic)

- **Location:** **`backend/alembic/`** (standard Alembic layout: `env.py`, `script.py.mako`, `versions/`).
- **Usage:** Migrations are run against the database using the sync or async URL (configurable; often `ALEMBIC_POSTGRES_URL` or a sync equivalent). The application user (used at runtime) may need explicit **GRANT**s on tables and sequences; some migrations use **`db/migration_utils.py`** to grant privileges to the app user so that runtime connections can read/write.

New schema changes should be done via new migration scripts rather than changing models in place without a migration, so that existing deployments can upgrade cleanly.

---

## Summary

- **PostgreSQL** is the single source of truth for users, chats, messages, votes, documents, files, charts, sessions, revoked tokens, feedback, and related entities. Access is async through the **query layer** in `app/db/queries/`.
- **Redis** is optional and used for caching and resumable stream chunks; the client is closed on app shutdown.
- **Alembic** manages schema versions; migrations may include grant steps for the app user.

The next document, [Authentication](authentication.md), describes how users are identified and how auth interacts with the User and AuthSession models.
