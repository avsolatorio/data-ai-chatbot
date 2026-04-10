# Authorization guardrails (internal reference, not published)

This file is **excluded from the public documentation build** (`mkdocs.yml` → `exclude_docs`) so it does not appear on GitHub Pages. It remains in the repository for contributors who clone the repo.

**Content policy:** Do not add per-route URLs, handler names, or step-by-step exploitation notes here—those belong in **private** engineering trackers.

---

## Summary

The API is designed so that **authenticated identity** is established server-side, and **user-owned resources** (chats, files, documents, votes) are accessed only when the backend enforces the correct relationship to the current user (or an intentional public-read rule, where documented).

Some features are **deliberately shareable** (for example, artifacts identified by opaque IDs for embedding). If product requirements change, tighten authz and document the behavior in release notes.

Operational routes (for example, admin or reviewer flows) should rely on **configuration-driven allowlists** rather than hard-coded identities.

---

## Ongoing expectations

1. New endpoints that accept resource IDs must **repeat the same authorization patterns** as existing user-scoped routes.
2. **Secrets and environment** defaults must be validated before production (see [risk posture](risk-assessment.md) and [environment variables](../operations/environment-variables.md)).
3. When adding streaming or long-lived connections, apply the **same ownership checks** as for non-streaming access to the same conversation.

For architecture context, see [Security overview](overview.md) and the deployment sections of this documentation set.
