# Architecture Documentation

This section contains the **detailed architecture documentation** for Data360 Chat. The documents are intended for developers, architects, and operations staff who need to understand how the system is built, how data and control flow through it, and how to deploy and operate it.

---

## How to Use This Documentation

- **New to the project?** Start with [Overview](overview.md), then [System context](system-context.md). Read [Backend](backend.md) and [Frontend](frontend.md) to understand the main application structure.
- **Working on a specific area?** Use the list below to jump to the relevant document.
- **Making design decisions?** See [Architectural decisions](architectural-decisions.md) for existing rationale and trade-offs.

---

## Document Map

| Document | Contents |
|----------|----------|
| [Overview](overview.md) | Purpose and scope, intended audience, introduction to Data360 Chat, architectural goals and principles, and high-level technology stack. |
| [System context](system-context.md) | System boundaries, actors, external systems (Data360 MCP, LLM provider, Azure AD), and context diagram. |
| [Backend](backend.md) | FastAPI application structure, middleware, configuration, API routers and endpoints, core modules, and request lifecycle. |
| [Frontend](frontend.md) | Next.js App Router layout, pages and route groups, key components (chat, messages, sidebar, auth), state management, API client, and proxy behavior. |
| [Data and persistence](data-persistence.md) | PostgreSQL usage, SQLAlchemy models, query layer, Redis (caching and resumable streams), and Alembic migrations. |
| [Authentication](authentication.md) | Auth providers (guest, email/password, Azure AD/MSAL), JWT and session tokens, cookie handling, `get_current_user` dependency, and revocation. |
| [AI and streaming](ai-streaming.md) | Chat request flow, intent routing (RESEARCH vs DIRECT), streaming pipeline, tool execution (local and MCP), and resumable streams. |
| [Integrations](integrations.md) | Data360 MCP client (tool discovery and `call_mcp_tool`), LiteLLM and LLM provider configuration, and optional external services. |
| [Deployment and operations](deployment-and-operations.md) | Environment variables (backend and frontend), running locally and in production, Docker, CORS and cookie configuration, and operational notes. |
| [Architectural decisions](architectural-decisions.md) | Key design decisions, rationale, and trade-offs. |

---

## Word Document

A single **Word document** containing all of the above content (with a title page and table of contents) can be generated:

```bash
cd backend && uv run --with python-docx python ../docs/architecture/generate_docx.py
```

Output: `docs/architecture/Data360-Chat-Architecture.docx`
