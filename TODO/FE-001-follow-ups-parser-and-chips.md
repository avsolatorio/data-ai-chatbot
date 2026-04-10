---
github_issue: 71
id: FE-001
repo: vercel-ai-chatbot
title: Follow-ups — parser hardening and chip affordance
status: done
priority: medium
depends_on: []
blocks: []
---

# FE-001 — Follow-up parser and suggestion chips

## Goal

Make suggested follow-ups reliably interactive and visually obvious: parsing robustness, optional icons, mobile-friendly layout.

## Context

- Parser: `frontend/lib/parse-follow-ups.ts` (expects `**Suggested follow-ups:**` section).
- UI: `frontend/components/message.tsx` (chips after completion), `frontend/components/elements/suggestion.tsx`, `frontend/components/suggested-actions.tsx`.

## Implementation hints
- **Parser:** `frontend/lib/parse-follow-ups.ts` → `parseFollowUps()` line 9. Heading pattern (line 6): `/\*{0,2}Suggested follow-ups\*{0,2}\s*:?/im` — already tolerates bold wrapping and optional colon. List pattern (line 7) handles `-`, `*`, `•`, and numbered lists. Stops at first empty line (line 25), caps at 4 items (line 15).
- **Chip rendering:** `frontend/components/message.tsx` → `PurePreviewMessage`. Follow-ups parsed at line 751; chips rendered at lines 1026–1063. Conditions: assistant role + followUps non-empty + sendMessage present + not readonly + not loading. Uses `Suggestion` component from `frontend/components/elements/suggestion.tsx` line 28.
- **Suggestion component:** `frontend/components/elements/suggestion.tsx` lines 28–53 — wraps `Button`, props: `suggestion: string`, optional `onClick`. Default style: `h-auto whitespace-normal px-3 py-1.5 text-left text-sm`.
- **Current behavior:** Parser is fairly robust already. No unit tests exist — tests directory `frontend/lib/__tests__/` doesn't exist yet. E2E tests live in `frontend/tests/e2e/`.
- **Desired behavior:** Add unit tests for `parseFollowUps` covering empty section, extra blank lines, numbered lists, missing heading, >4 items. Add `frontend/lib/__tests__/parse-follow-ups.test.ts`.
- **Gotcha:** The stop-at-empty-line logic (line 25) means follow-ups must be a contiguous list with no blank lines between items. Confirm this matches BE-001's output format before writing tests.

## Acceptance criteria

- [x] Parser tolerates minor heading variants **or** tests document the exact required string aligned with BE-001.
- [x] Unit tests cover edge cases (empty section, extra blank lines, numbered lists).
- [x] Chips read as buttons (outline/icon optional per design system); no accessibility regressions.

## Dependencies

- None required. Coordinate heading string with **BE-001** so model and parser agree.
