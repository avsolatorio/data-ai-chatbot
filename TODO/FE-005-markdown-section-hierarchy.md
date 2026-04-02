---
id: FE-005
repo: vercel-ai-chatbot
title: Markdown — visual hierarchy for section headings
status: pending
depends_on:
  - BE-001
blocks:
  - FE-006
---

# FE-005 — Section heading styling (Summary, Analysis, …)

## Goal

Strengthen visual hierarchy for model-emitted sections: spacing, typography, optional borders/backgrounds for `h2`/`h3` matching BE-001 headings.

## Context

- `frontend/components/elements/response.tsx` — Streamdown `components` map for `h2`, `h3`, etc.
- Optional input from **DESIGN-001**.

## Acceptance criteria

- [ ] Headings used in BE-001 render distinctly from body text (spacing + font weight/size).
- [ ] Dark/light themes remain readable.
- [ ] No regression for messages without structured sections.

## Dependencies

- **BE-001** — section titles and order must be stable before locking styles.
- **DESIGN-001** (optional) — tokens for spacing/color.
