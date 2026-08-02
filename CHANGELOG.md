# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-08-02

### Added

- /admin dashboard at /admin/{analytics,moderation,health}
- Backend: 4 analytics endpoints (users, chats, feedback, tokens) with date range filter
- Backend: 4 moderation endpoints (list users, disable toggle, list chats, soft delete)
- Backend: 2 health endpoints (status + metrics incl. token rate and cost)
- Token usage tracking via new ChatTokenUsage model
- ADMIN_EMAILS env var for admin allowlist
- canViewAdmin flag in /api/auth/me
- Disabled-user auth block on login, guest, refresh
- Soft delete for chats via deletedAt column
- Rate limit exemption for /api/admin/* paths
- Dev-only auto table creation for ChatTokenUsage

### Fixed

- Health endpoint now returns string db/mcp state and uptimeSeconds
- Moderation search strips null bytes; reversed date range returns 400
