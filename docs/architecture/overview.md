# Overview

## Purpose and scope of this documentation

This architecture documentation describes **Data360 Chat** (the Data Chatbot): a full-stack conversational AI application that lets users interact with development data, documents, and analytical tools through natural language. The documents in this section are intended to give a **detailed, accurate picture** of how the system is structured, how data and control flow through it, and why key design choices were made.

**In scope:**

- High-level structure (frontend, backend, data layer, external systems).
- Backend and frontend organization, main modules, and responsibilities.
- Authentication and authorization flows.
- Chat and AI streaming pipeline (routing, tools, MCP integration).
- Data persistence (PostgreSQL, Redis) and query layer.
- Integrations (Data360 MCP, LLM provider, optional Azure AD).
- Configuration, deployment, and operational considerations.
- Key architectural decisions and trade-offs.

**Out of scope:**

- Step-by-step runbooks or troubleshooting playbooks (see [Operations](../operations/index.md) and [Deployment](../deployment/index.md)).
- Full API request/response schemas (see OpenAPI at `/docs` on the backend).
- Product requirements, roadmaps, or UX specifications (product documentation).

---

## Intended audience

- **Developers** — Working on backend or frontend; need context on modules, data flow, and integration points.
- **Architects and technical leads** — Evaluating consistency with standards, extensibility, and technical risk.
- **Operations and DevOps** — Planning deployment, monitoring, and environment configuration.

---

## Introduction to Data360 Chat

Data360 Chat provides a single, user-facing interface where staff can:

- Have **natural-language conversations** with an AI assistant.
- **Create and edit documents** (text, code, spreadsheets) with AI help.
- **Explore development data** — search indicators, view metadata, fetch time-series data, and generate charts — by asking questions; the backend uses the **Data360 MCP server** to perform these operations.
- **Attach files** to messages and receive **streaming responses** with clear feedback (e.g. "thinking" and tool-use stages).

The system is built as a **full-stack web application**:

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript. Renders the chat UI, auth pages, and sidebar; proxies all API and streaming traffic to the backend so the browser talks to a single origin.
- **Backend:** FastAPI (Python). Handles authentication, chat and message persistence, and AI orchestration. It calls an LLM provider (e.g. Azure OpenAI via LiteLLM) for generation and the Data360 MCP server for data and chart tools. It does not store indicator or chart data itself; it stores only user identity, chat state, and references (e.g. chart IDs).

Chat is **stateful**: conversations and history are stored in PostgreSQL. Optional **Redis** is used for caching and for storing stream chunks so that a user who disconnects during a long response can **resume** and receive the rest of the answer later.

---

## Architectural goals and principles

The design aims to achieve the following:

1. **User experience** — Responsive, streaming chat with clear feedback (e.g. "thinking" and tool use) and persistent history with visibility controls (e.g. private vs shared).
2. **Security and compliance** — Authentication and authorization on every request; httpOnly cookies; optional Azure AD (MSAL); rate limiting and CSRF protection; no trust of client-supplied user identity.
3. **Maintainability** — Clear separation between HTTP layer, business logic, and persistence; async I/O; a single LLM path with intent routing (RESEARCH vs DIRECT) rather than multiple ad-hoc pipelines.
4. **Extensibility** — New data and visualization capabilities added via **MCP** (Model Context Protocol); local tools and MCP tools are handled uniformly in the stream so that adding a new MCP server does not require core chat changes.

---

## High-level technology stack

| Layer | Technology | Purpose |
|-------|------------|--------|
| **Frontend** | Next.js 16, React 19, TypeScript | App Router, chat UI, auth, API proxy |
| **Frontend** | Tailwind CSS, shadcn/ui, Vercel AI SDK | Styling, components, `useChat` and streaming |
| **Backend** | FastAPI | REST API, SSE streaming, auth, MCP client |
| **Backend** | LiteLLM | Unified LLM client (Azure OpenAI–compatible) |
| **Database** | PostgreSQL, SQLAlchemy (async) | Persistent storage (users, chats, messages, etc.) |
| **Cache** | Redis (optional) | Session/cache, resumable stream chunks |
| **External** | Data360 MCP | Tools: search indicators, metadata, data, charts |
| **External** | Azure AD (optional) | MSAL authentication |

The next document, [System context](system-context.md), describes system boundaries, actors, and external systems in more detail.
