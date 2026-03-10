# Components

This document lists the **services**, **ports**, and **dependencies** that make up the Data360 Chat system.

---

## Core services

| Service | Technology | Port | Purpose |
|---------|-------------|------|---------|
| **Frontend** | Next.js 16, React 19 | 3000 (dev) / 3001 (Docker) | Serves UI, proxies `/api/*` to backend |
| **Backend** | FastAPI | 8001 | REST API, auth, chat, AI orchestration, SSE streaming |
| **PostgreSQL** | PostgreSQL 17.2 | 5432 (default) / 5433 (Docker) | Persistent storage (users, chats, messages, etc.) |
| **Redis** | Redis 7 | 6379 | Optional: caching, resumable stream chunks |

---

## External dependencies

| Service | Role | Used by |
|---------|------|---------|
| **Data360 MCP server** | Exposes MCP tools (search, metadata, data, charts) | Backend |
| **LLM provider** (e.g. Azure OpenAI) | Chat and reasoning models | Backend |
| **Azure AD** (optional) | MSAL authentication | Backend |

---

## Docker Compose mapping

When using Docker Compose for local development:

| Service | Container | Host port | Internal port |
|---------|-----------|-----------|---------------|
| frontend | chatbot-frontend | 3001 | 3001 |
| backend | chatbot-backend | 8001 | 8001 |
| db | chatbot-db | 5433 | 5432 |
| redis | chatbot-redis | 6379 | 6379 |

Redis is optional; enable with `docker compose --profile redis up`.

---

## Dependencies between services

```
User (browser)
    │
    ▼
Frontend (Next.js)
    │ proxies /api/*
    ▼
Backend (FastAPI)
    ├──► PostgreSQL (persistence)
    ├──► Redis (optional: cache, resumable streams)
    ├──► Data360 MCP (tool execution)
    └──► LLM provider (generation)
```

The user never talks directly to the backend, MCP, or LLM from the browser. All traffic goes through the frontend proxy so that cookies and CORS work correctly.
