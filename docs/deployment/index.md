# Deployment

This section covers how to run Data360 Chat in different environments: local development, Docker, and production.

---

## Documents

| Document | Contents |
|----------|----------|
| [Local development](local-development.md) | Run frontend and backend locally with pnpm and uv |
| [Docker](docker.md) | Docker Compose for local development and testing |
| [Production](production.md) | Deploy to Azure App Service or similar; env vars, CORS, migrations |
| [Deployment rendering](deployment-rendering.md) | Streamdown, Tailwind, and PCN claim tags in deployment |

---

## Quick start (local)

```bash
# 1. Database
createdb chatbot
cd backend && uv run alembic upgrade head

# 2. Backend
cd backend && uv run uvicorn app.main:app --reload --port 8001

# 3. Frontend (in another terminal)
pnpm install && pnpm dev
```

Access: [http://localhost:3000](http://localhost:3000) (or 3001 depending on config)

---

## See also

- [Operations](../operations/index.md) — Environment variables, troubleshooting, runbooks
- [Architecture - Deployment and operations](../architecture/deployment-and-operations.md) — Env vars and operational notes
