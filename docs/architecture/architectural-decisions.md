# Architectural Decisions

This document summarizes **key architectural decisions**, their **rationale**, and **trade-offs**. It serves as a quick reference for why the system is structured as it is and what was sacrificed or deferred.

---

## 1. Separate frontend and backend

**Decision:** The application is split into a Next.js frontend and a FastAPI backend, each deployable and scalable independently. The frontend proxies all `/api/*` traffic to the backend so that the browser talks to a single origin.

**Rationale:** Separation allows the frontend to be deployed on edge or static hosts and the backend on a different scaling policy (e.g. more replicas under load). It also keeps API, auth, and business logic in one place (Python) and UI in another (TypeScript/React), which fits team skills and allows reuse of the backend by other clients (e.g. mobile or internal tools) later.

**Trade-offs:** Two deployments and two env/config surfaces. Cross-origin and cookie behavior must be configured correctly (CORS, cookie domain). The proxy adds a hop but avoids browser CORS and keeps credentials on the same origin from the user's perspective.

---

## 2. Single LLM path with RESEARCH vs DIRECT routing

**Decision:** There is one main chat path (POST /api/chat) and one streaming call to the LLM per turn. Intent is classified first (RESEARCH vs DIRECT); then a single stream runs with the appropriate system prompt and tool set (MCP + local for RESEARCH, local only for DIRECT). No separate "simple" and "research" pipelines.

**Rationale:** One code path is easier to maintain, test, and evolve. Routing is a small, fast step (e.g. one cheap model call or heuristic) so that cost and latency stay under control while still allowing the right tools and prompts per turn.

**Trade-offs:** Routing can be wrong occasionally (e.g. DIRECT when the user wanted data), which can be mitigated by tuning the router or allowing the user to force a mode later. All logic lives in one pipeline, so changes (e.g. new event types) affect both modes unless guarded by the routing result.

---

## 3. MCP as the extension point for data and charts

**Decision:** Data360-specific operations (search indicators, metadata, disaggregation, data, charts) are not implemented in the chat backend. They are delegated to the **Data360 MCP server**. The backend discovers MCP tools, caches their schemas, and calls `call_mcp_tool` when the LLM requests them. New data or visualization capabilities are added by extending or adding MCP servers, not by changing core chat code.

**Rationale:** Keeps the chat backend generic and avoids duplicating Data360 API logic. MCP is a standard protocol so that other MCP servers (e.g. other data sources) could be added with the same pattern. Tool results are streamed back uniformly (tool-result events → message parts).

**Trade-offs:** Dependency on MCP server availability and latency; need for robust timeouts and error handling. Tool list cache must be invalidated or TTL'd when the MCP server changes. The backend does not "own" the data schema; it passes through MCP responses.

---

## 4. Auth via cookies and server-side resolution only

**Decision:** The backend never trusts a user id or token sent in the request body or in a custom header. Identity is always resolved from: (1) JWT in cookie or Authorization header, (2) Azure AD token in MSAL cookie, or (3) opaque session token in cookie. Resolution is done in the `get_current_user` dependency and optionally cached for a short TTL.

**Rationale:** Prevents client spoofing of user id and ensures every protected endpoint sees a server-validated user. httpOnly cookies reduce XSS exposure. Multiple auth mechanisms (JWT, MSAL, session) allow different deployment contexts (guest-only, enterprise Azure AD) without code branches in business logic.

**Trade-offs:** All API calls must send cookies (or Bearer token), so non-browser clients must support cookies or use the same token in Authorization. Session invalidation (e.g. logout, password change) requires revocation list or version check.

---

## 5. Streaming-only chat response

**Decision:** Chat responses are streamed (SSE) from the backend to the client. The assistant message is persisted after the stream completes (or in background). There is no "wait for full response then return" mode for the main chat endpoint.

**Rationale:** Streaming improves perceived performance and allows the UI to show "thinking" and tool use as they happen. It also allows optional resumable streams (Redis) when the client disconnects. The frontend is built around the Vercel AI SDK and streaming consumption.

**Trade-offs:** More complex than a single JSON response: need for event protocol, StreamEventProcessor, and careful handling of tool calls and errors in the stream. Persistence and usage tracking happen asynchronously or at the end.

---

## 6. Query layer for all persistence

**Decision:** All database access goes through the **query layer** (`app/db/queries/`). Handlers and AI code call async functions that take `db: AsyncSession`; they do not write raw SQL or use the models directly for complex writes.

**Rationale:** Single place to change persistence logic, add logging, or optimize queries. Easier to test by mocking or replacing the query layer. Reduces risk of N+1 or inconsistent updates.

**Trade-offs:** More files and indirection; new features need new or extended query functions. The layer is not a full repository pattern (no abstraction over transactions beyond the session), but it is consistent.

---

## 7. Optional Redis for cache and resumable streams

**Decision:** Redis is optional. When configured, it is used for (1) caching (e.g. resolved user) and (2) storing stream chunks for resumable streams. When not configured, the app runs without these features (no cache, no resume).

**Rationale:** Allows minimal deployments (e.g. single server, no Redis) while enabling scale and resilience (cache, resume) when needed. No in-memory fallback for stream resume so that behavior is predictable.

**Trade-offs:** Resumable streams and user cache are unavailable without Redis. Operators must run and maintain Redis if they want those features.

---

## Summary

| Decision | Rationale | Trade-off |
|----------|------------|-----------|
| Frontend/backend split | Independent scaling, clear separation of concerns | Two deployments; CORS/cookie config |
| Single LLM path + routing | Maintainability, one pipeline | Routing can be wrong; both modes share code |
| MCP for data/charts | Extensibility, no duplication of Data360 logic | MCP dependency, cache invalidation |
| Auth via cookies only | Security, no client spoofing | Clients must send cookies/token |
| Streaming-only chat | UX, optional resume | More complex stream handling |
| Query layer | Consistency, testability | More indirection |
| Optional Redis | Flexibility for minimal vs full deploy | No cache/resume without Redis |

These decisions are expected to be stable; any change (e.g. adding a second LLM path or moving to a different auth scheme) should be documented here or in an ADR.
