# Security Guardrails Audit

This document summarizes the review of API surfaces for **authorization and input-validation guardrails** to prevent bypass via malicious requests (e.g. IDOR, cross-user access).

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| Chat / stream / history | Guarded | Ownership or visibility checked on all chat-scoped endpoints |
| Documents | Guarded | Ownership checked on get/create/delete |
| Votes | Guarded | Chat access + message-in-chat validation |
| Files | Fixed | GET now enforces ownership (was IDOR) |
| Charts | By design | GET is world-readable by ID (shareable); add ownership if needed |
| Auth (logout/refresh/guest reset) | Guarded | Token/session from request only; no IDOR surface |
| Feedback review | Guarded | Reviewer allowlist (FEEDBACK_REVIEWER_EMAILS) |
| Thinking stream | If enabled | Not mounted; add chat-ownership check if mounted |

---

## Key endpoints

### Chat and stream

- **POST /api/v1/chat/stream** — Validates chat exists and `existing_chat.userId == current_user` before streaming.
- **POST /api/v1/chat** — For existing chat, validates `chat.userId == user_id`; else creates with current user.
- **GET/DELETE /api/v1/chat/{id}**, **PATCH visibility**, **DELETE messages** — Validates `user_ids_match` or visibility for public read.

### Files

- **GET /api/v1/files/{file_id}** — Requires auth when `file.user_id` is set; allows access only if `file.user_id == current_user`.
- **POST /api/v1/files/upload** — Requires `get_current_user`; file stored with `user_id`.

### Documents

- **GET/POST/DELETE /api/v1/document** — Validates `user_ids_match(current_user, document.user_id)` on all operations.

### Charts

- **GET /api/v1/charts/{chart_id}** — Intentionally no ownership check; charts are world-readable by ID (shareable/embed). Add auth and ownership if charts become private.

### Votes

- **GET/PATCH /api/v1/vote** — Validates chat access and that `messageId` belongs to `chatId` before voting.

---

## Recommendations

1. Keep ownership checks on all resource-scoped endpoints.
2. If charts become private, add auth and `chart.user_id == current_user` to GET chart.
3. If thinking stream router is mounted, add the same chat-ownership validation as in `chat_stream.stream_chat`.
