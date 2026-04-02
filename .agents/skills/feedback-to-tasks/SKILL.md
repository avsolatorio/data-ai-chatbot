---
name: feedback-to-tasks
description: >
  This skill is your project task backlog manager — use it any time work needs to be recorded or managed rather than executed.
  Invoke when: someone dumps feedback, complaints, or gaps they want captured before they're forgotten (even if they don't say "create a task");
  when PR reviews, client calls, design comments, or retro notes need to be turned into actionable tasks;
  when task IDs appear and need lifecycle ops (cancel, mark done/duplicate, update dependencies, change priority, assign);
  or when the user queries the task backlog (what's available, what's blocked, how many open, what does X unblock).
  The trigger is intent to track or manage work — not implement it.
  Skip for: writing code, fixing bugs, running tests, or personal non-project todos.
---

# Feedback to Tasks

Converts feedback (in any form) into structured task files, and manages the complete lifecycle of those tasks across multiple repos.

A task file is not just a note — it is a complete work brief that a coding agent can pick up cold and execute without asking follow-up questions. The difference between a useful task and a useless one is specificity: file paths, function names, current behavior vs. desired behavior, and verifiable acceptance criteria.

## Fast mode vs. standard mode

**Fast mode** — skip code archaeology entirely. Use this for:
- All lifecycle operations: status changes, assignments, priority updates, dependency edits, duplicate marking
- Queries: "what can I work on?", "what does X block?", "show in-progress tasks"
- Task updates that don't require new file discovery: adding acceptance criteria, editing context the user already knows
- Feedback that already names the exact file and function involved (e.g. "in `Tooltip.tsx:42`, the position calculation doesn't clamp to viewport bounds")
- Any request the user flags with "quick", "fast", or "skip archaeology"

**Standard mode** — do full code archaeology before writing tasks. Use this for:
- New task creation from vague or symptom-level feedback ("the tooltip is broken on mobile")
- PR review comments where the review references code you haven't confirmed exists
- Planning doc extraction where the relevant code areas need to be located first

When in doubt: **if you already know or have been told which files are involved, skip archaeology**. It exists to find what you don't already know.

---

## Quick reference

| Intent | Mode | Example phrases |
|--------|------|----------------|
| Create from vague feedback | Standard | "the tooltip is broken", "we need dark mode" |
| Create from PR review | Standard | paste of review comments with file references |
| Create with known files | Fast | "in `Tooltip.tsx`, fix the position clamp" |
| Update task | Fast | "add an acceptance criterion to FE-006" |
| Status change | Fast | "mark FE-006 as done", "FE-007 is in progress" |
| Duplicate | Fast | "FE-007 duplicates FE-003" |
| Dependencies | Fast | "FE-008 should wait for BE-002" |
| Assign / priority | Fast | "assign FE-006 to @jsmith", "FE-007 is high priority" |
| Query | Fast | "what can I work on?", "what does MCP-001 block?" |
| GitHub sync setup | Fast | "set up GitHub issue sync for data-ai-chatbot" |

---

## Step 1 — Discover config

Before doing anything, find the config for the current context.

**Search order:**
1. `TODO/tasks.json` in the current working directory
2. Walk up parent directories until `TODO/tasks.json` is found
3. If none found → **first-run setup** (see `references/config-schema.md`)

Once found, resolve environment variables in all paths (e.g. `${DATA360_MCP_PATH}` → actual path).
Read `references/config-schema.md` for the full schema and resolution rules.

---

## Step 2 — Interpret the input

Feedback comes in many forms. Your job is to extract discrete, actionable work items from it.

**From free-form text:**
- Each distinct problem, feature request, or improvement is a separate task
- Group related sub-points into one task's acceptance criteria rather than creating many micro-tasks
- Infer the domain (FE/BE/MCP/etc.) from what's described — UI/UX → FE, API/prompt → BE, MCP server → MCP, design specs → DESIGN
- If the domain is ambiguous, ask once

**From PR review comments:**
- Each review thread that requires a code change becomes a task
- Style nits that are trivially fixed inline don't need tasks
- If the review references an existing task, update that task instead of creating a new one

**From planning docs:**
- Extract explicit deliverables and open questions requiring follow-up
- Note any "out of scope" items the author mentioned — they become tasks too, just lower priority

**From lifecycle commands:**
- These are direct — parse the task ID and operation, execute immediately

---

## Step 3 — Determine affected repos

Map each extracted task to a repo using the `domains` field in each repo's `tasks.json`.

```
FE-*, BE-*, DESIGN-* → data-ai-chatbot
MCP-* → data360-mcp
PCN-* → pcn
```

If a task's domain isn't registered anywhere, ask: *"Domain XYZ isn't registered — which repo does it belong to?"*
Then update the appropriate repo's `tasks.json` before proceeding.

If tasks span multiple repos, group them clearly before writing any files.

---

## Step 4 — Assign IDs

For each new task, run the next-ID script:

```bash
python <skill_dir>/scripts/next_id.py --repo-path <repo_path> --domain <DOMAIN>
```

This scans existing `TODO/*.md` files and returns the next available ID (e.g., `FE-007`).

---

## Step 5 — Detect duplicates and dependencies

Before creating files:

