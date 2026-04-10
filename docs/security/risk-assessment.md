# Security risk posture (public summary)

**Audience:** Operators and contributors reviewing the project at a high level.  
**Last updated:** April 2026

This page describes **themes** the team watches for when self-hosting or extending the app. It does **not** enumerate implementation-level findings, file paths, or exploit checklists. Detailed reviews are handled **out of band** (internal trackers, responsible disclosure).

---

## Scope

Full-stack chat application: web frontend, API backend, database, cache, and optional Azure AD (MSAL) sign-in. Threat modeling assumes **untrusted clients** and **multi-tenant-style** use (users must not access one another’s chats, files, or private artifacts).

---

## Themes we manage

| Theme | What we watch for |
|-------|-------------------|
| **Authorization** | Every user-scoped resource (chats, uploads, documents, votes) should be tied to an authenticated identity and checked before read/write. |
| **Configuration & secrets** | Production must use strong, non-default secrets; database and signing keys must never be committed. See [Environment variables](../operations/environment-variables.md). |
| **Session & cookies** | HttpOnly, Secure, SameSite, and domain alignment with the frontend; session invalidation on logout and rotation where applicable. |
| **Injection & headers** | Safe handling of filenames and user-influenced strings returned to browsers (e.g. downloads). |
| **Availability** | Rate limits on sensitive routes; abuse-resistant feedback and auth flows. |
| **CSRF & CORS** | Origin/referrer policies where appropriate; explicit allowlists for credentialed cross-origin use. |

---

## Practices

- Prefer **defense in depth**: authentication, authorization, rate limiting, and logging together—not a single control.
- **Review** authorization whenever a new API route or resource type is added.
- **Rotate** secrets and review env templates after incidents or staff changes.
- **Report** suspected vulnerabilities through the repository’s security policy or maintainer contact, not via public issues when disclosure could increase risk.

---

## Related docs

- [Security overview](overview.md) — How auth, CSRF, rate limiting, and cookies are designed.
- [Environment variables](../operations/environment-variables.md) — Configuration surface and sensitive settings.
