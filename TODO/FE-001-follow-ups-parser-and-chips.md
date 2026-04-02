---
id: FE-001
repo: vercel-ai-chatbot
title: Follow-ups — parser hardening and chip affordance
status: done
depends_on: []
blocks: []
---

# FE-001 — Follow-up parser and suggestion chips

## Goal

Make suggested follow-ups reliably interactive and visually obvious: parsing robustness, optional icons, mobile-friendly layout.

## Context

- Parser: `frontend/lib/parse-follow-ups.ts` (expects `**Suggested follow-ups:**` section).
- UI: `frontend/components/message.tsx` (chips after completion), `frontend/components/elements/suggestion.tsx`, `frontend/components/suggested-actions.tsx`.

## Acceptance criteria

- [x] Parser tolerates minor heading variants **or** tests document the exact required string aligned with BE-001.
- [x] Unit tests cover edge cases (empty section, extra blank lines, numbered lists).
- [x] Chips read as buttons (outline/icon optional per design system); no accessibility regressions.

## Dependencies

- None required. Coordinate heading string with **BE-001** so model and parser agree.
