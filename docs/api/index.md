# API Reference

The Data360 Chat backend exposes a REST API and streaming endpoints. Interactive documentation is available when the backend is running.

---

## Interactive documentation

When the backend is running, visit:

- **Swagger UI** — `{BACKEND_URL}/docs`  
  Example: [http://localhost:8001/docs](http://localhost:8001/docs)
- **ReDoc** — `{BACKEND_URL}/redoc`  
  Example: [http://localhost:8001/redoc](http://localhost:8001/redoc)

These pages provide:

- Full list of endpoints
- Request/response schemas
- Try-it-out functionality (for testing)

---

## Main endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/chat | Create or continue chat (streaming) |
| GET | /api/chat/{id} | Get chat by ID |
| GET | /api/history | List chat history |
| POST | /api/auth/login | Email/password login |
| POST | /api/auth/register | Register new user |
| POST | /api/auth/guest | Create guest session |
| GET | /api/auth/me | Current user info |
| GET | /health | Health check |

---

## Authentication

API requests require authentication via:

- **Cookie** — `auth_token` (JWT), `guest_session_id`, or MSAL cookie
- **Header** — `Authorization: Bearer <token>` (for non-browser clients)

Include `credentials: 'include'` when calling from the browser so cookies are sent.

---

## Architecture

For details on the API structure, see [Architecture - Backend](../architecture/backend.md).
