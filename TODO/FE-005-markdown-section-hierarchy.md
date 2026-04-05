---
github_issue: 94
id: FE-005
repo: vercel-ai-chatbot
title: Markdown — visual hierarchy for section headings
status: pending
priority: medium
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

## Implementation hints
- **Entry point:** `frontend/components/elements/response.tsx` — `streamdownClassName` at line 77, and `ResponseParagraph` component lines 95–131.
- **Current heading styles:** No explicit h2/h3 overrides. Headings inherit from `@tailwindcss/typography` plugin (globals.css line 31) or browser defaults. No custom heading size/weight tokens defined.
- **CSS file:** `frontend/app/globals.css` — add heading overrides in the `.response-markdown` block (currently lines 8–24 handle list fallbacks only).
- **Approach:** Extend `streamdownClassName` with Tailwind arbitrary selectors, e.g. `[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-medium`. OR add CSS rules to globals.css under `.response-markdown h2 { ... }`.
- **Existing visual markers:** `ResponseParagraph` (lines 95–131) adds left-border color per section label (`border-l-chart-2` for Data, `border-l-chart-4` for Analysis, `border-l-muted-foreground` for Note). Heading hierarchy should complement these markers, not compete.
- **Design tokens available:** `--chart-2`, `--chart-4`, `--muted-foreground`, `--border` (globals.css lines 34–77). No heading-specific tokens yet — DESIGN-001 should define them first.
- **Test file:** No heading-specific tests. Add visual regression snapshot or Playwright assertion on heading font-weight/size.
- **Gotchas:** `@source` directive in globals.css line 5 auto-includes Streamdown utility classes — may conflict with custom heading overrides. Typography plugin prose classes only apply inside `.prose` wrapper, which `response-markdown` is NOT. Must add heading styles directly to `.response-markdown` selector.

## Acceptance criteria

- [ ] Headings used in BE-001 render distinctly from body text (spacing + font weight/size).
- [ ] Dark/light themes remain readable.
- [ ] No regression for messages without structured sections.

## Dependencies

- **BE-001** — section titles and order must be stable before locking styles.
- **DESIGN-001** (optional) — tokens for spacing/color.
