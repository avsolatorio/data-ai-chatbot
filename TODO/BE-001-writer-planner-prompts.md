---
id: BE-001
repo: vercel-ai-chatbot
title: Writer and Planner prompts — response structure, links, viz nudges
status: pending
depends_on: []
blocks:
  - FE-005
  - MCP-001
related_plan: .cursor/plans or UX feedback backlog (section Phase 1 / Phase 3 planner nudge)
---

# BE-001 — Writer and Planner prompts

## Goal

Align model output with the agreed structure: **Summary** → optional **Visualization** (markdown link) → **Source & data** → **Analysis** → **Notes** → **How to read** (optional) → **Suggested follow-ups**; reinforce markdown links for API/indicator URLs; add Planner guidance to prefer `data360_get_viz_spec` when data shape fits time-series/comparisons.

## Context

- Primary file: `backend/app/ai/prompts.py` — functions `get_system_prompt`, `get_thinking_system_prompt`.
- Chat wiring: `backend/app/api/v1/chat.py` (`get_combined_system_prompt`, etc.).
- Cross-repo: after this change, `data360-mcp` task **MCP-001** should mirror non-duplicative bullets into `SYSTEM_PROMPT` so drift is minimized.

## Acceptance criteria

- [ ] Writer (`get_system_prompt`) documents the section order with `**...**` headings; omits unused sections but keeps order when present.
- [ ] Writer requires clickable markdown for data/API/indicator references where applicable.
- [ ] Planner (`get_thinking_system_prompt`) explicitly nudges `data360_get_viz_spec` for suitable time-series/multi-entity cases (without contradicting existing tool-loop rules).
- [ ] Existing behaviors (claims/PCN, suggested follow-ups heading, direct API section) remain consistent unless intentionally revised.

## Out of scope

- Changes inside `data360-mcp` (tracked as MCP-001).
