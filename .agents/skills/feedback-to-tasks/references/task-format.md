# Task File Format

## Naming convention

```
TODO/{ID}-{kebab-case-title}.md
```

- `{ID}` = `{DOMAIN}-{NUMBER}` (e.g. `FE-007`, `MCP-004`, `PCN-001`)
- `{DOMAIN}` = uppercase prefix registered in this repo's `tasks.json`
- `{NUMBER}` = zero-padded three-digit sequential number within the domain (001, 002, ...)
- `{kebab-case-title}` = short, descriptive slug of the task title (3–6 words)

**Examples:**
- `FE-007-mobile-tooltip-fix.md`
- `BE-002-rate-limit-headers.md`
- `MCP-004-beeswarm-responsiveness.md`

---

## Frontmatter schema

```yaml
---
id: FE-007
repo: vercel-ai-chatbot
title: Short human-readable task title
status: pending
priority: medium
assignee: github-username        # optional
github_issue: 42                 # populated after issue creation, omit if not yet synced
depends_on:                      # hard deps — this task cannot start until these are done
  - BE-001
blocks:                          # hard deps — tasks that cannot start until THIS is done
  - FE-008
soft_depends_on:                 # coordination order only, doesn't block start
  - MCP-002
external_ref: vercel-ai-chatbot/TODO/BE-001-writer-planner-prompts.md  # cross-repo link
related_plan: docs/some-plan.md  # optional pointer to a planning doc
---
```

### Field reference

| Field | Required | Values | Notes |
|-------|----------|--------|-------|
| `id` | yes | `DOMAIN-NNN` | Matches filename prefix |
| `repo` | yes | repo name | Must match `name` in this repo's `tasks.json` |
| `title` | yes | string | Human-readable, title case |
| `status` | yes | `pending` \| `in_progress` \| `done` \| `cancelled` \| `duplicate` | See lifecycle-operations.md |
| `priority` | no | `high` \| `medium` \| `low` | Default `medium` if omitted |
| `assignee` | no | GitHub username | No `@` prefix |
| `github_issue` | no | integer | Issue number in the repo's GitHub |
| `depends_on` | no | list of IDs | Hard dependency — must be `done` before this starts |
| `blocks` | no | list of IDs | Inverse of `depends_on` — always keep in sync |
| `soft_depends_on` | no | list of IDs | Coordination order only, not a hard blocker |
| `external_ref` | no | relative path | Points to a task file in another repo |
| `related_plan` | no | relative path | Pointer to planning/design doc |

**Invariant:** `depends_on` and `blocks` must be mirrors of each other across all task files. If FE-007 lists `depends_on: [BE-001]`, then BE-001 must list `blocks: [FE-007]`. Always update both sides.

---

## Body structure

```markdown
# {ID} — {Title}

## Goal
One to three sentences: what this task accomplishes and why it matters.

## Context
- Relevant file paths (relative to repo root)
- Related components or systems
- Background the implementer needs
- Cross-repo notes if applicable

## Implementation hints
- **Entry point:** `path/to/file.ts` → `functionName()` (line ~42)
- **Current behavior:** brief description of what the code does now
- **Desired behavior:** what it should do instead
- **Test file:** `tests/path/to/file.spec.ts` — add/modify tests here
- **Prior art:** similar pattern at `path/to/similar.ts` worth following
- **Gotchas:** known constraints, backwards-compatibility concerns, things to avoid

## Acceptance criteria
- [ ] First specific, verifiable requirement
- [ ] Second requirement
- [ ] Edge case or error state handled
- [ ] Tests pass: `npm test path/to/relevant.spec.ts`
- [ ] (Add as many as needed — these are the definition of done)

## Out of scope
- Explicit non-goals (prevents scope creep)
- Related items tracked separately (with their IDs)

## Dependencies
- **{ID}** — one-line explanation of the dependency relationship
```

### Section rules

