# Deployment and Operations

This document summarizes **environment variables**, **running the application** (local and production), **Docker**, and **operational considerations** (CORS, cookies, logging).

---

## Environment variables

### Backend (`backend/.env`)

Variables are loaded by **Pydantic settings** in **`app/config.py`** (and optional `.env` in the backend directory). The following is a reference; see **`backend/.env.example`** for the canonical list and defaults.

| Category | Variables | Notes |
|----------|-----------|--------|
| **Database** | `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Required. `POSTGRES_URL` is computed. |
| | `POSTGRES_ALEMBIC_USER`, `POSTGRES_ALEMBIC_PASSWORD` | For migrations. Optional `POSTGRES_URL_SYNC`. |
| **JWT / session** | `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Optional: `JWT_SECRET_KEY_OLD` (rotation), `SESSION_SECRET_KEY`, `SESSION_VERSION`. |
| **App** | `ENVIRONMENT`, `CORS_ORIGINS`, `NEXTJS_URL`, `CSRF_REQUIRE_ORIGIN_ALWAYS`, `COOKIE_DOMAIN` | CORS must list frontend origin(s); no `*` with credentials. |
| **Logging** | `LOG_FILE`, `LOG_LEVEL`, `LOG_MAX_BYTES`, `LOG_BACKUP_COUNT` | Optional file logging for `app` logger. |
| **Auth** | `AUTH_PROVIDER`, `USER_CACHE_TTL_SECONDS`, `GUEST_SESSION_MAX_AGE_DAYS`, `GUEST_SESSION_IDLE_DAYS` | |
| **Azure AD** | `MSAL_AUTH_COOKIE_NAME`, `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_VALID_AUDIENCES`, `AZURE_AD_SKIP_SIGNATURE_VERIFY` | Only when using MSAL. |
| **Redis** | `REDIS_URL` | Optional; needed for resumable streams and optional caching. |
| **Rate limit** | `RATE_LIMIT_ENABLED`, `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` | |
| **File upload** | `MAX_UPLOAD_FILE_SIZE_BYTES`, `ALLOWED_UPLOAD_IMAGE_TYPES` | |
| **Feedback** | `FEEDBACK_REVIEWER_EMAILS` | Comma-separated emails that can list feedback. |
| **AI** | `MODEL_PROVIDER`, `CHAT_MODEL`, `CHAT_MODEL_REASONING`, `TITLE_MODEL`, `ARTIFACT_MODEL` | Nested in `ModelSettings`. |
| **Routing** | `ROUTING_MODEL`, `ROUTING_HISTORY_LIMIT` | |
| **MCP** | `MCP_SERVER_URL`, `MCP_SSL_VERIFY`, `MCP_TIMEOUT`, `MCP_LOAD_TIMEOUT`, `MCP_TOOLS_CACHE_TTL_SECONDS` | Prefix `MCP_` in env. |

### Frontend (`frontend/.env.local` or `.env`)

| Category | Variables | Notes |
|----------|-----------|--------|
| **API** | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL` | Backend URL for proxy; app URL for redirects/links. |
| | `SERVER_API_URL` | Used by Next.js server (SSR) when calling backend; can differ from public URL. |
| | `INTERNAL_API_SECRET` | Optional server-to-server auth. |
| **Auth** | `NEXT_PUBLIC_AUTH_PROVIDER`, `NEXT_PUBLIC_MSAL_*` (client ID, tenant, etc.) | For MSAL and auth UI. Optional `AUTH_PROXY_TIMEOUT_MS`. |
| **UX / feature** | `NEXT_PUBLIC_APPLICATION_STATUS`, `NEXT_PUBLIC_SHOW_REASONING_PART_TYPE`, `MAINTENANCE_MODE` | Vega theme URL, file upload limits as needed. |

---

## Running the application

### Local development

1. **Database** — Start PostgreSQL (e.g. local or Docker). Run Alembic migrations from `backend/`: e.g. `alembic upgrade head`.
2. **Backend** — From `backend/`: `uv run uvicorn app.main:app --reload --port 8001`. API docs at `http://localhost:8001/docs`.
3. **Frontend** — From repo root or `frontend/`: `pnpm install`, then `pnpm dev`. App at `http://localhost:3000` (or the port in package.json). Set `NEXT_PUBLIC_API_URL` to `http://localhost:8001` if the proxy should target the local backend.
4. **Redis** (optional) — Start Redis and set `REDIS_URL` if you need resumable streams or user cache.

### Production

- **Backend** — Run with a production ASGI server (e.g. `uvicorn app.main:app --host 0.0.0.0 --port 8001` with workers or behind a reverse proxy). Ensure `CORS_ORIGINS` and `COOKIE_DOMAIN` match the frontend origin and domain so that cookies are sent and accepted.
- **Frontend** — `pnpm build && pnpm start` (or deploy to Vercel/Node host). Set `NEXT_PUBLIC_API_URL` (and `SERVER_API_URL` if different) to the backend URL. The frontend must be served over the same origin (or an allowed origin) that the user uses so that the proxy and cookies work.
- **Migrations** — Run `alembic upgrade head` as part of the deployment or release process. Ensure the app user has grants on all tables (see migration_utils if used).

---

## Docker

- [Docker setup](../deployment/docker.md) describes Docker Compose for local development (e.g. frontend on 3001, backend on 8001, PostgreSQL, optional Redis). Use it for a consistent local stack.
- The repo includes **Dockerfile** for the backend and **Dockerfile.frontend** for the frontend; production images should set env vars at runtime and run migrations in an entrypoint or separate job.

---

## Operational considerations

- **CORS** — Backend must list the frontend origin(s) in `CORS_ORIGINS`. Wildcard `*` is not allowed when `allow_credentials=True`. Use the exact scheme and host (e.g. `https://chat.example.com`).
- **Cookies** — Auth cookies are httpOnly and should use `SameSite` and `Secure` in production. Set `COOKIE_DOMAIN` if the frontend and backend share a parent domain (e.g. `.example.com`) so that cookies are sent to the correct host.
- **Logging** — Application logs can go to a file (`LOG_FILE`) in addition to stdout; only the `app` logger is attached to the file so that platform and uvicorn logs stay on stdout. Use `LOG_LEVEL` to control verbosity.
- **Health** — The backend exposes `/health` for liveness. Use it for load balancers and orchestrators. No database or Redis check is required in the minimal health response unless you add them explicitly.
- **Secrets** — Never commit `.env` or secrets. Use secret managers or platform env for production (`JWT_SECRET_KEY`, `SESSION_SECRET_KEY`, DB password, Azure keys, MCP URL if sensitive).

---

## Summary

- **Backend** and **frontend** each have their own env files; backend uses Pydantic settings, frontend uses `NEXT_PUBLIC_*` for client-exposed values.
- **Local:** DB + migrations, then backend (uvicorn), then frontend (pnpm dev); optional Redis.
- **Production:** Deploy backend and frontend with correct CORS and cookie domain; run migrations; keep secrets out of code.

The next document, [Architectural decisions](architectural-decisions.md), summarizes key design decisions and trade-offs.
