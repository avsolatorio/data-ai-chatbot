# Security Overview

This document summarizes the security architecture of Data360 Chat.

---

## Authentication

- **Three auth paths:** JWT (email/password), Azure AD cookie (MSAL), and opaque session token (guest or user).
- **Server-side resolution only:** The backend never trusts a user id or token from the request body. Identity is always resolved from cookies or the Authorization header using the API’s auth dependencies.
- **httpOnly cookies:** Auth tokens are stored in httpOnly cookies so JavaScript cannot read them (XSS mitigation).
- **Revocation:** JWT JTI blacklist (logout, password change), session invalidation, optional SESSION_VERSION for deploy-time invalidation.

---

## CSRF

- **Origin/Referer validation** for state-changing requests (POST, PUT, PATCH, DELETE) when `CSRF_REQUIRE_ORIGIN_ALWAYS` is enabled.
- Auth endpoints may use `require_origin=False` for API client compatibility; document the trade-off.

---

## Rate limiting

- **Per user or per IP** when `RATE_LIMIT_ENABLED` is true.
- Applied to login, register, guest, password reset, and chat endpoints.
- Returns 429 when exceeded.

---

## CORS

- **Explicit origins:** `CORS_ORIGINS` must list the exact frontend origin(s). Wildcard `*` is not allowed when `allow_credentials=True`.
- **Credentials:** Cookies are sent with `credentials: 'include'`; CORS must allow the frontend origin.

---

## Password policy

- Strength validation, optional HIBP (Have I Been Pwned) check.
- bcrypt hashing, 72-byte limit handled.

---

## Logging

- Hashed email and user ID in logs where possible.
- No raw tokens or full cookies in logs.
- Reduce verbosity in production.

---

## See also

- [Risk assessment](risk-assessment.md) — Public summary of security themes and practices
