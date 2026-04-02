"""Overnight regression runner for persona evaluations.

Reads regression_suite.yaml, runs each persona via subprocess,
handles retries for F3 (empty writer) and infrastructure errors,
and writes a final REGRESSION_REPORT_<timestamp>.md.

Usage:
    # Dry run — list what would be run, then exit
    uv run python -m evals.run_regression --dry-run

    # Full overnight run (servers must be running)
    uv run python -m evals.run_regression --http

    # Resume from a previous checkpoint (skips already-completed personas)
    uv run python -m evals.run_regression --http --resume
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import yaml

# ── Paths ────────────────────────────────────────────────────────────────────

EVALS_DIR = Path(__file__).parent
BACKEND_DIR = EVALS_DIR.parent
SUITE_FILE = EVALS_DIR / "configs" / "suite.yaml"
CHECKPOINT_FILE = EVALS_DIR / ".regression_checkpoint.json"

# ── Retry configuration ───────────────────────────────────────────────────────

MAX_RETRIES = 2
RETRY_WAIT_SECONDS = [30, 60]  # exponential: 30s then 60s

# Patterns in stdout/stderr that indicate an infrastructure/connection error.
# Any match triggers a retry (same as a non-zero exit code).
_INFRA_ERROR_PATTERNS = [
    "connectionerror",
    "timeout",
    "rate limit",
    "ratelimiterror",
    "apiconnectionerror",
    "httpx.connecterror",
    "openai.apierror",
    "service unavailable",
    "503",
    "preflight check failed",
]


# ── Data structures ───────────────────────────────────────────────────────────


@dataclass
class PersonaResult:
    key: str  # e.g. "student:climate_vulnerability:..."
    known_failures: list[str]
    runs: int
    metrics: dict[str, float] = field(default_factory=dict)
    pass_fail: dict[str, str] = field(default_factory=dict)  # metric -> "PASS"/"FAIL"
    failures: list[str] = field(default_factory=list)
    new_failures: list[str] = field(default_factory=list)
    f3_events: int = 0
    retries_used: int = 0
    infra_errors: int = 0
    success: bool = False  # True if subprocess completed without infra error
    error: str = ""


# ── Parsing ───────────────────────────────────────────────────────────────────


def _parse_pass_fail(output: str) -> tuple[dict[str, float], list[str], list[str]]:
    """
    Parse metric results from run_conversation_eval stdout.

    Handles both single-run and multi-run formats:
        PASS Source Citation: 0.96
        FAIL Visualization & API URLs: 0.20
        PASS Source Citation: 0.97 +/- 0.03

    Returns:
        metrics:  {metric_name: score}
        failures: metric names that are FAIL
        passes:   metric names that are PASS
    """
    metrics: dict[str, float] = {}
    failures: list[str] = []
    passes: list[str] = []

    pattern = re.compile(
        r"^\s+(PASS|FAIL)\s+(.+?):\s+([\d.]+)",
        re.MULTILINE,
    )
    for match in pattern.finditer(output):
        status = match.group(1)
        name = match.group(2).strip()
        score = float(match.group(3))
        metrics[name] = score
        if status == "FAIL":
            failures.append(name)
        else:
            passes.append(name)

    return metrics, failures, passes


def _is_f3(metrics: dict[str, float]) -> bool:
    """Detect F3: every scored metric is 0.00 — blank writer response."""
    return bool(metrics) and all(v == 0.0 for v in metrics.values())


def _has_infra_error(combined_output: str, returncode: int) -> bool:
    """Detect infrastructure/connection errors from exit code or log patterns."""
    if returncode != 0:
        return True
    lower = combined_output.lower()
    return any(p in lower for p in _INFRA_ERROR_PATTERNS)


# ── Runner ────────────────────────────────────────────────────────────────────


def _build_command(entry: dict, http: bool) -> list[str]:
    """Build the subprocess command for a single persona entry."""
    cmd = [sys.executable, "-m", "evals.run_conversation_eval"]

    if "compose" in entry:
        cmd += ["--compose", entry["compose"]]
    elif "flat" in entry:
        cmd += ["--persona", entry["flat"]]
    else:
        raise ValueError(f"Entry must have 'compose' or 'flat': {entry}")

    cmd += ["--runs", str(entry.get("runs", 1))]

    if http:
        cmd.append("--http")

    return cmd


def _stream_subprocess(cmd: list[str]) -> tuple[str, int]:
    """
    Run a subprocess, streaming its stdout live to the terminal
    while also capturing the full output for later parsing.

    Returns: (combined_output, returncode)
    """
    import subprocess

    lines: list[str] = []
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,  # merge stderr into stdout
        text=True,
        cwd=str(BACKEND_DIR),
        bufsize=1,  # line-buffered
    )
    assert proc.stdout is not None
    for line in proc.stdout:
        print(line, end="", flush=True)
        lines.append(line)
    proc.wait()
    return "".join(lines), proc.returncode


def run_persona(entry: dict, http: bool) -> PersonaResult:
    """
    Run one persona with up to MAX_RETRIES retries.

    Retries on:
    - F3 (all metrics 0.00) — blank writer response
    - Infrastructure errors (non-zero exit, connection errors, rate limits)

    Does NOT retry on normal metric failures (F1/F2) — those are deterministic.
    Output is streamed live to the terminal so DeepEval progress is visible.
    """
    key = entry.get("compose") or entry.get("flat", "unknown")
    known = entry.get("known_failures", [])
    runs = entry.get("runs", 1)

    result = PersonaResult(key=key, known_failures=known, runs=runs)
    cmd = _build_command(entry, http)

    for attempt in range(MAX_RETRIES + 1):
        try:
            combined, returncode = _stream_subprocess(cmd)
            metrics, failures, _ = _parse_pass_fail(combined)

            # Detect retry triggers
            f3 = _is_f3(metrics)
            infra = _has_infra_error(combined, returncode)

            if f3:
                result.f3_events += 1
                reason = "F3 (empty writer — all metrics 0.00)"
            elif infra:
                result.infra_errors += 1
                reason = "Infrastructure / connection error"
            else:
                # Clean completion — may still have metric failures, but not retriable
                result.metrics = metrics
                result.failures = failures
                result.new_failures = [f for f in failures if f not in known]
                result.success = True
                result.retries_used = attempt
                return result

            # Need to retry
            result.retries_used = attempt + 1
            if attempt < MAX_RETRIES:
                wait = RETRY_WAIT_SECONDS[attempt]
                _log(
                    f"\n  [{key}] Retry {attempt + 1}/{MAX_RETRIES} after {reason}. Waiting {wait}s..."
                )
                time.sleep(wait)
            else:
                _log(f"\n  [{key}] Max retries reached after {reason}. Recording last result.")
                result.metrics = metrics
                result.failures = failures
                result.new_failures = [f for f in failures if f not in known]
                result.success = False
                result.error = reason

        except Exception as e:
            result.retries_used = attempt + 1
            result.infra_errors += 1
            if attempt < MAX_RETRIES:
                wait = RETRY_WAIT_SECONDS[attempt]
                _log(f"\n  [{key}] Exception on attempt {attempt + 1}: {e}. Waiting {wait}s...")
                time.sleep(wait)
            else:
                result.success = False
                result.error = str(e)

    return result


# ── Checkpoint ────────────────────────────────────────────────────────────────


def _load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        return json.loads(CHECKPOINT_FILE.read_text())
    return {"completed": {}}


def _save_checkpoint(checkpoint: dict) -> None:
    CHECKPOINT_FILE.write_text(json.dumps(checkpoint, indent=2))


def _checkpoint_key(entry: dict) -> str:
    return entry.get("compose") or entry.get("flat", "unknown")


# ── Report ────────────────────────────────────────────────────────────────────


def _generate_report(results: list[PersonaResult], timestamp: str) -> str:
    total = len(results)
    fully_passed = sum(1 for r in results if r.success and not r.new_failures and not r.failures)
    has_known_only = sum(1 for r in results if r.success and r.failures and not r.new_failures)
    has_new_failures = sum(1 for r in results if r.new_failures)
    f3_total = sum(r.f3_events for r in results)
    total_retries = sum(r.retries_used for r in results)
    infra_errors = sum(r.infra_errors for r in results)

    lines = [
        f"# Regression Report — {timestamp}",
        "",
        "## Summary",
        "",
        "| | |",
        "|---|---|",
        f"| Total personas | {total} |",
        f"| Fully passed (no failures) | {fully_passed} |",
        f"| Known failures only | {has_known_only} |",
        f"| New failures detected | {has_new_failures} |",
        f"| F3 events (empty writer) | {f3_total} |",
        f"| Infrastructure errors | {infra_errors} |",
        f"| Total retries used | {total_retries} |",
        "",
        "---",
        "",
        "## Results by Persona",
        "",
        "| Persona | Runs | Status | New Failures | Known Failures Present |",
        "|---|---|---|---|---|",
    ]

    for r in results:
        if not r.success and r.f3_events == r.runs:
            status = "F3 CRASH"
        elif r.new_failures:
            status = "NEW FAILURES"
        elif r.failures:
            status = "KNOWN FAILURES"
        elif r.success:
            status = "PASS"
        else:
            status = "ERROR"

        new_f = ", ".join(sorted(set(r.new_failures))) if r.new_failures else "—"
        known_f = (
            ", ".join(sorted(set(f for f in r.failures if f in r.known_failures)))
            if r.failures
            else "—"
        )

        lines.append(f"| `{r.key}` | {r.runs} | {status} | {new_f} | {known_f} |")

    # New failures section
    new_failure_entries = [r for r in results if r.new_failures]
    if new_failure_entries:
        lines += ["", "---", "", "## New Failures (not in known_failures)", ""]
        lines.append("> These failures were not expected. They need investigation.")
        for r in new_failure_entries:
            lines += ["", f"### `{r.key}`", ""]
            for metric in r.new_failures:
                score = r.metrics.get(metric, "N/A")
                lines.append(f"- **{metric}**: {score}")

    # F3 section
    if f3_total > 0:
        lines += ["", "---", "", "## F3 Events (Empty Writer)", ""]
        lines.append(
            "> F3 = the writer produced no output. All metrics scored 0.00. "
            "This is a race condition in the writer pipeline."
        )
        lines.append("")
        for r in results:
            if r.f3_events > 0:
                lines.append(f"- `{r.key}`: {r.f3_events} F3 event(s) out of {r.runs} run(s)")

    # Known failures still present
    known_failure_entries = [r for r in results if r.failures and not r.new_failures]
    if known_failure_entries:
        lines += ["", "---", "", "## Known Failures (still present)", ""]
        lines.append("> These are pre-existing failures documented in OVERALL_FINDING.md.")
        for r in known_failure_entries:
            still_present = [f for f in r.failures if f in r.known_failures]
            if still_present:
                lines += ["", f"### `{r.key}`", ""]
                for metric in still_present:
                    score = r.metrics.get(metric, "N/A")
                    lines.append(f"- **{metric}**: {score}")

    lines += ["", "---", "", f"*Generated by `evals/run_regression.py` at {timestamp}*", ""]
    return "\n".join(lines)


# ── CLI ───────────────────────────────────────────────────────────────────────


def _log(msg: str) -> None:
    print(msg, flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Overnight regression runner for persona evaluations."
    )
    parser.add_argument(
        "--http",
        action="store_true",
        help="Use HTTP callback (hits the live chatbot API). Required for E2E eval.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the full persona list and exit without running anything.",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume from checkpoint, skipping already-completed personas.",
    )
    parser.add_argument(
        "--suite",
        type=str,
        default=str(SUITE_FILE),
        help=f"Path to regression suite YAML (default: {SUITE_FILE})",
    )
    parser.add_argument(
        "--discovery",
        action="store_true",
        help="After the fixed regression suite, run random discovery personas "
        "(uses random_discovery config in the suite YAML). "
        "Good for finding new failure modes across unseen facet combinations.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Load suite
    suite_path = Path(args.suite)
    if not suite_path.exists():
        _log(f"ERROR: Suite file not found: {suite_path}")
        sys.exit(1)

    suite = yaml.safe_load(suite_path.read_text())
    personas = suite.get("personas", [])

    if not personas:
        _log("ERROR: No personas defined in suite file.")
        sys.exit(1)

    # Count total runs for display
    total_runs = sum(p.get("runs", 1) for p in personas)

    _log("\n" + "=" * 72)
    _log("  OVERNIGHT REGRESSION RUNNER")
    _log(f"  Suite:      {suite_path.name}")
    _log(f"  Personas:   {len(personas)}")
    _log(f"  Total runs: {total_runs}")
    _log(f"  HTTP mode:  {args.http}")
    _log(f"  Timestamp:  {timestamp}")
    _log("=" * 72 + "\n")

    # Dry run mode
    if args.dry_run:
        _log("DRY RUN — would execute:\n")
        for i, entry in enumerate(personas, 1):
            key = entry.get("compose") or entry.get("flat", "?")
            runs = entry.get("runs", 1)
            known = entry.get("known_failures", [])
            known_str = f"  [known: {', '.join(known)}]" if known else ""
            _log(f"  {i:2}. {key}  (runs={runs}){known_str}")
        _log(f"\n  Total: {len(personas)} personas, {total_runs} runs")
        _log("  Use without --dry-run to execute.\n")
        return

    # Load or initialize checkpoint
    checkpoint = _load_checkpoint() if args.resume else {"completed": {}}
    all_results: list[PersonaResult] = []

    # Reload completed results from checkpoint when resuming
    if args.resume and checkpoint.get("completed"):
        _log(
            f"Resuming from checkpoint. Already completed: {len(checkpoint['completed'])} persona(s).\n"
        )
        for key, result_dict in checkpoint["completed"].items():
            r = PersonaResult(
                key=key,
                known_failures=result_dict.get("known_failures", []),
                runs=result_dict.get("runs", 1),
            )
            r.metrics = result_dict.get("metrics", {})
            r.failures = result_dict.get("failures", [])
            r.new_failures = result_dict.get("new_failures", [])
            r.f3_events = result_dict.get("f3_events", 0)
            r.retries_used = result_dict.get("retries_used", 0)
            r.infra_errors = result_dict.get("infra_errors", 0)
            r.success = result_dict.get("success", False)
            r.error = result_dict.get("error", "")
            all_results.append(r)

    # Run personas
    for i, entry in enumerate(personas, 1):
        key = _checkpoint_key(entry)

        if args.resume and key in checkpoint["completed"]:
            _log(f"  [{i}/{len(personas)}] Skipping (already done): {key}")
            continue

        runs = entry.get("runs", 1)
        _log(f"  [{i}/{len(personas)}] Running: {key}  (runs={runs})")

        result = run_persona(entry, args.http)
        all_results.append(result)

        # Status summary line
        if result.new_failures:
            _log(f"  → NEW FAILURES: {', '.join(result.new_failures)}")
        elif result.failures:
            _log(f"  → Known failures: {', '.join(result.failures)}")
        elif result.f3_events:
            _log(f"  → F3 events: {result.f3_events} (empty writer)")
        elif result.success:
            _log("  → PASS")
        else:
            _log(f"  → ERROR: {result.error}")

        # Save checkpoint
        checkpoint["completed"][key] = {
            "known_failures": result.known_failures,
            "runs": result.runs,
            "metrics": result.metrics,
            "failures": result.failures,
            "new_failures": result.new_failures,
            "f3_events": result.f3_events,
            "retries_used": result.retries_used,
            "infra_errors": result.infra_errors,
            "success": result.success,
            "error": result.error,
        }
        _save_checkpoint(checkpoint)

        _log("")

    # ── Random discovery mode ──────────────────────────────────────────────
    if args.discovery:
        disc = suite.get("random_discovery", {})
        bases = disc.get("bases", [])
        runs_per_base = disc.get("runs_per_base", 2)

        if not bases:
            _log("WARNING: --discovery flag set but no bases defined in random_discovery config.")
        else:
            _log("\n" + "=" * 72)
            _log("  DISCOVERY MODE — random facet combinations")
            _log(f"  Bases: {', '.join(bases)}")
            _log(f"  Runs per base: {runs_per_base}")
            _log("=" * 72 + "\n")

            disc_total = len(bases) * runs_per_base
            disc_idx = 0
            for base in bases:
                for run_n in range(runs_per_base):
                    disc_idx += 1
                    disc_key = f"random:{base}:run{run_n + 1}"
                    _log(
                        f"  [D{disc_idx}/{disc_total}] Random: {base} (run {run_n + 1}/{runs_per_base})"
                    )

                    disc_cmd = [
                        sys.executable,
                        "-m",
                        "evals.run_conversation_eval",
                        "--compose-random",
                        base,
                        "--runs",
                        "1",
                    ]
                    if args.http:
                        disc_cmd.append("--http")

                    try:
                        combined, returncode = _stream_subprocess(disc_cmd)
                        metrics, failures, _ = _parse_pass_fail(combined)
                        f3 = _is_f3(metrics)
                        infra = _has_infra_error(combined, returncode)

                        r = PersonaResult(key=disc_key, known_failures=[], runs=1)
                        r.metrics = metrics
                        r.failures = failures
                        # All failures are "new" in discovery mode (no known baseline)
                        r.new_failures = failures
                        r.f3_events = 1 if f3 else 0
                        r.success = not (f3 or infra)
                        all_results.append(r)

                        if r.new_failures:
                            _log(f"  → NEW FAILURES: {', '.join(r.new_failures)}")
                        elif r.f3_events:
                            _log("  → F3 (empty writer)")
                        elif r.success:
                            _log("  → PASS")
                        else:
                            _log("  → INFRA ERROR")
                    except Exception as e:
                        _log(f"  → Exception: {e}")

                    _log("")
    # Generate and save report
    report = _generate_report(all_results, timestamp)
    report_path = EVALS_DIR / f"REGRESSION_REPORT_{timestamp}.md"
    report_path.write_text(report)

    _log("\n" + "=" * 72)
    _log(f"  Done! Report written to: {report_path.name}")
    _log("=" * 72 + "\n")

    # Print final summary to stdout too
    fully_passed = sum(1 for r in all_results if r.success and not r.failures)
    _log(f"  Fully passed:    {fully_passed}/{len(all_results)}")
    _log(f"  New failures:    {sum(1 for r in all_results if r.new_failures)}")
    _log(f"  F3 events:       {sum(r.f3_events for r in all_results)}")
    _log(f"  Retries used:    {sum(r.retries_used for r in all_results)}")
    _log("")

    # Clean up checkpoint on success
    if CHECKPOINT_FILE.exists():
        CHECKPOINT_FILE.unlink()


if __name__ == "__main__":
    main()
