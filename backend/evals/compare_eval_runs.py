#!/usr/bin/env python3
"""Compare two evaluation runs and produce a markdown diff report.

Usage:
    python evals/compare_eval_runs.py TIMESTAMP_BEFORE TIMESTAMP_AFTER
    python evals/compare_eval_runs.py TIMESTAMP_BEFORE TIMESTAMP_AFTER --output report.md

Example:
    python evals/compare_eval_runs.py 20260306_194432 20260306_210000
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

RESULTS_DIR = Path(__file__).parent / ".results"


def _load_results(timestamp: str) -> dict:
    """Load a conversation_eval_TIMESTAMP.json results file."""
    path = RESULTS_DIR / f"conversation_eval_{timestamp}.json"
    if not path.exists():
        candidates = sorted(RESULTS_DIR.glob(f"conversation_eval_{timestamp}*.json"))
        if candidates:
            path = candidates[0]
            print(f"  Using: {path.name}", file=sys.stderr)
        else:
            print(f"ERROR: No results file found for timestamp '{timestamp}'", file=sys.stderr)
            print(f"  Looked in: {RESULTS_DIR}", file=sys.stderr)
            available = sorted(RESULTS_DIR.glob("conversation_eval_*.json"))
            if available:
                stems = [p.stem.replace("conversation_eval_", "") for p in available[-10:]]
                print(f"  Recent timestamps: {', '.join(stems)}", file=sys.stderr)
            sys.exit(1)

    data = json.loads(path.read_text())
    return data


def _classify_change(before_passed: bool, after_passed: bool) -> str:
    """Classify a metric change as FIXED, REGRESSED, or unchanged."""
    if not before_passed and after_passed:
        return "FIXED"
    if before_passed and not after_passed:
        return "REGRESSED"
    return "unchanged"


def compare(before_ts: str, after_ts: str) -> str:
    """Generate a markdown comparison report between two eval runs."""
    before = _load_results(before_ts)
    after = _load_results(after_ts)

    before_results = before.get("results", {})
    after_results = after.get("results", {})

    all_personas = sorted(set(before_results) | set(after_results))

    lines = []
    lines.append(f"# Eval Comparison: {before_ts} vs {after_ts}")
    lines.append("")

    # Config diff
    bc = before.get("config", {})
    ac = after.get("config", {})
    if bc.get("judge_model") != ac.get("judge_model"):
        lines.append("> [!WARNING]")
        lines.append(
            f"> Judge model changed: `{bc.get('judge_model')}` -> `{ac.get('judge_model')}`"
        )
        lines.append("")

    # Persona coverage warnings
    only_before = set(before_results) - set(after_results)
    only_after = set(after_results) - set(before_results)
    if only_before:
        lines.append("> [!NOTE]")
        lines.append(f"> Personas only in BEFORE: {', '.join(sorted(only_before))}")
        lines.append("")
    if only_after:
        lines.append("> [!NOTE]")
        lines.append(f"> Personas only in AFTER: {', '.join(sorted(only_after))}")
        lines.append("")

    # Metric changes table
    lines.append("## Metric Changes")
    lines.append("")
    lines.append("| Persona | Metric | Before | After | Delta | Status |")
    lines.append("|---------|--------|--------|-------|-------|--------|")

    fixed_count = 0
    regressed_count = 0
    unchanged_fail_count = 0
    total_before_pass = 0
    total_before_metrics = 0
    total_after_pass = 0
    total_after_metrics = 0

    for persona in all_personas:
        b_metrics = before_results.get(persona, {})
        a_metrics = after_results.get(persona, {})
        all_metrics = sorted(set(b_metrics) | set(a_metrics))

        for metric in all_metrics:
            b_data = b_metrics.get(metric, {})
            a_data = a_metrics.get(metric, {})

            b_score = b_data.get("score")
            a_score = a_data.get("score")
            b_passed = b_data.get("passed")
            a_passed = a_data.get("passed")

            if b_score is not None:
                total_before_metrics += 1
                if b_passed:
                    total_before_pass += 1
            if a_score is not None:
                total_after_metrics += 1
                if a_passed:
                    total_after_pass += 1

            # Skip metrics that passed in both runs (stable, not interesting)
            if b_passed and a_passed:
                continue

            # Format scores
            b_str = f"{b_score:.2f}" if b_score is not None else "n/a"
            a_str = f"{a_score:.2f}" if a_score is not None else "n/a"

            b_label = "PASS" if b_passed else "FAIL" if b_passed is not None else ""
            a_label = "PASS" if a_passed else "FAIL" if a_passed is not None else ""

            if b_score is not None and a_score is not None:
                delta = a_score - b_score
                delta_str = f"{delta:+.2f}"
            else:
                delta_str = "n/a"

            change = _classify_change(
                b_passed if b_passed is not None else True,
                a_passed if a_passed is not None else True,
            )

            if change == "FIXED":
                fixed_count += 1
                status = "**FIXED**"
            elif change == "REGRESSED":
                regressed_count += 1
                status = "**REGRESSED**"
            else:
                unchanged_fail_count += 1
                status = "unchanged"

            lines.append(
                f"| {persona} | {metric} | {b_str} ({b_label}) "
                f"| {a_str} ({a_label}) | {delta_str} | {status} |"
            )

    lines.append("")

    # Summary
    lines.append("## Summary")
    lines.append("")

    b_rate = (total_before_pass / total_before_metrics * 100) if total_before_metrics else 0
    a_rate = (total_after_pass / total_after_metrics * 100) if total_after_metrics else 0

    lines.append(f"- **Fixed:** {fixed_count} metrics")
    lines.append(f"- **Regressed:** {regressed_count} metrics")
    lines.append(f"- **Unchanged failures:** {unchanged_fail_count} metrics")
    lines.append(
        f"- **Pass rate:** {total_before_pass}/{total_before_metrics} "
        f"({b_rate:.0f}%) -> {total_after_pass}/{total_after_metrics} ({a_rate:.0f}%)"
    )
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Compare two evaluation runs and produce a diff report.",
        epilog="Example: python evals/compare_eval_runs.py 20260306_194432 20260306_210000",
    )
    parser.add_argument("before", help="Timestamp of the baseline run")
    parser.add_argument("after", help="Timestamp of the updated run")
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Save report to file (default: print to stdout)",
    )
    args = parser.parse_args()

    report = compare(args.before, args.after)

    if args.output:
        Path(args.output).write_text(report)
        print(f"Report saved to: {args.output}", file=sys.stderr)
    else:
        print(report)


if __name__ == "__main__":
    main()
