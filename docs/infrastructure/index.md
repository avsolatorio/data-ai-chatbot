# Infrastructure

This section describes the **infrastructure components**, **network topology**, and **data flow** of Data360 Chat. Use these documents to understand how services connect, what ports they use, and how requests and responses flow through the system.

---

## Documents

| Document | Contents |
|----------|----------|
| [Components](components.md) | Services, ports, and dependencies (frontend, backend, PostgreSQL, Redis, Data360 MCP, LLM) |
| [Network topology](network-topology.md) | Diagram of the full stack and how components communicate |
| [Data flow](data-flow.md) | Request path (chat POST), response path (SSE), and auth flow |

---

## Quick reference

| Component | Port | Purpose |
|-----------|------|---------|
| Frontend (Next.js) | 3000 / 3001 | UI, API proxy |
| Backend (FastAPI) | 8001 | REST API, SSE streaming |
| PostgreSQL | 5432 / 5433 | Persistent storage |
| Redis | 6379 | Cache, resumable streams (optional) |
| Data360 MCP | Configurable | Tool execution for data/charts |
