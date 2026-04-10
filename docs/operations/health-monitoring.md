# Health Monitoring

This document describes the health endpoint and what to monitor.

---

## Backend health endpoint

The backend exposes **`GET /health`** for liveness checks.

**Response:** JSON with basic status (e.g. `{"status": "ok"}`).

**Use for:**

- Load balancer health checks
- Kubernetes liveness/readiness probes
- Container orchestration

---

## What to monitor

| Component | Check | Notes |
|-----------|-------|-------|
| Backend | `GET /health` | Returns 200 when app is running |
| PostgreSQL | Connection from backend | Backend will fail if DB is down |
| Redis | Optional | If used, backend may degrade without it |
| Data360 MCP | Backend can reach MCP URL | Chat may fail for data tools if MCP is down |
| LLM provider | Backend can reach provider | Chat will fail if provider is unreachable |

---

## Minimal health response

The default `/health` endpoint does **not** check database or Redis connectivity. It only confirms the FastAPI app is running. For stricter readiness, you can add custom checks (e.g. DB ping, Redis ping) to the health route.

---

## Logging

Application errors and key events are logged. Use `LOG_LEVEL` to control verbosity. See [Logging](logging.md) for details.
