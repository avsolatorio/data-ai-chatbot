---
id: DESIGN-001
repo: vercel-ai-chatbot
title: Design — visual hierarchy and data vs interpretation
status: pending
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

## Deliverables

- [ ] Section title hierarchy (which levels, which weights).
- [ ] Table vs narrative styling intent (borders, background).
- [ ] “How to read” / novice help pattern recommendation.

## Dependencies

- None; can run in parallel with **BE-001**.

## Unblocks

- **FE-005** when ready.