1. **Duplicate check** — scan existing task titles in the target repo. If a new task is substantively similar to an existing one, flag it: *"This looks similar to FE-003 — is it a new task or an addition to that one?"*

2. **Dependency detection** — look for explicit signals in the feedback ("after BE-001 is done", "requires the new prompt structure") and infer implicit ones (e.g., a frontend task that depends on a backend change that's pending). Express these as `depends_on` entries.

3. **Cycle check** — after setting dependencies, run:

```bash
python <skill_dir>/scripts/validate_graph.py --repo-path <repo_path>
```

If a cycle is detected, surface it to the user before writing files.

Read `references/task-format.md` for the complete field schema including `depends_on`, `blocks`, `soft_depends_on`.

---

## Step 6 — Code archaeology (standard mode only)

**Skip this step entirely if you're in fast mode.** Jump straight to Step 7.

For standard mode: before writing the task file, explore the codebase to find the specific files, functions, and patterns involved. A task that says "fix the tooltip" is useless to a coding agent. A task that says "fix `useTooltip.ts:42` — the `calculatePosition()` call doesn't clamp to viewport bounds" is immediately actionable.

**One important check even in fast mode:** if feedback references a specific file path (e.g. from a PR review), quickly verify that file actually exists before writing it into the task. Stale or incorrect file paths are worse than no path — they send the implementing agent on a wild goose chase. If the path doesn't exist, find the real one (this is a single grep, not full archaeology).

**Standard mode — do this for every new task:**

1. **Find the entry point** — search for the component, function, or module the feedback describes. Use grep/glob to locate it. Note the file path and the specific function or class.

2. **Trace one level deeper** — open the file and identify the specific lines or logic involved. What does the current code do? What should it do instead?

3. **Find tests** — search for existing test files that cover this area (e.g., `*.test.ts`, `*.spec.ts`, `__tests__/`). If tests exist, note them — the coding agent needs to know where to add/modify tests.

4. **Find related files** — check imports, callers, and config files that the implementation will need to touch.

5. **Look for prior art** — is there a similar pattern elsewhere in the codebase that the implementer should follow?

Record everything you find in the task's `## Context` and `## Implementation hints` sections. If you can't find the relevant code (e.g., the feedback is about a feature that doesn't exist yet), note where the new code should be added based on existing project structure.

---

## Step 7 — Write task files

For each task, write `TODO/{ID}-{kebab-title}.md` in the appropriate repo.

Read `references/task-format.md` for the exact file format. Key rules:
- YAML frontmatter first, then markdown body
- Acceptance criteria are checkboxes, written so a coding agent can verify them (runnable tests, observable UI behavior, specific API responses — not vague "it works")
- Context section includes specific file paths found in Step 6
- Implementation hints section includes function names, current vs. desired behavior, test locations
- `blocks` must be the inverse of `depends_on` — update both sides when adding a dependency
- For cross-repo dependencies, use `external_ref` pointing to the other repo's task file

---

## Step 8 — Update indexes

After writing task files, update the indexes for each affected repo:

```bash
python <skill_dir>/scripts/update_index.py --repo-path <repo_path>
```

This regenerates:
- `TODO/README.md` — task table + per-repo Mermaid graph
- `TODO/CROSS-REPO-GRAPH.md` in the canonical repo (the one with `"cross_repo_canonical": true`)

If no canonical repo is configured, update cross-repo graphs in all affected repos.

---

## Step 9 — Preview and stage

After all files are written:

1. Run `git diff --stat` and `git diff TODO/` for each affected repo
2. Present a grouped summary:

```
Changes ready to stage:

data-ai-chatbot/
  + TODO/FE-007-mobile-tooltip-fix.md   (new)
  ~ TODO/README.md                       (updated)
  ~ TODO/CROSS-REPO-GRAPH.md            (updated)

data360-mcp/
  + TODO/MCP-004-viz-responsiveness.md  (new)
  ~ TODO/README.md                       (updated)

Review the files above (they're live on disk — edit freely).
Say "commit" when ready, or let me know what to change.
```

3. Wait for user confirmation before staging or committing.

**On "commit":**
```bash
cd <repo_path> && git add TODO/ && git commit -m "tasks: add <ID-list> from <source>"
```
Repeat for each affected repo. Use a descriptive source label (e.g., "PR review #42", "feedback session", "planning doc").

---

## Lifecycle operations

Read `references/lifecycle-operations.md` for the full details on:
- Status transitions (`pending → in_progress → done / cancelled / duplicate`)
- Updating existing tasks (content, acceptance criteria, context)
- Dependency add/remove (always update both sides)
- Duplicate handling (link to canonical task, update status)
- Assignment and priority changes
- Querying available work ("what can I start?")

---

## GitHub Issues sync

Read `references/github-integration.md` for setup instructions and sync rules.

The short version: the skill generates a GitHub Actions workflow (`.github/workflows/sync-todo-issues.yml`) for each repo once. After that, every push that modifies `TODO/*.md` files automatically creates/updates/closes GitHub Issues to match the task files — no manual steps required.

---

## Reference files

| File | When to read |
|------|-------------|
| `references/config-schema.md` | First-run setup, config fields, env var resolution |
| `references/task-format.md` | Writing or reading any task file |
| `references/lifecycle-operations.md` | Any operation other than plain creation |
| `references/github-integration.md` | Setting up or debugging GitHub issue sync |
