# GitHub Issues Integration

## Overview

GitHub Issues serve as a team-visible mirror of the task files. The TODO markdown files remain the source of truth — Issues are generated from them, not the other way around.

**Sync direction:** Task file → GitHub Issue (one-way). Never edit an Issue directly and expect it to sync back.

---

## How it works

A GitHub Actions workflow (`.github/workflows/sync-todo-issues.yml`) runs on every push that touches `TODO/*.md` files. It:

1. Detects new, modified, or deleted task files
2. Creates an Issue for new tasks
3. Updates Issue title/body/labels/assignee for modified tasks
4. Closes the Issue when `status: done` or `status: cancelled`
5. Adds a duplicate label and closes when `status: duplicate`
6. Writes the Issue number back into the task file's `github_issue:` field via a follow-up commit

---

## Setup (one-time per repo)

When the user asks to set up GitHub issue sync, or when `github_repo` is present in `tasks.json` but no workflow file exists:

1. Check that `github_repo` is set in `TODO/tasks.json`
2. Generate the workflow file (template below) at `.github/workflows/sync-todo-issues.yml`
3. Generate the sync script at `scripts/sync_github_issues.py` (template below)
4. Commit both files: `ci: add GitHub Issues sync workflow`
5. Tell the user: *"Push this to GitHub and the sync will activate. Make sure the Actions workflow has write permissions to issues (Settings → Actions → General → Workflow permissions → Read and write)."*

---

## GitHub Actions workflow template

```yaml
# .github/workflows/sync-todo-issues.yml
name: Sync TODO tasks to GitHub Issues

on:
  push:
    paths:
      - 'TODO/**.md'
    branches:
      - '**'

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install PyYAML PyGithub

      - name: Sync tasks to issues
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: python scripts/sync_github_issues.py

      - name: Commit issue numbers back to task files
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git diff --quiet TODO/ || (git add TODO/ && git commit -m "ci: update github_issue refs [skip ci]")
          git push
```

---

## Sync script template

```python
#!/usr/bin/env python3
# scripts/sync_github_issues.py
"""Syncs TODO task files with GitHub Issues."""

import os
import re
import yaml
from pathlib import Path
from github import Github

REPO_SLUG = os.environ["GITHUB_REPOSITORY"]
TOKEN = os.environ["GITHUB_TOKEN"]

STATUS_LABELS = {
    "pending": "status:pending",
    "in_progress": "status:in-progress",
    "done": "status:done",
    "cancelled": "status:cancelled",
    "duplicate": "status:duplicate",
}

PRIORITY_LABELS = {
    "high": "priority:high",
    "medium": "priority:medium",
    "low": "priority:low",
}

CLOSED_STATUSES = {"done", "cancelled", "duplicate"}


def parse_task_file(path: Path) -> dict | None:
    """Parse frontmatter + body from a task markdown file."""
    text = path.read_text()
    match = re.match(r"^---\n(.*?)\n---\n(.*)", text, re.DOTALL)
    if not match:
        return None
    frontmatter = yaml.safe_load(match.group(1))
    body = match.group(2).strip()
    return {"frontmatter": frontmatter, "body": body, "path": path}


def build_issue_body(task: dict) -> str:
    fm = task["frontmatter"]
    lines = [task["body"], "", "---", f"*Task file: `{task['path']}`*"]
    if fm.get("depends_on"):
        lines.append(f"*Depends on: {', '.join(fm['depends_on'])}*")
    if fm.get("blocks"):
        lines.append(f"*Blocks: {', '.join(fm['blocks'])}*")
    return "\n".join(lines)


def ensure_labels(repo, labels: list[str]):
    existing = {l.name for l in repo.get_labels()}
    for label in labels:
        if label not in existing:
            color = "0075ca" if label.startswith("status") else "e4e669"
            repo.create_label(name=label, color=color)


def sync_task(repo, task: dict):
    fm = task["frontmatter"]
    task_id = fm.get("id", "")
    status = fm.get("status", "pending")
    priority = fm.get("priority", "medium")
    assignee = fm.get("assignee")
    issue_number = fm.get("github_issue")

    title = f"[{task_id}] {fm.get('title', '')}"
    body = build_issue_body(task)
    labels = [STATUS_LABELS.get(status, ""), PRIORITY_LABELS.get(priority, "")]
    labels = [l for l in labels if l]
    ensure_labels(repo, labels)

    if issue_number:
        issue = repo.get_issue(issue_number)
        issue.edit(
            title=title,
            body=body,
            state="closed" if status in CLOSED_STATUSES else "open",
            labels=labels,
        )
        if assignee:
            issue.edit(assignee=assignee)
    else:
        kwargs = {"title": title, "body": body, "labels": labels}
        if assignee:
            kwargs["assignee"] = assignee
        issue = repo.create_issue(**kwargs)
        if status in CLOSED_STATUSES:
            issue.edit(state="closed")
        # Write issue number back to file
        write_issue_number(task["path"], issue.number)

    print(f"  {task_id} → issue #{issue.number} ({status})")


def write_issue_number(path: Path, number: int):
    text = path.read_text()
    if "github_issue:" in text:
        text = re.sub(r"github_issue: \d+", f"github_issue: {number}", text)
    else:
        text = text.replace("---\n", f"---\ngithub_issue: {number}\n", 1)
    path.write_text(text)


def main():
    g = Github(TOKEN)
    repo = g.get_repo(REPO_SLUG)
    todo_dir = Path("TODO")

    if not todo_dir.exists():
        print("No TODO directory found.")
        return

    task_files = [f for f in todo_dir.glob("*.md") if f.name not in ("README.md", "CROSS-REPO-GRAPH.md")]
    print(f"Found {len(task_files)} task files")

    for path in sorted(task_files):
        task = parse_task_file(path)
        if task and task["frontmatter"].get("id"):
            sync_task(repo, task)


if __name__ == "__main__":
    main()
```

---

## Issue structure

Each Issue created by the sync has:

- **Title:** `[FE-007] Mobile tooltip positioning fix`
- **Body:** Full task markdown body + metadata footer
- **Labels:** `status:pending` / `status:in-progress` / etc., `priority:high` / `priority:medium` / `priority:low`
- **Assignee:** From `assignee:` frontmatter field (must be a GitHub username)
- **State:** Open for active tasks, closed for `done`/`cancelled`/`duplicate`

---

## Sync rules summary

| Task status | Issue state | Issue action |
|-------------|-------------|--------------|
| `pending` | open | Create or update |
| `in_progress` | open | Create or update |
| `done` | closed | Close with comment "Task marked done" |
| `cancelled` | closed | Close with comment "Task cancelled" |
| `duplicate` | closed | Close, add duplicate label |

---

## Manual trigger

To force a sync without waiting for a push:

```bash
GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=org/repo python scripts/sync_github_issues.py
```

Requires `gh` CLI authenticated and `pip install PyYAML PyGithub`.
