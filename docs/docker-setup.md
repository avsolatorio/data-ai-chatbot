# Docker Setup for Local Development

This document describes how to use Docker Compose to run the AI Chatbot application locally for development and testing purposes.

> This Docker configuration is intended **solely for local development and testing**. It is NOT designed for production deployment.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- At least 4GB of available RAM for Docker

## Quick Start

1. **Clone the repository and navigate to the project root:**

   ```bash
   cd data-ai-chatbot
   ```

2. **Set up environment files:**

   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys and database credentials

   # Frontend environment
   cp .env.example .env.local
   # Edit .env.local with your frontend configuration
   ```

3. **Ensure PostgreSQL variables are set in `backend/.env`:**

   ```env
   POSTGRES_USER=user
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=chatbot_db
   ```

4. **Create a root `.env` file for Docker Compose:**

   ```env
   # Docker Compose variables (for variable substitution)
   POSTGRES_USER=user
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=chatbot_db
   ```

5. **Start all services:**

   ```bash
   docker compose up -d --build
   ```

6. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - Backend API Docs: http://localhost:8001/docs

## Services Overview

| Service  | Port | Description                       |
| -------- | ---- | --------------------------------- |
| frontend | 3001 | Next.js development server        |
| backend  | 8001 | FastAPI backend with hot reload   |
| db       | 5432 | PostgreSQL 17.2 database          |
| redis    | 6379 | Redis cache (optional, see below) |

## Common Commands

```bash
# Start all services
docker compose up -d --build

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Restart a specific service
docker compose restart backend

# Remove all containers and volumes (fresh start)
docker compose down -v
```

## Files Changed for Docker Implementation

The following files were created or modified to enable full Docker support:

### New Files

| File                           | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `backend/Dockerfile`           | FastAPI container with uv package manager          |
| `backend/docker-entrypoint.sh` | Entrypoint script for automatic Alembic migrations |
| `backend/.dockerignore`        | Excludes dev artifacts from backend build          |
| `Dockerfile.frontend`          | Next.js container with pnpm                        |
| `.dockerignore`                | Excludes dev artifacts from frontend build         |
| `docs/docker-setup.md`         | This documentation                                 |

### Modified Files

| File                                 | Changes                                                    |
| ------------------------------------ | ---------------------------------------------------------- |
| `docker-compose.yml`                 | Added backend, frontend services; switched to named volume |
| `lib/server-api-client.ts`           | Added `SERVER_API_URL` for Docker internal networking      |
| `app/(auth)/api/auth/guest/route.ts` | Use `SERVER_API_URL` for internal requests                 |
| `app/api/auth/me/route.ts`           | Use `SERVER_API_URL` for internal requests                 |
| `app/api/auth/logout/route.ts`       | Use `SERVER_API_URL` for internal requests                 |
| `.env` (root)                        | Added for Docker Compose variable substitution             |

## Key Implementation Details

### Database Persistence (Named Volume)

Database data is persisted using a Docker **named volume** `postgres_data`:

```yaml
# docker-compose.yml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

Benefits:

- ✅ Data survives container restarts and rebuilds
- ✅ Managed by Docker for better isolation
- ✅ No risk of accidentally committing data to git

### Automatic Database Migrations

The `docker-entrypoint.sh` script runs Alembic migrations automatically:

```bash
# backend/docker-entrypoint.sh
# Waits for database, then runs migrations before starting the app
uv run alembic upgrade head
```

### Dual API URL Configuration

To support full Docker with streaming, we use separate URLs for server-side vs client-side:

```yaml
# docker-compose.yml - frontend environment
environment:
  # Browser-accessible URL (client-side JavaScript)
  - NEXT_PUBLIC_API_URL=http://localhost:8001
  # Server-side URL for internal Docker networking
  - SERVER_API_URL=http://backend:8001
```

This is necessary because:

- **Browser** (on host machine) can't resolve Docker service names
- **Server-side Next.js** (inside container) needs Docker networking

### Health Checks

Database health check ensures backend waits for PostgreSQL:

```yaml
# docker-compose.yml - db service
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
  interval: 5s
  timeout: 5s
  retries: 5
```

## Optional: Redis Cache (To Be Implemented)

> NOTE:
> Redis integration is available in the Docker Compose configuration but not yet integrated with the application.

## Troubleshooting

### "404 Not Found" on first access

- **Cause**: Stale browser cookies from a previous session
- **Fix**: Open in incognito window or clear cookies for localhost:3001

### Database errors after volume deletion

- **Cause**: Database needs to reinitialize
- **Fix**: Run `docker compose down -v` then `docker compose up -d --build`

### Environment variable warnings

- **Cause**: Missing root `.env` file
- **Fix**: Create `.env` in project root with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

### Chat not working / hanging

- **Cause**: Missing API keys or incorrect `MODEL_PREFIX`
- **Fix**: Ensure `backend/.env` has `OPENAI_API_KEY` and `MODEL_PREFIX=openai/`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   frontend   │───▶│   backend    │───▶│     db       │   │
│  │  (Next.js)   │    │  (FastAPI)   │    │ (PostgreSQL) │   │
│  │   :3001      │    │   :8001      │    │   :5432      │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                                │
│         │                   ▼                                │
│         │           ┌──────────────┐                        │
│         │           │    redis     │  (optional)            │
│         │           │   :6379      │                        │
│         │           └──────────────┘                        │
└─────────│───────────────────────────────────────────────────┘
          │
          ▼ Port 3001 exposed to host
    ┌─────────────┐
    │   Browser   │  http://localhost:3001
    │  (on host)  │  → API calls go to localhost:8001
    └─────────────┘
```

## Environment Variables Reference

### Root `.env` (for Docker Compose)

| Variable            | Description       | Required |
| ------------------- | ----------------- | -------- |
| `POSTGRES_USER`     | Database username | Yes      |
| `POSTGRES_PASSWORD` | Database password | Yes      |
| `POSTGRES_DB`       | Database name     | Yes      |

### Backend (`backend/.env`)

| Variable            | Description         | Required              |
| ------------------- | ------------------- | --------------------- |
| `POSTGRES_USER`     | Database username   | Yes                   |
| `POSTGRES_PASSWORD` | Database password   | Yes                   |
| `POSTGRES_DB`       | Database name       | Yes                   |
| `OPENAI_API_KEY`    | OpenAI API key      | Yes (for chat)        |
| `MODEL_PREFIX`      | LLM provider prefix | Yes (e.g., `openai/`) |

### Frontend (`.env.local`)

| Variable       | Description                | Required |
| -------------- | -------------------------- | -------- |
| `POSTGRES_URL` | Database connection string | Yes      |
