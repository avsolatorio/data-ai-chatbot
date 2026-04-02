#!/usr/bin/env python3
"""
Regenerates TODO/README.md and (if canonical) CROSS-REPO-GRAPH.md for a repo.

Usage:
    python update_index.py --repo-path /path/to/repo
    python update_index.py --repo-path /path/to/repo --peer-paths '{"data360-mcp": "/path/to/data360-mcp"}'

The script reads all task files in TODO/, rebuilds the task table and Mermaid graph,
and rewrites README.md in place. If this repo is marked cross_repo_canonical in
tasks.json, it also regenerates CROSS-REPO-GRAPH.md.
"""

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install PyYAML", file=sys.stderr)
    sys.exit(1)


SKIP_FILES = {"README.md", "CROSS-REPO-GRAPH.md", "tasks.json"}
STATUS_ICON = {
    "pending": "",
    "in_progress": "🔄 ",
    "done": "✅ ",
    "cancelled": "~~",
    "duplicate": "~~",
}


def parse_task_file(path: Path) -> dict | None:
    text = path.read_text()
    match = re.match(r"^---\n(.*?)\n---\n?(.*)", text, re.DOTALL)
    if not match:
        return None
    try:
        fm = yaml.safe_load(match.group(1))
    except yaml.YAMLError:
        return None
    if not fm or "id" not in fm:
        return None

    # Extract one-line summary from Goal section
    body = match.group(2)
    goal_match = re.search(r"##\s+Goal\s*\n+(.*?)(?:\n##|\Z)", body, re.DOTALL)
    summary = ""
    if goal_match:
        summary = goal_match.group(1).strip().split("\n")[0].strip()
        summary = re.sub(r"\*\*(.+?)\*\*", r"\1", summary)  # strip bold
        if len(summary) > 80:
            summary = summary[:77] + "..."

    fm["_summary"] = summary
    fm["_path"] = path
    return fm


def load_tasks(repo_path: Path) -> list[dict]:
    todo_dir = repo_path / "TODO"
    if not todo_dir.exists():
        return []
    tasks = []
    for f in sorted(todo_dir.glob("*.md")):
        if f.name in SKIP_FILES:
            continue
        t = parse_task_file(f)
        if t:
            tasks.append(t)
    return tasks


def load_config(repo_path: Path) -> dict:
    config_path = repo_path / "TODO" / "tasks.json"
    if config_path.exists():
        return json.loads(config_path.read_text())
    return {"name": repo_path.name, "domains": []}


def mermaid_id(task_id: str) -> str:
    return task_id.replace("-", "")


def build_local_mermaid(tasks: list[dict]) -> str:
    lines = ["flowchart TB"]
    active = [t for t in tasks if t.get("status") not in ("cancelled", "duplicate")]

    for t in active:
        mid = mermaid_id(t["id"])
        label = f"{t['id']} {t.get('title', '')[:30]}"
        lines.append(f"  {mid}[\"{label}\"]")

    for t in active:
        src = mermaid_id(t["id"])
        for dep in (t.get("depends_on") or []):
            # Only include local deps
            if any(x["id"] == dep for x in active):
                lines.append(f"  {mermaid_id(dep)} --> {src}")
        for soft in (t.get("soft_depends_on") or []):
            if any(x["id"] == soft for x in active):
                lines.append(f"  {mermaid_id(soft)} -.-> {src}")

    return "\n".join(lines)


