# Lifecycle Operations

## Status model

```
pending → in_progress → done
                      → cancelled
                      → duplicate
```

- `pending` — not yet started
- `in_progress` — actively being worked on (only one developer should have a task in this state at a time)
- `done` — all acceptance criteria met and verified
- `cancelled` — decided not to do; leave the file (don't delete) so history is preserved
- `duplicate` — superseded by another task; add `duplicate_of: {ID}` to frontmatter

Backward transitions are allowed (e.g. `in_progress → pending` if work is deferred). Update the file and commit.

---

## Create

Standard creation flow is covered in SKILL.md steps 4–8. Additional rules:

- Never reuse an ID even if its task is `cancelled` or `duplicate`
- When creating a batch of tasks from one feedback session, create them all before committing — a single commit per session is cleaner than one commit per task
- If feedback is vague, err toward creating one task with broad acceptance criteria and a note to refine, rather than blocking on clarification. Add `priority: low` if confidence is low.

**Priority rules — always set this field explicitly:**

| Signal in feedback | Priority |
|-------------------|----------|
| Crash, data loss, security issue, "unusable", "broken" | `high` |
| Missing feature, degraded UX, performance issue | `medium` |
| Polish, nit, rename, cosmetic improvement | `low` |
| Unclear / speculative | `low` |

Default to `medium` when in doubt. Never omit the field — an agent scanning for what to work on next uses priority to decide.

---

## Update existing task

When updating content (not status):

1. Read the current task file
2. Make the change (add/modify acceptance criteria, update context, change priority/assignee)
3. Do NOT change the `id` or `repo` fields
4. Commit with message: `tasks: update {ID} — {brief description of change}`

Common update triggers:
- "Add an acceptance criterion to FE-006 for keyboard navigation" → append to `## Acceptance criteria`
- "FE-007 is actually low priority" → change `priority:` in frontmatter
- "Assign MCP-003 to @jsmith" → add/update `assignee:` in frontmatter
- "The context for BE-001 should mention the new rate limiter" → update `## Context`

---

## Status transitions

### Mark done
```
status: done
```
- Tick all acceptance criteria checkboxes that are done: `- [x]`
- Check `blocks` — notify the user which tasks are now unblocked: *"FE-005 and MCP-001 are now unblocked."*
- Run `update_index.py` to regenerate README (done tasks can be shown as ~~strikethrough~~ or removed from the active table — follow the repo's existing convention)
- Commit: `tasks: done {ID} — {title}`

### Mark in_progress
```
status: in_progress
```
- Check `depends_on` — if any dep is not `done`, warn: *"FE-007 depends on BE-001 which is still `pending`. Proceed anyway?"*
- Commit: `tasks: start {ID}`

### Cancel
```
status: cancelled
```
- Add a `## Cancellation note` section explaining why
- Update any tasks in `blocks` — they may now be unblocked or need their `depends_on` updated
- Commit: `tasks: cancel {ID} — {reason}`

### Mark duplicate
```
status: duplicate
duplicate_of: FE-003
```
- Add `## Duplicate note` section: *"Superseded by FE-003 which covers the same requirement."*
- Check if this task has any unique acceptance criteria not in the canonical task — if so, add them to the canonical task
- Update any tasks that `depends_on` this one — redirect them to the canonical task
- Commit: `tasks: duplicate {ID} → {canonical ID}`

---

## Dependency management

### Add a dependency

"FE-008 should wait for BE-002":
1. Read FE-008 frontmatter, add `BE-002` to `depends_on`
2. Read BE-002 frontmatter, add `FE-008` to `blocks`
3. Run `validate_graph.py` to check for cycles
4. Run `update_index.py` to regenerate graphs
5. Commit both files together

### Remove a dependency

Same as above but remove from both sides. Explain why in the commit message.

### Soft dependency

"MCP-003 should probably come after MCP-002 but doesn't have to":
- Use `soft_depends_on` instead of `depends_on`
- Does NOT appear in the hard-dep graph
- Shows as a dashed edge in the Mermaid graph (`-.->`)
- No need to mirror on the other side

### Cross-repo dependency

When a task in repo A depends on a task in repo B:
1. Add the foreign ID to `depends_on` in repo A's task (e.g. `depends_on: [BE-001]`)
2. Add `external_ref` pointing to the task file in repo B
3. In repo B's task, add repo A's task ID to `blocks`
4. Update `CROSS-REPO-GRAPH.md` in the canonical repo
5. Commit both repos

### Cycle detection

`validate_graph.py` checks all tasks in a repo (plus cross-repo links if peer paths are resolved).
If a cycle is found, it prints the cycle path and refuses to proceed. Fix the cycle before committing.

---

## Querying tasks

### "What can I work on?"
List tasks where:
- `status` is `pending`
- All `depends_on` items are `done`

Sort by `priority` (high → medium → low), then by ID.
Show assignee if set, highlight unassigned tasks.

### "What tasks are in progress?"
List all tasks with `status: in_progress` across all known repos.

### "What does {ID} block?"
Read the task's `blocks` list. For each blocked task, show its title and status.

### "What's the critical path?"
Find the longest chain of hard dependencies in the combined graph. Tasks on the critical path should be prioritized.

### "What's assigned to @{username}?"
Scan all task files across repos for `assignee: {username}` where status is not `done` or `cancelled`.

### "Show me all tasks for {repo}"
List all tasks in that repo's TODO directory, grouped by status.

---

## Multi-developer conventions

To avoid conflicts:
- When starting a task, immediately update `status: in_progress` and commit — this signals to teammates
- Only one developer should have a given task `in_progress` at a time
- If two developers need to work on the same area, split the task or coordinate explicitly
- Use `assignee` to prevent accidental double-work on tasks that look similar

When a new developer joins:
1. Point them to `TODO/README.md` for an overview
2. Run the "what can I work on?" query for them
3. They claim a task by setting `status: in_progress` and `assignee: their-username`, committing immediately
