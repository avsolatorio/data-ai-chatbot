#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Overnight Batch Eval Runner
# Runs all flat personas (1 run each) + random composed personas (per base).
# Separate from the regression suite — this is a full coverage eval run.
#
# Features:
#   - Retry: each conversation retries up to MAX_RETRIES on failure
#   - Resume: completed runs are logged to a checkpoint file; re-running
#     the script skips already-completed entries
#
# Usage:
#   cd backend
#   chmod +x evals/run_overnight_batch.sh
#
#   # Fresh run (clears checkpoint):
#   nohup bash evals/run_overnight_batch.sh > /tmp/overnight_batch.log 2>&1 &
#
#   # Resume a previous interrupted run:
#   nohup bash evals/run_overnight_batch.sh --resume > /tmp/overnight_batch.log 2>&1 &
#
#   # Tail progress:
#   tail -f /tmp/overnight_batch.log
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

# ── Configuration ────────────────────────────────────────────────────────────
RANDOM_RUNS_PER_BASE=17   # 6 bases x 17 = 102 random composed conversations
MAX_RETRIES=2             # retries per conversation (total attempts = MAX_RETRIES + 1)
RETRY_WAIT=30             # seconds to wait between retries

CHECKPOINT_FILE="$SCRIPT_DIR/.batch_checkpoint"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# All flat personas
FLAT_PERSONAS=(
  adversarial_api_edge_cases
  adversarial_creative_writing_scope_guard
  adversarial_region_disambiguation
  adversarial_user_data_scope_and_limitations
  journalist_multilingual_query_and_export
  policy_advisor_comparative_analysis
  policy_researcher_context_management_and_followups
  regression_south_asia_and_claim_id
  student_learning_and_exploration
  technical_analyst_api_and_code_generation
)

# All bases for random composition
BASES=(
  advocate_journalist
  country_analyst
  decision_maker
  general_public
  student
  technical_expert
)

# ── Parse args ───────────────────────────────────────────────────────────────
RESUME=false
for arg in "$@"; do
  case "$arg" in
    --resume) RESUME=true ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

if [ "$RESUME" = true ] && [ -f "$CHECKPOINT_FILE" ]; then
  echo "Resuming from checkpoint: $CHECKPOINT_FILE"
  echo "  Already completed: $(wc -l < "$CHECKPOINT_FILE" | tr -d ' ') run(s)"
else
  # Fresh run — clear checkpoint
  > "$CHECKPOINT_FILE"
fi

# ── Helpers ──────────────────────────────────────────────────────────────────

is_completed() {
  # Check if a run key exists in the checkpoint file
  grep -qxF "$1" "$CHECKPOINT_FILE" 2>/dev/null
}

mark_completed() {
  echo "$1" >> "$CHECKPOINT_FILE"
}

run_with_retry() {
  # $1 = run_key (for checkpoint)
  # $2+ = the command to run
  local key="$1"
  shift

  if is_completed "$key"; then
    echo "    ⏭  Skipping (already completed): $key"
    return 0
  fi

  local attempt=0
  while [ $attempt -le $MAX_RETRIES ]; do
    if [ $attempt -gt 0 ]; then
      echo "    ↻  Retry $attempt/$MAX_RETRIES for: $key (waiting ${RETRY_WAIT}s)"
      sleep $RETRY_WAIT
    fi

    # Run the eval command
    if PYTHONPATH=. "$@"; then
      mark_completed "$key"
      return 0
    fi

    attempt=$((attempt + 1))
  done

  echo "    ✗  FAILED after $((MAX_RETRIES + 1)) attempts: $key"
  return 1
}

# ── Summary ──────────────────────────────────────────────────────────────────
TOTAL_RANDOM=$((${#BASES[@]} * RANDOM_RUNS_PER_BASE))
TOTAL=$(( ${#FLAT_PERSONAS[@]} + TOTAL_RANDOM ))

echo ""
echo "========================================================================"
echo "  OVERNIGHT BATCH EVAL"
echo "  Timestamp:         $TIMESTAMP"
echo "  Flat personas:     ${#FLAT_PERSONAS[@]}"
echo "  Random composed:   ${#BASES[@]} bases x $RANDOM_RUNS_PER_BASE = $TOTAL_RANDOM"
echo "  Total runs:        $TOTAL"
echo "  Max retries:       $MAX_RETRIES per run"
echo "  Resume mode:       $RESUME"
echo "========================================================================"
echo ""

# ── Counters ─────────────────────────────────────────────────────────────────
PASS=0
FAIL=0

# ── Phase 1: Flat personas ──────────────────────────────────────────────────
echo "── Phase 1: Flat Personas (${#FLAT_PERSONAS[@]}) ─────────────────────────"
echo ""

for i in "${!FLAT_PERSONAS[@]}"; do
  persona="${FLAT_PERSONAS[$i]}"
  n=$((i + 1))
  echo "  [$n/${#FLAT_PERSONAS[@]}] flat:$persona"

  if run_with_retry "flat:$persona" \
      uv run python -m evals.run_conversation_eval \
        --http --persona "$persona" --runs 1; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

# ── Phase 2: Random composed personas ────────────────────────────────────────
echo "── Phase 2: Random Composed Personas ($TOTAL_RANDOM) ─────────────────────"
echo ""

idx=0
for base in "${BASES[@]}"; do
  echo "  Base: $base ($RANDOM_RUNS_PER_BASE runs)"
  for run_n in $(seq 1 "$RANDOM_RUNS_PER_BASE"); do
    idx=$((idx + 1))
    key="random:${base}:run${run_n}"
    echo "    [R$idx/$TOTAL_RANDOM] $key"

    if run_with_retry "$key" \
        uv run python -m evals.run_conversation_eval \
          --http --compose-random "$base" --runs 1; then
      PASS=$((PASS + 1))
    else
      FAIL=$((FAIL + 1))
    fi
  done
  echo ""
done

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "========================================================================"
echo "  OVERNIGHT BATCH COMPLETE"
echo "  Finished at:  $(date +%Y%m%d_%H%M%S)"
echo "  Passed:       $PASS / $TOTAL"
echo "  Failed:       $FAIL / $TOTAL"
echo "  Results in:   evals/.results/ and evals/conversations/"
echo "========================================================================"
echo ""

# Clean up checkpoint on full completion (no failures)
if [ $FAIL -eq 0 ]; then
  rm -f "$CHECKPOINT_FILE"
  echo "  Checkpoint cleared (all passed)."
else
  echo "  Checkpoint kept at: $CHECKPOINT_FILE"
  echo "  Re-run with --resume to retry failed runs."
fi