def build_cross_repo_mermaid(all_tasks_by_repo: dict[str, list[dict]], configs: dict[str, dict]) -> str:
    lines = ["flowchart TB"]

    # Subgraphs per repo
    for repo_name, tasks in all_tasks_by_repo.items():
        safe_name = repo_name.replace("-", "_")
        lines.append(f"  subgraph {safe_name} [{repo_name}]")
        active = [t for t in tasks if t.get("status") not in ("cancelled", "duplicate")]
        for t in active:
            mid = mermaid_id(t["id"])
            label = f"{t['id']} {t.get('title', '')[:25]}"
            lines.append(f"    {mid}[\"{label}\"]")
        lines.append("  end")

    # All cross-repo edges
    all_tasks_flat = {t["id"]: t for tasks in all_tasks_by_repo.values() for t in tasks}
    seen_edges = set()

    for task_id, t in all_tasks_flat.items():
        src = mermaid_id(task_id)
        for dep in (t.get("depends_on") or []):
            if dep in all_tasks_flat:
                edge = (mermaid_id(dep), src)
                if edge not in seen_edges:
                    seen_edges.add(edge)
                    lines.append(f"  {edge[0]} --> {edge[1]}")
        for soft in (t.get("soft_depends_on") or []):
            if soft in all_tasks_flat:
                label = "shared code"
                edge = (mermaid_id(soft), src, label)
                key = (mermaid_id(soft), src)
                if key not in seen_edges:
                    seen_edges.add(key)
                    lines.append(f"  {mermaid_id(soft)} -.->|\"{label}\"| {src}")

    return "\n".join(lines)


def build_readme(repo_name: str, tasks: list[dict], config: dict, peer_configs: dict) -> str:
    active = [t for t in tasks if t.get("status") not in ("cancelled", "duplicate")]
    done = [t for t in tasks if t.get("status") == "done"]

    peers_line = ""
    if config.get("peers"):
        peer_links = []
        for peer_name in config["peers"]:
            peer_links.append(f"[{peer_name}/TODO](../{peer_name}/TODO/README.md)")
        peers_line = f"\n**Sibling repos:** {', '.join(peer_links)}\n"

    # Task table
    table_rows = []
    for t in sorted(tasks, key=lambda x: x["id"]):
        status = t.get("status", "pending")
        icon = STATUS_ICON.get(status, "")
        fname = t["_path"].name
        tid = t["id"]
        summary = t.get("_summary", "")
        if status in ("cancelled", "duplicate"):
            table_rows.append(f"| ~~{tid}~~ | [{fname}](./{fname}) | ~~{summary}~~ |")
        else:
            table_rows.append(f"| {icon}{tid} | [{fname}](./{fname}) | {summary} |")

    table = "| ID | File | Summary |\n|----|------|---------|"
    if table_rows:
        table += "\n" + "\n".join(table_rows)

    # Mermaid graph
    mermaid = build_local_mermaid(active)

    cross_repo_section = ""
    if config.get("cross_repo_canonical"):
        cross_repo_section = "\n## Cross-repo dependencies\n\nSee **[CROSS-REPO-GRAPH.md](./CROSS-REPO-GRAPH.md)** for edges across all sibling repos and suggested execution order.\n"

    stats = f"{len(active)} active"
    if done:
        stats += f", {len(done)} done"

    return f"""# {repo_name} — task index

Agent-oriented work items. Each task is a standalone `.md` file with context, acceptance criteria, and dependency metadata. ({stats})
{peers_line}
## Task IDs

{table}

## Dependency graph (this repo)

```mermaid
{mermaid}
```
{cross_repo_section}
## How to use

1. Point an agent at `TODO/` or a specific task file.
2. Check `depends_on` in the task frontmatter before starting — all hard deps must be `done`.
3. Claim a task by setting `status: in_progress` and committing immediately.
4. After completing a task, set `status: done`, tick acceptance criteria checkboxes, and check `blocks` for newly unblocked tasks.
"""


