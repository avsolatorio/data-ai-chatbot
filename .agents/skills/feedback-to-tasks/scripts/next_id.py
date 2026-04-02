#!/usr/bin/env python3
"""
Returns the next available task ID for a given domain in a repo's TODO directory.

Usage:
    python next_id.py --repo-path /path/to/repo --domain FE
    # Output: FE-007

    python next_id.py --repo-path /path/to/repo --domain FE --peek
    # Output: FE-007 (same, but doesn't "reserve" anything — IDs are based on files on disk)
"""

import argparse
import re
import sys
from pathlib import Path


def next_id(repo_path: str, domain: str) -> str:
    todo_dir = Path(repo_path) / "TODO"
    if not todo_dir.exists():
        # No TODO dir yet — first task in this domain
        return f"{domain}-001"

    domain_upper = domain.upper()
    pattern = re.compile(rf"^{re.escape(domain_upper)}-(\d+)[-.]", re.IGNORECASE)

    max_num = 0
    for f in todo_dir.iterdir():
        if f.suffix != ".md":
            continue
        match = pattern.match(f.name)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num

    return f"{domain_upper}-{max_num + 1:03d}"


def main():
    parser = argparse.ArgumentParser(description="Get next task ID for a domain")
    parser.add_argument("--repo-path", required=True, help="Path to repo root")
    parser.add_argument("--domain", required=True, help="Domain prefix (e.g. FE, BE, MCP)")
    args = parser.parse_args()

    result = next_id(args.repo_path, args.domain)
    print(result)


if __name__ == "__main__":
    main()
