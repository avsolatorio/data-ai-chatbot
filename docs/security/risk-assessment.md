# Security Risk Assessment

**Document version:** 1.0  
**Date:** February 6, 2025  
**Scope:** Full-stack chat application (Next.js frontend, FastAPI backend, PostgreSQL, Redis)

---

## Executive Summary

This document summarizes the security audit of the chat application, identifies risks by severity, and provides a prioritized mitigation plan. The application has solid foundations (auth, CSRF, rate limiting, password policy, logging) but several **high** and **medium** issues require remediation, especially around authorization on file/chart access and chat stream ownership.

---

## Risk Summary Table

| ID | Risk | Severity | Category | Status |
|----|------|----------|----------|--------|
| SEC-01 | Unauthenticated file download (IDOR) | **High** | Authorization | Open |
| SEC-02 | Chat stream missing ownership check (IDOR) | **High** | Authorization | Open |
| SEC-03 | File content in messages not scoped to user | **High** | Authorization | Open |
| SEC-04 | Unauthenticated chart retrieval (IDOR) | **Medium** | Authorization | Open |
| SEC-05 | Default/weak secrets in config | **High** | Config/Secrets | Open |
| SEC-06 | Session cookie raw-UUID fallback | **Medium** | Authentication | Open |
| SEC-07 | Content-Disposition filename injection | **Low** | Injection | Open |
| SEC-08 | Feedback endpoint abuse (no rate limit) | **Low** | Availability | Open |
| SEC-09 | CSRF require_origin=False on auth | **Low** | CSRF | Open |
| SEC-10 | Verbose auth logging | **Low** | Privacy/Logging | Open |

---

## High-priority mitigations

### SEC-01: Unauthenticated file download (IDOR)

- **Location:** `backend/app/api/v1/files.py` — `get_file()`
- **Mitigation:** Require `get_current_user`; enforce `file_record.user_id == current_user` before returning content.

### SEC-02: Chat stream missing ownership check (IDOR)

- **Location:** `backend/app/api/v1/chat_stream.py` — `stream_chat()`
- **Mitigation:** At start of `stream_chat()`, load chat and verify `chat.userId == user_id` before proceeding.

### SEC-03: File content in messages not scoped to user

- **Location:** `backend/app/utils/message_converter.py`, `file_handler.py`
- **Mitigation:** Pass `user_id` into file resolution; only resolve files where `file_record.user_id == user_id`.

### SEC-05: Default/weak secrets in config

- **Location:** `backend/app/config.py`
- **Mitigation:** Refuse to start in production if `JWT_SECRET_KEY` is default. Require strong `POSTGRES_PASSWORD`. Use `openssl rand -hex 32` for secrets.

---

## Medium-priority mitigations

### SEC-04: Unauthenticated chart retrieval (IDOR)

- **Mitigation:** Require auth for GET chart; enforce `chart.user_id == current_user` (or document if charts are intentionally world-readable).

### SEC-06: Session cookie raw-UUID fallback

- **Mitigation:** Deprecate and remove raw-UUID fallback; use only HMAC-signed session tokens.

---

## Low-priority mitigations

- **SEC-07:** Sanitize filename in Content-Disposition.
- **SEC-08:** Add rate limiting to POST /api/feedback.
- **SEC-09:** Review CSRF policy for auth endpoints.
- **SEC-10:** Reduce auth logging verbosity in production.

---

## Positive findings

- JWT with httpOnly cookie, revocation (jti), password-change invalidation.
- Password policy, HIBP optional, bcrypt.
- Rate limiting on auth and chat.
- CSRF Origin/Referer validation.
- Cookies: Secure, HttpOnly, SameSite, configurable domain.
- ORM-only (SQLAlchemy) — low SQL injection risk.
- Chat ownership enforced in non-stream path (`chat.py`).

---

## Mitigation plan

| Phase | IDs | Action |
|-------|-----|--------|
| Phase 1 (Critical) | SEC-01, SEC-02, SEC-03, SEC-05 | Add authz checks; enforce non-default secrets |
| Phase 2 (Important) | SEC-04, SEC-06 | Chart ownership; deprecate raw-UUID fallback |
| Phase 3 (Hardening) | SEC-07, SEC-08, SEC-09, SEC-10 | Filename sanitization, feedback rate limit, CSRF review, logging |

---

*See the full risk assessment in the repository for detailed evidence and file references.*
