# Authentication

This document describes how **authentication and authorization** work: auth providers (guest, email/password, Azure AD), JWT and session tokens, cookie handling, the `get_current_user` dependency, and revocation.

---

## Auth providers and modes

The application supports three ways for a user to be considered "signed in":

1. **Guest** — No email/password. The backend creates a **guest user** and an **opaque session token** stored in the database. The token is sent to the client in an httpOnly cookie (e.g. `guest_session_id`). The client sends this cookie with every request; the backend validates it and resolves the guest user.
2. **Email / password** — The user registers or logs in with email and password. The backend verifies the password (bcrypt/argon2), creates or updates a **JWT** and optionally a **session token**, and sets an httpOnly cookie (e.g. `auth_token`) with the JWT. Subsequent requests carry this cookie; the backend validates the JWT and loads the user.
3. **Azure AD (MSAL)** — The user signs in via the Microsoft identity flow in the browser. The frontend receives an access token from MSAL and sends it to a backend route (e.g. `/api/auth/msal/set-token` or a Next.js route that calls the backend) that **validates the token** and sets an httpOnly cookie (e.g. `MSAL_AUTH_COOKIE_NAME`). The backend does not use the JWT path for these users; it validates the Azure AD token (issuer, audience, signature, expiry) and optionally looks up or creates a user by `azure_oid` (oid claim). Cookie name and validation settings are in config (`AZURE_AD_*`).

The **backend** does not rely on a single "auth provider" flag to decide behavior; it tries **JWT first**, then **Azure AD cookie** if JWT fails and Azure is configured, then **session tokens** (guest or user). So the same API works whether the user signed in as guest, email/password, or MSAL.

---

## Tokens and cookies

- **JWT** — Signed with `JWT_SECRET_KEY` (and optionally validated with `JWT_SECRET_KEY_OLD` during key rotation). Contains claims such as `sub` (user id), `exp`, `jti`. Stored in cookie `auth_token` (or similar); can also be sent in `Authorization: Bearer <token>`. httpOnly so that JavaScript cannot read it (XSS mitigation).
- **Session token** — Opaque string stored in the `AuthSession` table with user id and expiry. Used for guest and for optional "remember me" style sessions. Sent in cookies such as `guest_session_id` or `user_session_id`. Validated by looking up the token in the DB.
- **MSAL cookie** — The Azure AD access token (or a backend-issued token after validating Azure AD) stored in a cookie with name `MSAL_AUTH_COOKIE_NAME`. httpOnly. Validated on each request when JWT is absent or invalid.

Cookie domain, path, secure, and sameSite are set according to config (e.g. `COOKIE_DOMAIN`) so that cookies work in production (e.g. subdomains) and with the frontend origin.

---

## Resolving the current user: `get_current_user`

The dependency **`get_current_user`** in **`app/api/deps.py`** is used by almost all protected routes. It:

1. **Tries JWT** — Reads `auth_token` cookie or `Authorization: Bearer` header. Decodes and validates the JWT (signature, exp, optional jti). If valid, loads the user by id (from `sub`) and checks that the user is not invalidated (e.g. password change after token issue). If **JTI** is present, checks that it is not in the **revoked token** table (logout or password change). Returns the user; optionally caches the result for `USER_CACHE_TTL_SECONDS` to reduce DB load.
2. **If JWT fails and Azure AD is configured** — Reads the MSAL cookie. Validates the token (issuer, audience, signature if not disabled, expiry). Extracts `oid` (or similar) and finds or creates the user by `azure_oid`. Returns that user.
3. **Fallback: session token** — Reads `guest_session_id` or `user_session_id` cookie. Looks up the token in `AuthSession`; if found and not expired, loads the user and checks `SESSION_VERSION` (deploy-time invalidation). Returns the user.

If all three fail, the dependency raises an HTTP 401 (or similar) and the request is rejected. The backend **never** trusts a user id or token sent in the body or in a custom header without validating it via one of these three mechanisms.

---

## Revocation and invalidation

- **RevokedToken** — When the user logs out (or password is changed), the JWT's **JTI** (if present) is added to the `RevokedToken` table. On every JWT validation, the backend checks this table; if the JTI is revoked, the token is treated as invalid.
- **Password change** — When the user changes their password, `password_changed_at` is updated and existing JTIs (or all sessions for that user) can be revoked so that old tokens and sessions no longer work.
- **SESSION_VERSION** — A config value (e.g. set to build id or timestamp in CI). When the backend returns `/api/auth/me`, it sends `X-Session-Version`. If the frontend sees a version change (e.g. after deploy), it can force logout and clear cookies so that all server-side sessions (opaque tokens) are effectively invalidated.

---

## Auth routes (backend)

Implemented in **`backend/app/api/v1/auth.py`**:

- **POST /api/auth/login** — Email + password; verify password, create JWT and optionally session; set cookie; return token payload.
- **POST /api/auth/register** — Create user, then same as login.
- **POST /api/auth/guest** — Create guest user and session; set guest cookie; return minimal token/session info.
- **POST /api/auth/guest/reset** — Invalidate current guest session and create a new one (new user/session).
- **POST /api/auth/logout** — Revoke JWT (add JTI to RevokedToken), clear session if any, clear cookies.
- **GET /api/auth/me** — Return current user (via `get_current_user`); include `X-Session-Version` header.
- **POST /api/auth/refresh** — Issue a new JWT (and optionally refresh session) if the current one is valid.
- **POST /api/auth/password-reset/request** — Create password reset token, send email (or return link in dev).
- **POST /api/auth/password-reset/confirm** — Consume reset token, update password, invalidate old sessions/JWTs.

The frontend may also expose **Next.js API routes** (e.g. for MSAL callback) that call the backend to set the MSAL cookie after the Azure AD flow completes.

---

## Summary

- **Three auth paths:** JWT (email/password), Azure AD cookie (MSAL), and opaque session token (guest or user). The backend tries them in order.
- **Cookies are httpOnly** and set by the backend; the frontend uses `credentials: 'include'` so that cookies are sent with every request.
- **Revocation** is via RevokedToken (JTI), password change invalidation, and optional SESSION_VERSION for deploy-time session invalidation.

The next document, [AI and streaming](ai-streaming.md), describes how the chat request is processed and how the AI and streaming pipeline works.
