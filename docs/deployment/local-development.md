# Local Development

This document describes how to run Data360 Chat locally for development.

---

## Prerequisites

- **Node.js** 18+ and **pnpm** 9.12.3+
- **Python** 3.11+ and **uv** (Python package manager)
- **PostgreSQL** 14+ (or access to a PostgreSQL database)
- **Redis** (optional, for caching and resumable streams)

---

## 1. Clone and setup

```bash
git clone <repository-url>
cd vercel-ai-chatbot
```

---

## 2. Database setup

Create a PostgreSQL database and run migrations:

```bash
createdb chatbot
cd backend
uv run alembic upgrade head
```

---

## 3. Environment variables

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

Required variables include:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `JWT_SECRET_KEY` (use a strong value in dev)
- LLM provider keys (e.g. `OPENAI_API_KEY` or Azure credentials)
- `MCP_SERVER_URL` (if using Data360 MCP)

### Frontend (`.env.local`)

```bash
cp .env.example .env.local
# Edit .env.local
```

Set `NEXT_PUBLIC_API_URL` to `http://localhost:8001` so the proxy targets the local backend.

---

## 4. Run the application

### Terminal 1 — Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8001
```

API docs: [http://localhost:8001/docs](http://localhost:8001/docs)

### Terminal 2 — Frontend

```bash
pnpm install
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000) (or the port in your config)

---

## 5. Optional: Redis

If you need resumable streams or user caching:

```bash
# Start Redis (e.g. via Docker or local install)
redis-server
```

Add to `backend/.env`:

```env
REDIS_URL=redis://localhost:6379
```

---

## Development scripts

### Frontend

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run linter |
| `pnpm format` | Format code |
| `pnpm test` | Run E2E tests |

### Backend

| Command | Purpose |
|---------|---------|
| `uv run uvicorn app.main:app --reload --port 8001` | Start dev server |
| `uv run alembic upgrade head` | Apply migrations |
| `uv run alembic revision --autogenerate -m "msg"` | Create migration |
| `uv run pytest tests/` | Run tests |

---

## See also

- [Docker](docker.md) — Run the full stack with Docker Compose
- [Environment variables](../operations/environment-variables.md) — Full reference
