# Frontend

This document describes the **Next.js frontend** in detail: App Router layout, route groups, key components, state management, and how the frontend talks to the backend (API client and proxy).

---

## Technology stack

- **Next.js 16** with the **App Router**.
- **React 19**, **TypeScript**.
- **Tailwind CSS** and **shadcn/ui** for styling and components.
- **Vercel AI SDK** for chat state (`useChat`) and streaming.
- **MSAL** (when Azure AD is used) for login flow; the frontend redirects to Azure and receives the token, then sends it to the backend via a dedicated route that sets the cookie.

---

## App Router layout

The application lives under **`frontend/app/`**. Structure:

- **`layout.tsx`** — Root layout (html, body, providers). Wraps the whole app.
- **`global-error.tsx`** — Error boundary for the root segment.
- **`globals.css`** — Global styles.

Route groups (parentheses do not affect the URL):

- **`(auth)/`** — Login, register, guest entry. Contains `login/page.tsx`, `register/page.tsx`, and `(auth)/api/auth/guest/route.ts` for guest creation. Auth forms post to the backend; the backend sets cookies and returns tokens.
- **`(chat)/`** — Main chat experience. Contains:
  - **`layout.tsx`** — Layout for the chat area (e.g. sidebar + main content).
  - **`page.tsx`** — Home: new chat or redirect.
  - **`chat/[id]/page.tsx`** — Chat by id: can do server-side fetch of chat and then hydrate.
  - **`chat/[id]/chat-page-client.tsx`** — Client-side fetch of `/api/chat/{id}` when needed.
  - **`chat/[id]/chat-page-shared.tsx`** — Shared UI between server and client (messages, input, etc.).
  - **`actions.ts`** — Server actions (e.g. delete messages, update visibility).
  - **`api/suggestions/route.ts`** — Suggestions API (may proxy or call backend).
  - **`api/chat/schema.ts`** — Chat API schema/types.

- **`api/`** — Next.js API routes:
  - **`auth/refresh/route.ts`** — Token refresh.
  - **`auth/logout/route.ts`** — Logout (clear cookies / call backend).
  - **`auth/me/route.ts`** — Current user info.
  - **`auth/guest/reset/route.ts`** — Guest session reset.
  - **`auth/msal/set-token/route.ts`** — Receives MSAL token from frontend and sets httpOnly cookie via backend or redirect.
  - **`[...path]/route.ts`** — **Catch-all proxy**: forwards requests to `NEXT_PUBLIC_API_URL` (or `SERVER_API_URL` on the server) so that `/api/*` hits the FastAPI backend. Handles redirect rewriting and streaming (no buffering of `text/event-stream`).

- **`maintenance/page.tsx`** — Maintenance mode page (when configured).
- **`review/`** — Review layout and **`review/feedback/page.tsx`** for feedback reviewers.

---

## API proxy behavior

The catch-all route **`app/api/[...path]/route.ts`**:

- Uses **`SERVER_API_URL`** or **`NEXT_PUBLIC_API_URL`** (default `http://localhost:8001`) as the backend base URL.
- Forwards the request path, method, headers (including cookies), and body to the backend. For redirect responses, it rewrites `Location` so the client is sent to the frontend origin, not the backend host.
- For streaming responses (`text/event-stream` or chunked), it pipes the stream to the client without buffering so that SSE and streaming chat work correctly.
- Derives the client-facing origin from `X-Forwarded-*`, `Referer`, or `NEXT_PUBLIC_APP_URL` for redirect rewriting.

More specific routes (e.g. `/api/auth/refresh`, `/api/auth/me`) take precedence over the catch-all, so auth can be handled in Next.js when needed (e.g. to read cookies and call the backend with the same credentials).

---

## Key components

- **Chat** — **`components/chat.tsx`** (or under `frontend/components/`). Uses Vercel AI SDK **`useChat`** with a custom transport that POSTs to `/api/chat` (so the request goes through the proxy). Prepares the request body with chat id, last message, selected model, and visibility. Handles **`onData`** for special stream parts (e.g. `data-thinking`, `data-stage`) so that "thinking" and stage updates can be shown. Supports stop, regenerate, and optional resume.
- **Messages** — **`message.tsx`** (e.g. `PreviewMessage`, `ThinkingMessage`), **`messages.tsx`**, **`multimodal-input.tsx`**, **`message-editor.tsx`**, **`message-actions.tsx`**. Render the message list, user/assistant blocks, and input area.
- **Sidebar** — **`app-sidebar.tsx`**, **`sidebar-history.tsx`**, **`sidebar-history-item.tsx`**, **`sidebar-user-nav.tsx`**. Chat history list and user menu (login/logout, profile).
- **Auth** — MSAL provider wrapper (e.g. **`auth/msal/msal-provider-wrapper.tsx`**); login/register/guest pages under **`(auth)/`**.
- **Data360 / artifacts** — **`data360/chart-preview.tsx`**, **`data360/search-indicators.tsx`**; **`elements/response.tsx`**; artifact types under **`frontend/artifacts/`** (embed, chart, code, image, text, sheet) for rendering tool results (e.g. charts, search results).
- **Config and visibility** — **`home-config-provider.tsx`** (e.g. `useHomeConfig`, `HomeConfigProvider`), **`visibility-selector.tsx`**, **`use-chat-visibility.ts`**, **`use-data-thinking-stream.ts`**.

---

## State management

- There is **no global store** (e.g. Redux). Chat state is driven by **`useChat`** (messages, status, sendMessage, stop, regenerate, resumeStream). The active chat id is in the **URL** (`/chat/[id]`), so refreshing or sharing the link opens the same chat.
- **Visibility** and **home configuration** (e.g. which model, visibility type) are provided via **context and hooks** (`HomeConfigProvider`, `useChatVisibility`) so that the chat component and sidebar stay in sync.
- **Auth state** is inferred from cookies and optional `/api/auth/me`; the backend is the source of truth. The frontend does not store tokens in memory for API calls; it relies on **credentials: 'include'** so that cookies are sent with every request.

---

## API client

- **`lib/api-client.ts`** (or equivalent path under `frontend/lib/`):
  - **`getApiUrl(path)`** — Returns the path (e.g. `/api/chat`) so that requests go to the same origin and are proxied to the backend. No backend base URL is needed in the browser for same-origin deployment.
  - **`apiFetch(url, options)`** — Wrapper that adds `credentials: 'include'`, `Content-Type` where appropriate, and uses the same origin. Used by chat transport and other API calls.
  - **`serverApiFetch`** — Used from server components or server actions to call the backend with the same cookies (e.g. when loading a chat by id on the server for SSR). Uses `SERVER_API_URL` or `NEXT_PUBLIC_API_URL` and forwards cookies from the incoming request.

The chat transport (in `useChat`) uses this client so that POSTs to `/api/chat` and GETs to fetch chat/messages are authenticated via cookies and go through the proxy.

---

## Data flow (sending a message)

1. User types and submits in the chat input.
2. `useChat` builds the request (id, messages, model, visibility) and POSTs to `getApiUrl("/api/chat")` (i.e. `/api/chat`) with `apiFetch` (credentials included).
3. Next.js catches `/api/chat` and forwards it to the backend (catch-all or a more specific route if present).
4. Backend handles the request (auth, chat load/create, stream). Response is SSE.
5. Proxy streams the response back; `useChat` consumes the stream, updates messages and status, and `onData` handles data-thinking/data-stage. Components re-render with new message parts and artifacts (e.g. charts).

The next document, [Data and persistence](data-persistence.md), describes the database models and query layer used by the backend.
