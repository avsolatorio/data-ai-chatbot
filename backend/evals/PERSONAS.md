# Composable Persona System

The evaluation framework supports two persona modes:

1. **Flat personas** -- monolithic YAML files in `personas/` (10 scenarios)
2. **Composed personas** -- assembled at runtime from reusable bases + facets (~12,000 combinations)

---

## Quick Start

```bash
cd backend

# List available facets
PYTHONPATH=. uv run python -m evals.run_conversation_eval --list-facets

# Fixed composition
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --compose student:health_outcomes:south_asia:visualize --http --turns 5

# Random composition (different each run)
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --compose-random student --runs 3 --turns 5 --http
```

---

## Architecture

A composed persona is built from four dimensions:

```
BASE  x  TOPIC  x  COUNTRIES  x  PATTERN  =  Full Persona
```

Each dimension is a YAML fragment. The compositor merges them into the three fields DeepEval needs: `scenario`, `user_description`, `expected_outcome`.

### Bases (6) -- `personas/bases/`

The user archetype. Defines communication style, expertise level, and UX priority.

| Base | Persona Type | UX Priority |
|------|-------------|-------------|
| `decision_maker` | Senior government official | Confidence and simplicity |
| `technical_expert` | Data analyst / developer | Depth and traceability |
| `country_analyst` | Country economist | Contextual relevance |
| `advocate_journalist` | Journalist / advocate | Clarity and communicability |
| `student` | Undergraduate student | Learning support |
| `general_public` | Curious citizen | Accessibility and trust |

### Topics (10) -- `personas/facets/topics/`

High-level development concepts (not specific indicator IDs). The chatbot discovers relevant indicators dynamically.

`economic_growth`, `poverty_inequality`, `health_outcomes`, `education_access`, `gender_equity`, `climate_vulnerability`, `debt_fiscal`, `trade_openness`, `water_sanitation`, `food_security`

### Countries (5) -- `personas/facets/countries/`

Each country facet includes ~5 variants mixing regions, single countries, and country lists. One variant is picked randomly (or by index).

| Facet | Example Variants |
|-------|-----------------|
| `west_africa` | "West Africa", "Nigeria", "Senegal and Cote d'Ivoire" |
| `east_africa` | "East Africa", "Kenya", "Kenya, Tanzania, and Uganda" |
| `south_asia` | "South Asia", "India", "India and Bangladesh" |
| `southeast_asia` | "Southeast Asia", "Philippines", "Vietnam and Thailand" |
| `latin_america` | "Latin America", "Brazil", "Colombia, Peru, and Chile" |

### Patterns (8) -- `personas/facets/patterns/`

The conversation arc -- what the user does across turns.

| Pattern | Description |
|---------|-------------|
| `explore` | Ask, learn, follow up |
| `compare` | Cross-country comparison |
| `visualize` | Data to chart to export |
| `drill_down` | Overview to metadata |
| `export` | Data to API URLs and citations |
| `adversarial_scope_guard` | Push chatbot outside scope |
| `adversarial_fabrication` | Probe for made-up data |
| `adversarial_disambiguation` | Use ambiguous geographic names |

---

## CLI Reference

| Flag | Description |
|------|-------------|
| `--compose BASE:TOPIC:COUNTRIES:PATTERN` | Compose a specific persona |
| `--compose-random BASE` | Random facets per run (use with `--runs N`) |
| `--list-facets` | Print all available bases and facets, then exit |

These flags work alongside all existing flags (`--turns`, `--runs`, `--http`, `--no-eval`, etc.).

---

## Full E2E Run Playbook

A complete evaluation sweep covers flat personas, composed random runs, and adversarial pinned runs.

### Phase 1 -- Flat personas (regression baseline)

```bash
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --persona all --turns 5 --http
```

Runs all 10 monolithic personas. Deterministic scenarios, reproducible results.

**Output:** 10 conversation markdowns + 1 result JSON.

### Phase 2 -- Composed random (coverage breadth)

```bash
for base in decision_maker technical_expert country_analyst \
            advocate_journalist student general_public; do
  PYTHONPATH=. uv run python -m evals.run_conversation_eval \
    --compose-random $base --runs 2 --turns 5 --http
done
```

Each base gets 2 runs with random topic/country/pattern combinations.

**Output:** 12 conversation markdowns + 6 result JSONs.

### Phase 3 -- Adversarial pinned (boundary testing)

```bash
PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --compose student:health_outcomes:south_asia:adversarial_scope_guard \
  --turns 5 --http

PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --compose technical_expert:economic_growth:east_africa:adversarial_fabrication \
  --turns 5 --http

PYTHONPATH=. uv run python -m evals.run_conversation_eval \
  --compose country_analyst:trade_openness:southeast_asia:adversarial_disambiguation \
  --turns 5 --http
```

**Output:** 3 conversation markdowns + 3 result JSONs.

### Phase 4 -- Review

1. Check pass rates in the `.results/` JSON files
2. For any metric < 0.7 or FAIL, run the manual review (see `eval-manual-review` skill or `review_conversation.py`)
3. Compare against previous runs with `compare_eval_runs.py`

### Coverage Summary

| Layer | Runs | What it tests |
|-------|------|---------------|
| Flat personas | 10 | Regression -- same scenarios as before |
| Composed random | 12 | Breadth -- 6 user types, varied facets |
| Adversarial pinned | 3 | Boundary -- scope guard, fabrication, disambiguation |
| **Total** | **25** | |

---

## Adding a New Facet

### New topic

Create `personas/facets/topics/<name>.yaml`:

```yaml
topic_concept: digital connectivity and internet access
topic_context: >
  broadband penetration, mobile subscriptions, and digital
  infrastructure gaps across developing countries
topic_terms: [broadband, internet penetration, mobile subscriptions, ICT]
```

### New country

Create `personas/facets/countries/<name>.yaml`:

```yaml
region: Central Asia
variants:
  - { geo: "Central Asia", scope: region }
  - { geo: "Kazakhstan", scope: country }
  - { geo: "Uzbekistan and Kyrgyzstan", scope: list }
```

### New pattern

Create `personas/facets/patterns/<name>.yaml`:

```yaml
pattern_description: >
  They ask for data, then request a methodology comparison
  between two different data sources for the same indicator.
pattern_outcomes: >
  (3) The chatbot identifies multiple sources and explains
  methodological differences. (4) Comparability caveats are flagged.
```

After adding any facet, run `--list-facets` to verify it loads, and run the unit tests:

```bash
PYTHONPATH=. uv run python -m pytest evals/test_persona_composer.py -v
```

---

## File Layout

| File | Purpose |
|------|---------|
| `persona_composer.py` | Compositor: `compose()`, `compose_random()`, `list_available()` |
| `test_persona_composer.py` | 15 unit tests for the compositor |
| `personas/bases/*.yaml` | 6 base profile templates |
| `personas/facets/topics/*.yaml` | 10 topic facets |
| `personas/facets/countries/*.yaml` | 5 country facets (with variants) |
| `personas/facets/patterns/*.yaml` | 8 pattern facets (5 normal + 3 adversarial) |
