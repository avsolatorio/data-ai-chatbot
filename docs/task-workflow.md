# Task workflow — developer guide

This document describes how engineering tasks are tracked, managed, and synced to GitHub Issues in this project. It covers the full lifecycle from capturing feedback to closing a task, the multi-repo setup, and the design decisions behind the system.

---

## Overview

Tasks live as Markdown files in each repo's `TODO/` directory. A file like `TODO/FE-007-mobile-keyboard-input-layout.md` is the single source of truth for a piece of work — its frontmatter carries machine-readable metadata (status, priority, dependencies) and its body carries everything a developer or coding agent needs to execute the work cold.

GitHub Issues are a downstream mirror, kept in sync automatically by a GitHub Actions workflow whenever `TODO/` files change. You never edit an Issue directly — the file is authoritative.

The whole system is managed via the **feedback-to-tasks** agent skill, which handles everything from capturing raw feedback to lifecycle operations (status changes, dependencies, queries).

---

## Repo layout

Three repos participate:

| Repo | Task domain(s) | Canonical |
|------|---------------|-----------|
| `data-ai-chatbot` (this repo) | `FE-*`, `BE-*`, `DESIGN-*` | Yes — hosts the cross-repo dependency graph |
| `data360-mcp` | `MCP-*` | — |
| `pcn` | `PCN-*` | — |

Each repo has:

```
TODO/
  tasks.json          ← repo identity + peer paths (env vars, not hardcoded)
  README.md           ← auto-generated task table + Mermaid dependency graph
  CROSS-REPO-GRAPH.md ← combined graph (canonical repo only)
  FE-001-*.md         ← one file per task
  FE-002-*.md
  ...
```

The `tasks.json` config uses environment variable references for cross-repo paths so they resolve correctly on any machine:

```json
{
  "name": "data-ai-chatbot",
  "domains": ["FE", "BE", "DESIGN"],
  "cross_repo_canonical": true,
  "peers": {
    "data360-mcp": "${DATA360_MCP_PATH}",
    "pcn": "${PCN_PATH}"
  }
}
```

Set `DATA360_MCP_PATH` and `PCN_PATH` in your shell (or `.env.local`) to the local paths of those repos.

---

## Task file anatomy

Every task file has two parts: YAML frontmatter and a Markdown body.

```markdown
---
id: FE-007
repo: vercel-ai-chatbot
title: Mobile — keyboard pushes input behind itself
status: pending
priority: high
depends_on: []
blocks: []
assignee: avsolatorio
---

# FE-007 — Mobile keyboard input layout

## Goal
...

## Context
...

## Implementation hints
- **Entry point:** `frontend/components/chat-panel.tsx:89` — ...
- **Current behavior:** ...
- **Desired behavior:** ...
- **Test file:** `frontend/tests/e2e/chat-panel.spec.ts`
- **Gotchas:** ...

## Acceptance criteria
- [ ] Input stays above the keyboard on iOS Safari at 390px viewport
- [ ] No regressions on desktop
```

The `## Implementation hints` section is the critical piece for agent-driven work — it gives specific file paths, function names, line numbers, current vs desired behavior, and known gotchas. A coding agent can pick up a task cold without any follow-up questions.

