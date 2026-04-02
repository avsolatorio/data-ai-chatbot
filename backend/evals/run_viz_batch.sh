#!/usr/bin/env bash
# Visualization-focused eval batch: 6 bases x 3 runs = 18 conversations
# All use the :visualize pattern to trigger get_viz_spec chart generation.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

MAX_RETRIES=2
RETRY_WAIT=30

# 6 bases x 3 topic:region combos each (all with :visualize)
declare -a RUNS=(
  # advocate_journalist
  "advocate_journalist:health_outcomes:south_asia:visualize"
  "advocate_journalist:trade_openness:west_africa:visualize"
  "advocate_journalist:economic_growth:latin_america:visualize"
  # country_analyst
  "country_analyst:economic_growth:east_africa:visualize"
  "country_analyst:water_sanitation:southeast_asia:visualize"
  "country_analyst:poverty_inequality:south_asia:visualize"
  # decision_maker
  "decision_maker:education_access:latin_america:visualize"
  "decision_maker:gender_equity:east_africa:visualize"
  "decision_maker:debt_fiscal:southeast_asia:visualize"
  # general_public
  "general_public:poverty_inequality:south_asia:visualize"
  "general_public:climate_vulnerability:west_africa:visualize"
  "general_public:food_security:east_africa:visualize"
  # student
  "student:food_security:southeast_asia:visualize"
  "student:debt_fiscal:east_africa:visualize"
  "student:health_outcomes:latin_america:visualize"
  # technical_expert
  "technical_expert:trade_openness:latin_america:visualize"
  "technical_expert:health_outcomes:southeast_asia:visualize"
  "technical_expert:water_sanitation:south_asia:visualize"
)

TOTAL=${#RUNS[@]}
PASS=0
FAIL=0

echo ""
echo "========================================================================"
echo "  VISUALIZATION EVAL BATCH"
echo "  Total runs:     $TOTAL (6 bases x 3 scenarios)"
echo "  Pattern:        visualize (all runs)"
echo "  Started:        $(date +%Y%m%d_%H%M%S)"
echo "========================================================================"
echo ""

for i in "${!RUNS[@]}"; do
  compose="${RUNS[$i]}"
  n=$((i + 1))
  echo "[$n/$TOTAL] $compose"

  attempt=0
  success=false
  while [ $attempt -le $MAX_RETRIES ]; do
    if [ $attempt -gt 0 ]; then
      echo "  Retry $attempt/$MAX_RETRIES (waiting ${RETRY_WAIT}s)..."
      sleep $RETRY_WAIT
    fi

    if PYTHONPATH=. uv run python -m evals.run_conversation_eval \
        --http --compose "$compose" --runs 1; then
      success=true
      break
    fi
    attempt=$((attempt + 1))
  done

  if [ "$success" = true ]; then
    PASS=$((PASS + 1))
  else
    echo "  FAILED after $((MAX_RETRIES + 1)) attempts: $compose"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

echo ""
echo "========================================================================"
echo "  VISUALIZATION BATCH COMPLETE"
echo "  Finished:  $(date +%Y%m%d_%H%M%S)"
echo "  Passed:    $PASS / $TOTAL"
echo "  Failed:    $FAIL / $TOTAL"
echo "========================================================================"