def build_cross_repo_graph(all_tasks_by_repo: dict, configs: dict) -> str:
    repo_list = "\n".join(f"- `{name}/TODO/`" for name in all_tasks_by_repo)
    mermaid = build_cross_repo_mermaid(all_tasks_by_repo, configs)

    # Build edge reference table
    all_tasks_flat = {t["id"]: (repo, t) for repo, tasks in all_tasks_by_repo.items() for t in tasks}
    edge_rows = []
    seen = set()
    for task_id, (repo, t) in sorted(all_tasks_flat.items()):
        for dep in (t.get("depends_on") or []):
            key = (dep, task_id)
            if key not in seen and dep in all_tasks_flat:
                seen.add(key)
                edge_rows.append(f"| {dep} | {task_id} | **Unblocks** |")
        for soft in (t.get("soft_depends_on") or []):
            key = (f"soft_{soft}", task_id)
            if key not in seen and soft in all_tasks_flat:
                seen.add(key)
                edge_rows.append(f"| {soft} | {task_id} | **Soft order** (shared code) |")

    edge_table = "| From | To | Relationship |\n|------|----|--------------|\n"
    if edge_rows:
        edge_table += "\n".join(edge_rows)
    else:
        edge_table += "| — | — | No cross-repo edges yet |"

    # Suggested batch order (topological sort by depth)
    order = topological_order(all_tasks_flat)
    order_lines = []
    for i, batch in enumerate(order, 1):
        ids = ", ".join(sorted(batch))
        repos = ", ".join(sorted({all_tasks_flat[t][0] for t in batch if t in all_tasks_flat}))
        order_lines.append(f"{i}. **{ids}** ({repos})")

    order_section = "\n".join(order_lines) if order_lines else "1. All tasks are independent."

    return f"""# Cross-repo task dependencies

Tasks live in:
{repo_list}

## Combined graph

```mermaid
{mermaid}
```

## Edge reference

{edge_table}

## Suggested batch order

{order_section}
"""


def topological_order(all_tasks_flat: dict) -> list[set[str]]:
    """Returns tasks grouped into batches (each batch can run in parallel)."""
    in_degree = defaultdict(int)
    graph = defaultdict(set)

    for task_id, (_, t) in all_tasks_flat.items():
        for dep in (t.get("depends_on") or []):
            if dep in all_tasks_flat:
                graph[dep].add(task_id)
                in_degree[task_id] += 1
        if task_id not in in_degree:
            in_degree[task_id] = 0

    batches = []
    remaining = set(all_tasks_flat.keys())

    while remaining:
        batch = {t for t in remaining if in_degree[t] == 0}
        if not batch:
            break  # cycle — stop
        batches.append(batch)
        for t in batch:
            remaining.remove(t)
            for successor in graph[t]:
                in_degree[successor] -= 1

    return batches


def main():
    parser = argparse.ArgumentParser(description="Regenerate TODO index files")
    parser.add_argument("--repo-path", required=True, help="Path to repo root")
    parser.add_argument("--peer-paths", default="{}", help="JSON map of peer repo name → path")
    args = parser.parse_args()

    repo_path = Path(args.repo_path)
    peer_paths = json.loads(args.peer_paths)

    config = load_config(repo_path)
    repo_name = config.get("name", repo_path.name)
    tasks = load_tasks(repo_path)

    # Load peer configs
    peer_configs = {}
    for peer_name, peer_path_str in peer_paths.items():
        peer_configs[peer_name] = load_config(Path(peer_path_str))

    # Regenerate README.md
    readme_content = build_readme(repo_name, tasks, config, peer_configs)
    readme_path = repo_path / "TODO" / "README.md"
    readme_path.write_text(readme_content)
    print(f"Updated {readme_path}")

    # Regenerate CROSS-REPO-GRAPH.md (canonical repo only)
    if config.get("cross_repo_canonical") and peer_paths:
        all_tasks_by_repo = {repo_name: tasks}
        for peer_name, peer_path_str in peer_paths.items():
            peer_tasks = load_tasks(Path(peer_path_str))
            all_tasks_by_repo[peer_name] = peer_tasks

        all_configs = {repo_name: config, **peer_configs}
        cross_content = build_cross_repo_graph(all_tasks_by_repo, all_configs)
        cross_path = repo_path / "TODO" / "CROSS-REPO-GRAPH.md"
        cross_path.write_text(cross_content)
        print(f"Updated {cross_path}")

        # Also update cross-repo graph pointers in peer repos
        for peer_name, peer_path_str in peer_paths.items():
            peer_cross = Path(peer_path_str) / "TODO" / "CROSS-REPO-GRAPH.md"
            relative_back = f"../../{repo_name}/TODO/CROSS-REPO-GRAPH.md"
            peer_cross.write_text(
                f"# Cross-repo task dependencies\n\n"
                f"See the canonical graph in **[{repo_name}/TODO/CROSS-REPO-GRAPH.md]({relative_back})**.\n"
            )
            print(f"Updated {peer_cross} (pointer)")


if __name__ == "__main__":
    main()