### Frontmatter fields

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Unique across the repo (e.g. `FE-007`) |
| `repo` | Yes | Repo name from `tasks.json` |
| `title` | Yes | Short human-readable summary |
| `status` | Yes | `pending` / `in_progress` / `done` / `cancelled` / `duplicate` |
| `priority` | Yes | `high` / `medium` / `low` — never omit |
| `depends_on` | Yes | List of IDs that must be `done` first. Empty list `[]` if none |
| `blocks` | Yes | Inverse mirror of `depends_on` entries elsewhere. Empty list `[]` if none |
| `assignee` | No | GitHub username |
| `soft_depends_on` | No | Coordination-only ordering hint (doesn't block execution) |
| `github_issue` | No | Auto-written by the sync workflow after issue creation |
| `duplicate_of` | No | Set when `status: duplicate` |

### Priority rules

| Signal | Priority |
|--------|----------|
| Crash, data loss, security issue, "unusable", "broken" | `high` |
| Missing feature, degraded UX, performance issue | `medium` |
| Polish, nit, rename, cosmetic improvement | `low` |

---

## Dependency model

Dependencies are expressed as hard or soft edges between task IDs.

**Hard dependency** (`depends_on` / `blocks`): task B cannot start until task A is `done`. Always mirrored — if A `blocks: [B]`, then B `depends_on: [A]`. Run `validate_graph.py` to check for cycles and mirror inconsistencies.

**Soft dependency** (`soft_depends_on`): recommended ordering only. Does not block execution, does not need mirroring. Shows as a dashed edge in the Mermaid graph.

**Cross-repo dependency**: expressed the same way but uses an `external_ref` field pointing to the task file in the other repo. The canonical repo (`data-ai-chatbot`) maintains a `CROSS-REPO-GRAPH.md` showing all edges across all repos.

---

## Status lifecycle

```
pending → in_progress → done
                      → cancelled
                      → duplicate
```

Backward transitions are allowed (e.g. `in_progress → pending` if work is deferred).

When marking a task `done`: tick all acceptance criteria checkboxes, check the `blocks` list for newly unblocked tasks, and run `update_index.py` to regenerate the README.

When cancelling: leave the file (don't delete) and add a `## Cancellation note` section explaining why.

---

## Using the feedback-to-tasks skill

The skill is bundled in this repo at `.agents/skills/feedback-to-tasks/` and is automatically available in Cursor and any Claude Code session in this directory.

### Creating tasks from feedback

Paste any form of feedback — free-form description, PR review comments, planning doc extract — and the skill will:

1. Extract discrete work items
2. Map each to the right repo by domain
3. Assign the next available ID
4. Check for duplicates against existing tasks
5. Do code archaeology (find specific files, functions, line numbers)
6. Write the task files with full `## Implementation hints`
7. Show a preview diff and wait for your confirmation before committing

**Fast mode** — used automatically for lifecycle operations (status changes, dependency edits, queries) and for feedback that already names exact files. Skips code archaeology.

**Standard mode** — used for vague or symptom-level feedback ("the tooltip is broken on mobile"). Does full code archaeology before writing the task.

### Common operations

```
# Create tasks from feedback
"the CSV export is dropping null values — track this"

# Lifecycle
"FE-007 is in progress"
"FE-007 is done"
"cancel FE-009 — out of scope this sprint"

# Dependencies
"FE-010 depends on BE-003 finishing first"

# Queries
"what can I work on right now?"
"what does BE-001 block?"
"show me all in-progress tasks"

# Assign / priority
"assign BE-002 to @marcos, bump to high priority"
```

### Claiming a task

When you start a task, immediately update its status and commit — this prevents teammates from double-picking the same task:

```bash
# Edit the file: status: in_progress, assignee: your-username
git add TODO/FE-007-mobile-keyboard-input-layout.md
git commit -m "tasks: start FE-007"
```

---

## Index regeneration

The `README.md` and `CROSS-REPO-GRAPH.md` files in `TODO/` are auto-generated. Never edit them manually — your changes will be overwritten.

Regenerate after any batch of task changes:

```bash
# data-ai-chatbot
python ~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/feedback-to-tasks/scripts/update_index.py \
  --repo-path /path/to/vercel-ai-chatbot \
  --peer-paths '{"data360-mcp": "/path/to/data360-mcp"}'

# data360-mcp
python ~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/feedback-to-tasks/scripts/update_index.py \
  --repo-path /path/to/data360-mcp \
  --peer-paths '{"data-ai-chatbot": "/path/to/vercel-ai-chatbot"}'
```

The skill does this automatically at the end of each session.

---

## GitHub Issues sync

Issues are a team-visible mirror of the task files. Push to any branch, and if `TODO/*.md` files changed, the sync workflow runs automatically.

**What happens:**

1. New task file → creates a GitHub Issue titled `[FE-007] Mobile keyboard input layout`
2. Modified task → updates the issue title, body, labels, assignee
3. `status: done` or `cancelled` → closes the issue
4. `status: duplicate` → closes with a duplicate label
5. Issue number written back into the task file's `github_issue:` frontmatter field (via a `[skip ci]` commit so it doesn't loop)

**Labels created automatically:** `status:pending`, `status:in-progress`, `status:done`, `status:cancelled`, `status:duplicate`, `priority:high`, `priority:medium`, `priority:low`

**Performance:** The sync is incremental — it diffs `HEAD~1..HEAD` and only processes task files touched in the current push. On first push (no history to diff) it falls back to a full sync.

### Setup (one-time per repo)

1. Set `github_repo` in `TODO/tasks.json`:
   ```json
   { "github_repo": "your-org/your-repo" }
   ```
2. Ask the skill: *"Set up GitHub issue sync for data-ai-chatbot"*
3. It generates `.github/workflows/sync-todo-issues.yml` and `scripts/sync_github_issues.py`
4. Push and enable: **Settings → Actions → General → Workflow permissions → Read and write**

### Manual trigger

```bash
GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=org/repo \
  python scripts/sync_github_issues.py
```

---

## Validation scripts

Three scripts ship with the skill and can be run locally:

```bash
SKILL=~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/feedback-to-tasks

# Get next available ID for a domain
python $SKILL/scripts/next_id.py --repo-path . --domain FE

# Validate dependency graph (cycle detection + mirror consistency)
python $SKILL/scripts/validate_graph.py --repo-path . \
  --peer-paths '{"data360-mcp": "/path/to/data360-mcp"}'

# Regenerate README + Mermaid graph
python $SKILL/scripts/update_index.py --repo-path . \
  --peer-paths '{"data360-mcp": "/path/to/data360-mcp"}'
```

---

## Design decisions

**Why files, not a database or project management tool?**
Task files live in the repo, travel with branches, participate in code review, and are readable by coding agents without any API integration. A task that references `frontend/components/chat-panel.tsx:89` is always co-located with the code it describes. Merging a feature branch that resolves a task also merges the `status: done` update.

**Why one-way sync to GitHub Issues?**
Issues are for visibility and team communication — they're where non-engineers look, where stakeholders comment, and where the dependency graph is public. But they're a poor editing interface for structured metadata. Keeping the file as the source of truth means the dependency graph, priority, and archaeology notes are always correct, even if someone closes an issue manually or edits its title.

**Why per-repo `tasks.json` with env var paths?**
Hardcoding absolute paths in config breaks on every machine. User-specific config files (in `~/.claude/`) don't travel with the repo. Per-repo config with env var references resolves correctly on any developer's machine and in CI, requires only that each developer sets two env vars once.

**Why `## Implementation hints` is non-optional?**
A task without specific file paths and function names is a note, not a work brief. An agent given only "fix the scroll behavior" will spend half its compute doing archaeology that the task creator could have done once. The skill enforces archaeology at task creation time so every subsequent actor (human or agent) can start immediately.

**Why cross-repo canonical in data-ai-chatbot?**
The chatbot is the integration point — MCP tools feed into it, PCN data flows through it. Cross-repo dependencies (e.g. BE-001 blocks MCP-001) exist because the chatbot's prompt changes must be mirrored into the MCP system prompt. Having one repo own the combined graph makes the critical path visible in one place.

**Why not GitHub Projects / Linear / Jira?**
Those tools are good for human-driven workflows with lots of UI. This system is optimized for agent-driven execution: the task file is a machine-readable spec that an agent reads directly, executes against, and updates. No API calls to external services, no authentication setup per developer, no rate limits. The tradeoff is that there's no native Gantt chart or time-tracking — both of which are out of scope for this use case.
