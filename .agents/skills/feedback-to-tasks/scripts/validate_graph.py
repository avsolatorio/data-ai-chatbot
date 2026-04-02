#!/usr/bin/env python3
"""
Validates the dependency graph in a repo's TODO directory.

Checks:
  - No cycles in hard dependencies (depends_on / blocks)
  - All referenced IDs exist (within this repo or declared as cross-repo)
  - blocks[] mirrors depends_on[] correctly (warns on mismatch, doesn't fail)

Usage:
    python validate_graph.py --repo-path /path/to/repo
    python validate_graph.py --repo-path /path/to/repo --peer-paths '{"data360-mcp": "/path/to/data360-mcp"}'

Exit codes:
    0 — valid
    1 — cycles detected (hard error)
    2 — missing IDs detected (hard error)
    3 — mirror mismatches detected (warning only, exits 0 unless --strict)
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install PyYAML", file=sys.stderr)
    sys.exit(1)


def parse_frontmatter(path: Path) -> dict | None:
    text = path.read_text()
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return None
    try:
        return yaml.safe_load(match.group(1))
    except yaml.YAMLError:
        return None


def load_tasks(repo_path: Path) -> dict[str, dict]:
    """Load all task frontmatter keyed by task ID."""
    todo_dir = repo_path / "TODO"
    if not todo_dir.exists():
        return {}

    tasks = {}
    skip = {"README.md", "CROSS-REPO-GRAPH.md"}
    for f in todo_dir.glob("*.md"):
        if f.name in skip:
            continue
        fm = parse_frontmatter(f)
        if fm and "id" in fm:
            tasks[fm["id"]] = fm
    return tasks


def find_cycle(graph: dict[str, list[str]]) -> list[str] | None:
    """DFS cycle detection. Returns the cycle path or None."""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {node: WHITE for node in graph}
    parent = {}

    def dfs(node) -> list[str] | None:
        color[node] = GRAY
        for neighbor in graph.get(node, []):
            if neighbor not in color:
                continue  # cross-repo node, skip
            if color[neighbor] == GRAY:
                # Found cycle — reconstruct path
                cycle = [neighbor, node]
                cur = node
                while cur != neighbor:
                    cur = parent.get(cur, neighbor)
                    cycle.append(cur)
                return list(reversed(cycle))
            if color[neighbor] == WHITE:
                parent[neighbor] = node
                result = dfs(neighbor)
                if result:
                    return result
        color[node] = BLACK
        return None

    for node in list(graph.keys()):
        if color[node] == WHITE:
            result = dfs(node)
            if result:
                return result
    return None


def main():
    parser = argparse.ArgumentParser(description="Validate task dependency graph")
    parser.add_argument("--repo-path", required=True, help="Path to repo root")
    parser.add_argument("--peer-paths", default="{}", help="JSON map of peer repo name → path")
    parser.add_argument("--strict", action="store_true", help="Treat mirror mismatches as errors")
    args = parser.parse_args()

    repo_path = Path(args.repo_path)
    peer_paths = json.loads(args.peer_paths)

    # Load tasks from this repo
    tasks = load_tasks(repo_path)

    # Load tasks from peer repos
    all_tasks = dict(tasks)
    for peer_name, peer_path in peer_paths.items():
        peer_tasks = load_tasks(Path(peer_path))
        all_tasks.update(peer_tasks)

    if not tasks:
        print("No tasks found.")
        sys.exit(0)

    print(f"Loaded {len(tasks)} tasks from {repo_path.name}")
    if peer_paths:
        print(f"Loaded {len(all_tasks) - len(tasks)} tasks from peer repos")

    errors = []
    warnings = []

    # Build dependency graph (local tasks only for cycle detection)
    graph: dict[str, list[str]] = {}
    for task_id, fm in tasks.items():
        deps = fm.get("depends_on") or []
        graph[task_id] = [d for d in deps if d in tasks]  # local deps only

    # 1. Cycle detection
    cycle = find_cycle(graph)
    if cycle:
        errors.append(f"CYCLE DETECTED: {' → '.join(cycle)}")

    # 2. Missing ID check
    for task_id, fm in tasks.items():
        for dep_id in (fm.get("depends_on") or []):
            if dep_id not in all_tasks:
                errors.append(f"MISSING DEP: {task_id} depends_on {dep_id} but that task doesn't exist")
        for block_id in (fm.get("blocks") or []):
            if block_id not in all_tasks:
                errors.append(f"MISSING BLOCK: {task_id} blocks {block_id} but that task doesn't exist")

    # 3. Mirror consistency check
    for task_id, fm in tasks.items():
        for dep_id in (fm.get("depends_on") or []):
            if dep_id in all_tasks:
                dep_fm = all_tasks[dep_id]
                if task_id not in (dep_fm.get("blocks") or []):
                    warnings.append(
                        f"MIRROR MISMATCH: {task_id} depends_on {dep_id}, "
                        f"but {dep_id}.blocks does not include {task_id}"
                    )

    # Report
    if warnings:
        print("\n⚠  Warnings:")
        for w in warnings:
            print(f"  {w}")

    if errors:
        print("\n✗  Errors:")
        for e in errors:
            print(f"  {e}")
        sys.exit(1 if any("CYCLE" in e for e in errors) else 2)

    if not warnings and not errors:
        print("✓  Dependency graph is valid.")

    if warnings and args.strict:
        sys.exit(3)

    sys.exit(0)


if __name__ == "__main__":
    main()
