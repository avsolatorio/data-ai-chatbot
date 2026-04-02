"""Unified CLI for the Data360 chatbot evaluation framework.

Usage:
    python -m evals <command> [options]

Commands:
    run         Simulate and score a single conversation
    batch       Run a batch of personas from a suite file
    generate    Generate persona YAML files
    suite       Generate a suite.yaml from available facets
    compare     Compare two evaluation runs

Examples:
    # Generate a persona from a description
    python -m evals generate --describe "A journalist asking about trade data"

    # Generate a suite of 20 random persona combinations
    python -m evals suite --sample 20

    # Run a single conversation
    python -m evals run --persona student_learning_and_exploration --http

    # Run a composed persona
    python -m evals run --compose student:health_outcomes:south_asia:visualize --http

    # Run a full batch from a suite file
    python -m evals batch --http

    # Compare two runs
    python -m evals compare 20260326_045528 20260326_055631
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import yaml

EVALS_DIR = Path(__file__).parent
PERSONAS_DIR = EVALS_DIR / "personas"


# ── Suite generation ─────────────────────────────────────────────────────────


def _discover_facets() -> dict[str, list[str]]:
    """Scan the personas directory and return available facets."""
    bases = sorted(f.stem for f in (PERSONAS_DIR / "bases").glob("*.yaml"))
    topics = sorted(f.stem for f in (PERSONAS_DIR / "facets" / "topics").glob("*.yaml"))
    countries = sorted(f.stem for f in (PERSONAS_DIR / "facets" / "countries").glob("*.yaml"))
    patterns = sorted(f.stem for f in (PERSONAS_DIR / "facets" / "patterns").glob("*.yaml"))
    flat = sorted(f.stem for f in PERSONAS_DIR.glob("*.yaml"))
    return {
        "bases": bases,
        "topics": topics,
        "countries": countries,
        "patterns": patterns,
        "flat": flat,
    }


def _generate_combinations(
    facets: dict[str, list[str]],
    *,
    base_filter: str | None = None,
    topic_filter: str | None = None,
    pattern_filter: str | None = None,
    adversarial_only: bool = False,
) -> list[str]:
    """Generate all BASE:TOPIC:COUNTRY:PATTERN combinations, optionally filtered."""
    bases = [base_filter] if base_filter else facets["bases"]
    topics = [topic_filter] if topic_filter else facets["topics"]
    patterns = facets["patterns"]
    countries = facets["countries"]

    if adversarial_only:
        patterns = [p for p in patterns if "adversarial" in p]

    combos = []
    for b in bases:
        for t in topics:
            for c in countries:
                for p in patterns:
                    combos.append(f"{b}:{t}:{c}:{p}")
    return combos


def _cmd_suite(argv: list[str]) -> None:
    """Generate a suite.yaml from available facets."""
    parser = argparse.ArgumentParser(
        prog="python -m evals suite",
        description="Generate a suite.yaml from available persona facets.",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--full", action="store_true", help="All composed combinations")
    mode.add_argument("--sample", type=int, metavar="N", help="Random N combinations")

    parser.add_argument("--base", type=str, default=None, help="Filter by base (e.g. student)")
    parser.add_argument(
        "--topic", type=str, default=None, help="Filter by topic (e.g. health_outcomes)"
    )
    parser.add_argument("--adversarial-only", action="store_true", help="Only adversarial patterns")
    parser.add_argument("--include-flat", action="store_true", help="Include flat personas")
    parser.add_argument("--runs", type=int, default=1, help="Runs per persona (default: 1)")
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=str(EVALS_DIR / "suite.yaml"),
        help="Output file (default: evals/suite.yaml)",
    )
    parser.add_argument("--seed", type=int, default=None, help="Random seed for --sample")
    parser.add_argument(
        "--list-facets", action="store_true", help="Print available facets and exit"
    )

    args = parser.parse_args(argv)
    facets = _discover_facets()

    if args.list_facets:
        print("Bases:     ", ", ".join(facets["bases"]))
        print("Topics:    ", ", ".join(facets["topics"]))
        print("Countries: ", ", ".join(facets["countries"]))
        print("Patterns:  ", ", ".join(facets["patterns"]))
        print("Flat:      ", ", ".join(facets["flat"]))
        total = (
            len(facets["bases"])
            * len(facets["topics"])
            * len(facets["countries"])
            * len(facets["patterns"])
        )
        print(f"\nTotal composed combinations: {total}")
        return

    combos = _generate_combinations(
        facets,
        base_filter=args.base,
        topic_filter=args.topic,
        adversarial_only=args.adversarial_only,
    )

    if args.sample:
        if args.seed is not None:
            random.seed(args.seed)
        combos = random.sample(combos, min(args.sample, len(combos)))

    # Build suite entries
    entries = []
    for combo in combos:
        entries.append({"compose": combo, "runs": args.runs, "known_failures": []})

    if args.include_flat:
        for fp in facets["flat"]:
            entries.append({"flat": fp, "runs": args.runs, "known_failures": []})

    suite = {
        "personas": entries,
        "random_discovery": {
            "enabled": False,
            "runs_per_base": 2,
            "bases": facets["bases"],
        },
    }

    output_path = Path(args.output)
    output_path.write_text(yaml.dump(suite, default_flow_style=False, sort_keys=False))

    print(f"Generated suite with {len(entries)} entries -> {output_path}")
    print(f"  Composed: {sum(1 for e in entries if 'compose' in e)}")
    print(f"  Flat:     {sum(1 for e in entries if 'flat' in e)}")
    print(f"  Runs/ea:  {args.runs}")


# ── Subcommand dispatchers ───────────────────────────────────────────────────


def _cmd_run(argv: list[str]) -> None:
    """Dispatch to run_conversation_eval.main()."""
    sys.argv = [sys.argv[0]] + argv
    from evals.run_conversation_eval import main

    main()


def _cmd_batch(argv: list[str]) -> None:
    """Dispatch to run_regression.main() (overnight batch runner)."""
    sys.argv = [sys.argv[0]] + argv
    from evals.run_regression import main

    main()


def _cmd_generate(argv: list[str]) -> None:
    """Dispatch to generate_personas.main()."""
    sys.argv = [sys.argv[0]] + argv
    from evals.generate_personas import main

    main()


def _cmd_compare(argv: list[str]) -> None:
    """Dispatch to compare_eval_runs.main()."""
    sys.argv = [sys.argv[0]] + argv
    from evals.compare_eval_runs import main

    main()


# ── Main entry point ─────────────────────────────────────────────────────────

COMMANDS = {
    "run": (_cmd_run, "Simulate and score a single conversation"),
    "batch": (_cmd_batch, "Run a batch of personas from a suite file"),
    "generate": (_cmd_generate, "Generate persona YAML files"),
    "suite": (_cmd_suite, "Generate a suite.yaml from available facets"),
    "compare": (_cmd_compare, "Compare two evaluation runs"),
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        print("Commands:")
        for name, (_, desc) in COMMANDS.items():
            print(f"  {name:<12} {desc}")
        print("\nRun 'python -m evals <command> --help' for command-specific options.")
        sys.exit(0)

    command = sys.argv[1]

    if command not in COMMANDS:
        print(f"Unknown command: '{command}'")
        print(f"Available: {', '.join(COMMANDS)}")
        sys.exit(1)

    handler, _ = COMMANDS[command]
    remaining_args = sys.argv[2:]
    handler(remaining_args)


if __name__ == "__main__":
    main()