- **Goal** — required. One paragraph, no bullet points.
- **Context** — required. File paths help agents navigate directly. Include component names, function names, relevant docs.
- **Implementation hints** — required for any task involving existing code; optional for greenfield. This is the section that makes a task actionable for a coding agent that has never seen this codebase. Include the specific entry point (file + function), what the code currently does, what it should do, where tests live, and any non-obvious constraints. If you don't know these yet, do the code archaeology (SKILL.md Step 6) before writing the task.
- **Acceptance criteria** — required. Each item must be independently verifiable by a coding agent: runnable test commands, observable UI states, specific API responses. Avoid vague criteria like "it works correctly" — write "the Playwright test at `tests/e2e/tooltip.spec.ts` passes on 390px viewport" instead.
- **Out of scope** — optional but encouraged, especially for tasks that touch shared code.
- **Dependencies** — optional. Only include if `depends_on` or `blocks` is non-empty. Provides human-readable explanation of why the dep exists.

---

## Complete example

```markdown
---
id: FE-007
repo: vercel-ai-chatbot
title: Mobile tooltip positioning fix
status: pending
priority: high
depends_on:
  - BE-001
blocks: []
---

# FE-007 — Mobile tooltip positioning fix

## Goal
Tooltips in the data visualization panel clip off-screen on viewports narrower than 768px.
Fix positioning logic to keep tooltips within the viewport bounds on all screen sizes.

## Context
- Primary file: `frontend/components/viz/Tooltip.tsx`
- Uses Floating UI (`@floating-ui/react`) for positioning
- Tooltip is rendered via `useTooltip` hook in `frontend/hooks/useTooltip.ts`
- Issue reproduced on iPhone 14 Pro (390px), Samsung Galaxy S21 (360px)

## Implementation hints
- **Entry point:** `frontend/hooks/useTooltip.ts` → `calculatePosition()` (line ~38)
- **Current behavior:** `calculatePosition()` returns `{ top, left }` based on trigger bounds without clamping to `window.innerWidth` / `window.innerHeight`, so tooltips overflow on narrow viewports
- **Desired behavior:** clamp the computed position so `left + tooltipWidth <= window.innerWidth` and `top + tooltipHeight <= window.innerHeight`; flip to above trigger when insufficient space below
- **Test file:** `tests/e2e/tooltip.spec.ts` — add viewport-specific test cases at 360px and 390px
- **Prior art:** `frontend/components/Dropdown.tsx` uses a similar viewport-clamp pattern worth following
- **Gotchas:** Floating UI's `shift()` middleware does this automatically — check if it's already imported but not applied before writing new clamping logic

## Acceptance criteria
- [ ] Tooltip stays fully visible at 360px, 390px, and 768px viewport widths
- [ ] Tooltip flips above the trigger element when there's insufficient space below
- [ ] No visible jump/flash when tooltip repositions
- [ ] Existing desktop tooltip behavior unchanged (run `npx playwright test tests/e2e/tooltip.spec.ts`)
- [ ] New viewport test cases added and passing

## Out of scope
- Tooltip animation or styling changes (tracked in DESIGN-002)
- Touch-specific tooltip interactions (no tooltip on tap — out of product scope for now)

## Dependencies
- **BE-001** — tooltip content format depends on the structured response schema finalized in BE-001.
```

---

## README.md template

Each repo's `TODO/README.md` follows this structure (regenerated by `update_index.py`):

```markdown
# {repo-name} — task index

{one-line description of what tasks live here}

**Sibling repos:** {links to peer TODO READMEs}

## Task IDs

| ID | File | Summary |
|----|------|---------|
| BE-001 | [BE-001-...](./BE-001-....md) | One-line summary |
| FE-001 | [FE-001-...](./FE-001-....md) | One-line summary |

## Dependency graph (this repo)

\```mermaid
flowchart TB
  ...
\```

## Cross-repo dependencies

See **[CROSS-REPO-GRAPH.md](./CROSS-REPO-GRAPH.md)** ...

## How to use

1. ...
```

---

## CROSS-REPO-GRAPH.md template

Maintained only in the canonical repo. Regenerated by `update_index.py`.

```markdown
# Cross-repo task dependencies

Tasks live in:
- `{repo-a}/TODO/`
- `{repo-b}/TODO/`

## Combined graph

\```mermaid
flowchart TB
  subgraph repoA [repo_a]
    ...
  end
  subgraph repoB [repo_b]
    ...
  end
  A001 --> B001
  A001 -.->|soft| B002
\```

## Edge reference

| From | To | Relationship |
|------|----|--------------|
| BE-001 | MCP-001 | **Unblocks**: mirror prompt rules after BE-001 |

## Suggested batch order

1. ...
```
