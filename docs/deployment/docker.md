# Docker Setup

This document describes how to use Docker Compose to run Data360 Chat locally for development and testing.

!!! warning "Development only"
    This Docker configuration is intended **solely for local development and testing**. It is NOT designed for production deployment.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- At least 4GB of available RAM for Docker

---

## Quick start

1. **Clone the repository and navigate to the project root:**

   ```bash
   cd vercel-ai-chatbot
   ```

2. **Set up environment files:**

   ```bash
   cp backend/.env.example backend/.env
   cp .env.example .env.local
   # Edit both files with your API keys and configuration
   ```

3. **Create a root `.env` file for Docker Compose:**

   ```env
   POSTGRES_USER=user
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=chatbot_db
   ```

4. **Start all services:**

   ```bash
   docker compose up -d --build
   ```

5. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

---

## Services overview

| Service  | Port | Description                       |
| -------- | ---- | --------------------------------- |
| frontend | 3001 | Next.js development server        |
| backend  | 8001 | FastAPI backend with hot reload   |
| db       | 5433 | PostgreSQL 17.2 database          |
| redis    | 6379 | Redis cache (optional, see below) |

---

## Optional: Redis

Enable Redis with the `redis` profile:

```bash
docker compose --profile redis up -d --build
```

---

## Common commands

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

---

## Key implementation details

### Dual API URL configuration

The frontend uses two URLs:

- **`NEXT_PUBLIC_API_URL`** — Browser-accessible (e.g. `http://localhost:8001`)
- **`SERVER_API_URL`** — Server-side, for Docker internal networking (e.g. `http://backend:8001`)

The browser cannot resolve Docker service names; the Next.js server (inside the container) uses `SERVER_API_URL` for server-side requests.

### Automatic migrations

The backend `docker-entrypoint.sh` runs `alembic upgrade head` before starting the app.

### Database persistence

Data is stored in a named volume `postgres_data` so it survives container restarts.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "404 Not Found" on first access | Clear cookies or use incognito for localhost:3001 |
| Database errors after volume deletion | Run `docker compose down -v` then `docker compose up -d --build` |
| Missing root `.env` | Create `.env` in project root with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| Chat not working / hanging | Ensure `backend/.env` has API keys and correct `MODEL_PREFIX` |
