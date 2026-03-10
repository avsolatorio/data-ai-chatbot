# Production Deployment

This document describes how to deploy Data360 Chat to production (e.g. Azure App Service or similar).

---

## Overview

Production deployment requires:

1. **Backend** — FastAPI app behind a production ASGI server (e.g. uvicorn with workers) or reverse proxy
2. **Frontend** — Next.js build served by Node or a static host
3. **PostgreSQL** — Managed database (e.g. Azure Database for PostgreSQL)
4. **Redis** (optional) — For caching and resumable streams
5. **Data360 MCP** — Deployed and reachable from the backend
6. **LLM provider** — Azure OpenAI or similar, with API keys configured

---

## Environment variables

### Backend (critical)

| Variable | Purpose |
|----------|---------|
| `ENVIRONMENT=production` | Enables production checks |
| `POSTGRES_*` | Database connection |
| `JWT_SECRET_KEY` | **Must not be default** — use `openssl rand -hex 32` |
| `SESSION_SECRET_KEY` | Dedicated key for session tokens |
| `CORS_ORIGINS` | Exact frontend origin(s), e.g. `https://chat.example.com` |
| `COOKIE_DOMAIN` | Parent domain if frontend/backend share it, e.g. `.example.com` |
| `NEXTJS_URL` | Frontend URL for redirects |

### Frontend

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL (browser-accessible) |
| `SERVER_API_URL` | Backend URL for server-side requests (may differ in Docker) |
| `NEXT_PUBLIC_APP_URL` | App URL for redirects and links |

---

## CORS and cookies

- **CORS_ORIGINS** must list the exact frontend origin(s). Wildcard `*` is not allowed when `allow_credentials=True`.
- **COOKIE_DOMAIN** — If frontend is at `https://chat.example.com` and backend at `https://api.example.com`, set `COOKIE_DOMAIN=.example.com` so cookies are sent to both.
- Use **Secure** and **SameSite** for cookies in production.

---

## Migrations

Run migrations as part of the deployment or release:

```bash
cd backend
uv run alembic upgrade head
```

Ensure the app user has grants on all tables (see `db/migration_utils.py` if used).

---

## Health checks

The backend exposes `/health` for liveness. Configure your load balancer or orchestrator to use it.

---

## Azure App Service

For Azure App Service:

1. **Backend** — Deploy as a web app (Python). Set startup command: `uvicorn app.main:app --host 0.0.0.0 --port 8001` (or the port Azure provides).
2. **Frontend** — Deploy as a Node web app. Build with `pnpm build`, start with `pnpm start`.
3. **Application settings** — Add all required env vars in the Azure portal.
4. **CORS** — Add the frontend URL to the backend's CORS allowed origins.

---

## See also

- [Deployment rendering](deployment-rendering.md) — Streamdown, Tailwind, PCN in deployment
- [Environment variables](../operations/environment-variables.md) — Full reference
- [Troubleshooting](../operations/troubleshooting.md) — Common issues
