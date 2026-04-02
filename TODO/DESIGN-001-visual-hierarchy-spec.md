---
id: DESIGN-001
repo: vercel-ai-chatbot
title: Design — visual hierarchy and data vs interpretation
status: pending
priority: low
depends_on: []
blocks:
  - FE-005
---

# DESIGN-001 — Visual hierarchy spec (design pass)

## Goal

Produce lightweight specs: typography scale for section titles, spacing, optional icons, distinction between **raw data** (tables/numbers) vs **interpretation** (analysis paragraphs).

## Context

- Informs **FE-005** and optionally chart/table chrome in message rendering.
- Not implementation-only: may be a short doc + Figma-free checklist.

## Implementation hints
- **Design token file:** `frontend/app/globals.css` — CSS custom properties defined at lines 34–77 (light) and lines 143–177 (dark). No heading size/weight tokens exist yet.
- **Typography:** `@tailwindcss/typography` plugin loaded (globals.css line 31). Fonts: `--font-sans: Figtree`, `--font-mono: Geist Mono` (lines 180–233).
- **Existing component tokens:** `--chart-2` (Data border), `--chart-4` (Analysis border), `--muted-foreground` (Note border) — already used in ResponseParagraph. New heading tokens should harmonize with these.
- **Current gaps:** No `--font-size-*`, `--font-weight-*`, or `--line-height-*` tokens. No semantic color tokens beyond `--destructive`. Heading hierarchy in `.response-markdown` is fully unstyled (relies on browser defaults).
- **Output format:** Deliver as a markdown spec file (no Figma required). Should define: 3-level heading scale (h2, h3, h4), body/caption/label sizes, spacing multipliers, and recommended Tailwind class equivalents so FE-005 implementer can copy-paste.
- **Gotchas:** Dark mode requires duplicate token definitions in `.dark {}` selector. Tailwind prose classes don't apply outside `.prose` wrapper — spec must account for this. Avoid tokens that conflict with shadcn/ui conventions already in globals.css.

## Deliverables

- [ ] Section title hierarchy (which levels, which weights).
- [ ] Table vs narrative styling intent (borders, background).
- [ ] “How to read” / novice help pattern recommendation.

## Dependencies

- None; can run in parallel with **BE-001**.

## Unblocks

- **FE-005** when ready.
