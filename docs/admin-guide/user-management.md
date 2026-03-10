# User Management

This document describes how users are managed in Data360 Chat.

---

## User types

- **Guest** — Temporary users created when "Continue as guest" is used. Limited persistence; no email.
- **Email/password** — Users who register with email and password. Full account and chat history.
- **Azure AD (MSAL)** — Users who sign in with Microsoft. Account is created or linked by `azure_oid` on first sign-in.

---

## Management options

Data360 Chat does not include a built-in admin UI for user management. Users are managed through:

1. **Database** — User records are in the `User` table. Direct DB access (e.g. for support or compliance) requires database credentials and appropriate permissions.
2. **Auth provider** — For Azure AD users, management (e.g. disabling accounts) is typically done in Azure AD. The chat app trusts the token from Azure.
3. **Password reset** — Users can request a password reset via the in-app flow. The backend sends an email (or returns a link in dev) with a reset token.

---

## Revoking access

- **Logout** — Users can log out, which revokes their JWT (adds JTI to revoked list).
- **Password change** — Changing a password invalidates existing sessions for that user.
- **SESSION_VERSION** — Setting a new `SESSION_VERSION` in the backend and deploying can invalidate all session tokens (guest and opaque sessions). Users must sign in again.
- **Azure AD** — Disable or remove the user in Azure AD to revoke access for MSAL users.

---

## Recommendations

- Use strong `JWT_SECRET_KEY` and `SESSION_SECRET_KEY` in production.
- Rotate secrets periodically; document the process in your runbooks.
- For audit or compliance, ensure logging captures relevant events (e.g. login, logout) with hashed identifiers.
