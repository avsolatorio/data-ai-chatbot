"""
Generate evaluation persona YAML files using an LLM.

Uses the EVALUATION_GUIDE.md and existing personas as context to generate
new or regenerated persona definitions for the conversation evaluation.

Usage:
    # Regenerate all 11 existing personas into personas_new/
    cd backend
    uv run python -m evals.generate_personas --regenerate

    # Generate N new personas
    uv run python -m evals.generate_personas --count 3

    # Generate with a specific theme focus
    uv run python -m evals.generate_personas --count 2 --focus "health and education data for African countries"

    # Custom output directory
    uv run python -m evals.generate_personas --regenerate --output personas_v2
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
from pathlib import Path

import yaml
from openai import OpenAI

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("generate_personas")

EVALS_DIR = Path(__file__).parent
PERSONAS_DIR = EVALS_DIR / "personas"
GUIDE_PATH = EVALS_DIR / "EVALUATION_GUIDE.md"

GEN_MODEL = os.getenv("PERSONA_GEN_MODEL", "gpt-4.1-mini")

EXISTING_PERSONAS = [
    "student", "geographer", "economist", "journalist", "policy_advisor",
    "data_engineer", "ngo_worker", "curious_citizen", "adversarial",
    "multilingual", "comparison_max",
]

PERSONA_BRIEFS = {
    "student": "University grad student writing thesis on East African economic development. Step-by-step data exploration: GDP -> comparison table -> chart -> methodology -> follow-ups.",
    "geographer": "Spatial analysis professor studying urbanization. SEX disaggregation, multi-country comparison, API URL access, visualization.",
    "economist": "World Bank macroeconomist building a Phillips curve model. Needs inflation + unemployment for Brazil, side-by-side table, API URLs, comparability notes.",
    "journalist": "Data journalist fact-checking income inequality story. Gini coefficient, multiple countries, markdown table, source verification, visualization.",
    "policy_advisor": "Government advisor analyzing education spending vs outcomes in India. Multi-indicator comparison, cross-country benchmarking, chart, limitations.",
    "data_engineer": "Health NGO data engineer building dashboard. Needs API URLs, Python code examples, programmatic access. Technical user.",
    "ngo_worker": "UNICEF field officer in Bangladesh needing subnational child mortality data. Tests data unavailability handling and graceful fallback.",
    "curious_citizen": "Non-technical retired teacher with vague questions about development. Tests guided discovery and plain language explanations.",
    "adversarial": "QA tester trying to break the system: fictional countries (Wakanda), future projections, creative content requests (poems). Tests scope guard.",
    "multilingual": "French-speaking analyst using non-English country names: Cote d'Ivoire, Deutschland, Congo disambiguation. Tests country resolution.",
    "comparison_max": "Think tank analyst comparing BRICS vs G7 (14 countries) in one request. Tests high-cardinality handling and batch tool calls.",
}


def _load_guide_context():
    """Load key sections from EVALUATION_GUIDE.md for context."""
    if not GUIDE_PATH.exists():
        logger.warning("EVALUATION_GUIDE.md not found, using minimal context")
        return ""

    guide = GUIDE_PATH.read_text()
    sections = []
    for section in ["## 1. Executive Summary", "## 2. Evaluation Pipeline", "## 3. Metrics Reference"]:
        idx = guide.find(section)
        if idx >= 0:
            next_section = guide.find("\n## ", idx + len(section))
            if next_section > 0:
                sections.append(guide[idx:next_section])
            else:
                sections.append(guide[idx:])

    return "\n\n".join(sections)[:8000]


def _load_existing_persona(key):
    """Load an existing persona YAML as a string for few-shot examples."""
    path = PERSONAS_DIR / f"{key}.yaml"
    if path.exists():
        return path.read_text()
    return ""


def _build_system_prompt(guide_context):
    """Build system prompt for persona generation."""
    return f"""You are an expert evaluation designer for the Data360 Chatbot -- an MCP-powered assistant that retrieves World Bank development data, generates visualizations, and provides analysis.

Your job is to generate persona YAML files for conversation-based evaluation. Each persona drives a simulated multi-turn conversation between a user and the chatbot.

## Chatbot Capabilities (from the Evaluation Guide)

{guide_context}

## YAML Structure

Each persona YAML file has exactly 3 fields:

```yaml
scenario: >
  A 2-4 sentence description of what the user is trying to accomplish.
  Be specific about topics, countries, and data types.

user_description: >
  A 3-5 sentence character profile. Include: name, age, role, expertise level,
  and HOW they ask questions (step-by-step vs all-at-once, technical vs casual).
  This controls the simulator LLM's behavior.

expected_outcome: >
  ALL of the following must be achieved before the conversation is complete:
  (1) First specific, verifiable goal...
  (2) Second goal...
  (3) Third goal...
  (4) Fourth goal...
  (5) Fifth goal...
```

## Critical Rules

1. **expected_outcome MUST start with "ALL of the following must be achieved before the conversation is complete:"**
2. **expected_outcome must have exactly 4-5 numbered sub-goals** -- each must be specific and verifiable
3. **Sub-goals should reference concrete chatbot behaviors**: claim tags, source citations, markdown tables, chart links, API URLs, limitations sections, etc.
4. **user_description should define conversation pacing** (step-by-step is preferred -- one question at a time)
5. **scenario should name specific countries, indicators, or topics** -- never be vague
6. **Use the YAML block scalar `>` for multi-line strings** (folds newlines into spaces)
7. Output ONLY valid YAML -- no markdown fencing, no comments, no explanations
"""


def _generate_single_persona(client, key, brief, system_prompt, examples):
    """Generate a single persona YAML using the LLM."""
    user_prompt = f"""Generate a persona YAML file for the persona key: `{key}`

**Role brief:** {brief}

Here are 2 examples of well-written personas for reference (do NOT copy them -- use as style guide only):

--- Example 1 ---
{examples[0]}
--- Example 2 ---
{examples[1]}
---

Now generate the YAML for `{key}`. Output ONLY the raw YAML content, no markdown fencing."""

    response = client.chat.completions.create(
        model=GEN_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=1000,
    )

    content = response.choices[0].message.content.strip()
    content = re.sub(r"^```ya?ml\s*\n", "", content)
    content = re.sub(r"\n```\s*$", "", content)
    return content


def _generate_new_persona(client, index, focus, system_prompt, examples, existing_keys):
    """Generate a completely new persona. Returns (key, yaml_content)."""
    focus_instruction = ""
    if focus:
        focus_instruction = f"\n**Theme focus:** {focus}\n"

    existing_list = ", ".join(existing_keys)

    user_prompt = f"""Generate a NEW, UNIQUE persona YAML file (persona #{index}).
{focus_instruction}
**Already existing personas (do NOT duplicate these roles):** {existing_list}

Create a persona that tests a DIFFERENT aspect of the chatbot than the existing ones.
Think about: different regions, different data topics, different user expertise levels,
different interaction patterns, different edge cases.

First, pick a short snake_case key (e.g., `health_researcher`, `trade_analyst`).
Then generate the YAML.

Output format:
KEY: <snake_case_key>
---
<yaml content>

Here are 2 examples for style reference:

--- Example 1 ---
{examples[0]}
--- Example 2 ---
{examples[1]}
---

Output ONLY the key and YAML, nothing else."""

    response = client.chat.completions.create(
        model=GEN_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.9,
        max_tokens=1000,
    )

    content = response.choices[0].message.content.strip()
    content = re.sub(r"^```ya?ml\s*\n", "", content)
    content = re.sub(r"\n```\s*$", "", content)

    # Try format: "KEY: key_name\n---\nyaml..."
    key_match = re.match(r"KEY:\s*(\w+)\s*\n---\s*\n(.*)", content, re.DOTALL)
    if key_match:
        return key_match.group(1), key_match.group(2).strip()

    # Try format: "key_name:\n---\nscenario: ..."
    key_match2 = re.match(r"(\w+):\s*\n---\s*\n(.*)", content, re.DOTALL)
    if key_match2:
        return key_match2.group(1), key_match2.group(2).strip()

    # Try format: "key_name:\n---\n" at top, or "KEY: x" somewhere in content
    lines = content.split("\n")
    key = "persona_%d" % index
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("KEY:"):
            key = stripped.split(":", 1)[1].strip()
            break
        # Single word followed by colon (like "health_researcher:")
        single_key = re.match(r"^(\w+):\s*$", stripped)
        if single_key:
            key = single_key.group(1)
            break

    # Remove key line and document separator, keep just the YAML
    yaml_content = re.sub(r"^(KEY:.*|[\w]+:)\s*\n---\s*\n?", "", content, count=1).strip()
    # Also strip leading --- if present
    yaml_content = re.sub(r"^---\s*\n", "", yaml_content).strip()

    return key, yaml_content


def _validate_yaml(content, key):
    """Validate that generated YAML is well-formed and has required fields."""
    try:
        data = yaml.safe_load(content)
        if not isinstance(data, dict):
            logger.error("[%s] YAML did not parse as a dict", key)
            return False

        for field in ("scenario", "user_description", "expected_outcome"):
            if field not in data:
                logger.error("[%s] Missing required field: %s", key, field)
                return False
            if not data[field] or len(str(data[field]).strip()) < 20:
                logger.error("[%s] Field '%s' is too short", key, field)
                return False

        outcome = str(data["expected_outcome"])
        if "ALL of the following" not in outcome:
            logger.warning("[%s] expected_outcome missing 'ALL of the following' prefix", key)

        goal_count = len(re.findall(r"\(\d+\)", outcome))
        if goal_count < 3:
            logger.warning("[%s] expected_outcome has only %d goals (expected 4-5)", key, goal_count)

        return True

    except yaml.YAMLError as e:
        logger.error("[%s] Invalid YAML: %s", key, e)
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Generate evaluation persona YAML files using an LLM"
    )
    parser.add_argument(
        "--regenerate", action="store_true",
        help="Regenerate all 11 existing personas (using their briefs as input)",
    )
    parser.add_argument(
        "--count", type=int, default=0,
        help="Number of NEW personas to generate (default: 0)",
    )
    parser.add_argument(
        "--focus", type=str, default=None,
        help="Optional theme focus for new personas",
    )
    parser.add_argument(
        "--output", type=str, default="personas_new",
        help="Output directory name inside evals/ (default: personas_new)",
    )
    parser.add_argument(
        "--model", type=str, default=None,
        help="Model to use for generation (default: %s)" % GEN_MODEL,
    )
    args = parser.parse_args()

    if not args.regenerate and args.count == 0:
        parser.error("Must specify --regenerate and/or --count N")

    gen_model = args.model or GEN_MODEL

    output_dir = EVALS_DIR / args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Output directory: %s", output_dir)
    logger.info("Generation model: %s", gen_model)

    client = OpenAI()

    guide_context = _load_guide_context()
    system_prompt = _build_system_prompt(guide_context)

    example_keys = ["student", "adversarial"]
    examples = [_load_existing_persona(k) for k in example_keys]

    generated = []
    failed = []

    if args.regenerate:
        logger.info("Regenerating %d existing personas...", len(EXISTING_PERSONAS))
        for key in EXISTING_PERSONAS:
            brief = PERSONA_BRIEFS.get(key, "Persona: " + key)
            logger.info("  Generating: %s", key)

            try:
                content = _generate_single_persona(
                    client, key, brief, system_prompt, examples
                )

                if _validate_yaml(content, key):
                    out_path = output_dir / (key + ".yaml")
                    out_path.write_text(content + "\n")
                    generated.append(key)
                    logger.info("  OK %s -> %s", key, out_path.name)
                else:
                    failed.append(key)
                    out_path = output_dir / (key + ".yaml.invalid")
                    out_path.write_text(content + "\n")
                    logger.error("  FAIL %s (validation failed, saved as .invalid)", key)

            except Exception as e:
                failed.append(key)
                logger.error("  FAIL %s: %s", key, e)

    if args.count > 0:
        logger.info("Generating %d new personas...", args.count)
        all_keys = list(EXISTING_PERSONAS) + generated

        for i in range(1, args.count + 1):
            logger.info("  Generating new persona #%d", i)

            try:
                key, content = _generate_new_persona(
                    client, i, args.focus, system_prompt, examples, all_keys
                )

                if _validate_yaml(content, key):
                    out_path = output_dir / (key + ".yaml")
                    out_path.write_text(content + "\n")
                    generated.append(key)
                    all_keys.append(key)
                    logger.info("  OK %s -> %s", key, out_path.name)
                else:
                    failed.append(key)
                    out_path = output_dir / (key + ".yaml.invalid")
                    out_path.write_text(content + "\n")
                    logger.error("  FAIL %s (validation failed)", key)

            except Exception as e:
                failed.append("new_" + str(i))
                logger.error("  FAIL new persona #%d: %s", i, e)

    print("")
    print("=" * 60)
    print("  Generated: %d personas" % len(generated))
    if failed:
        print("  Failed:    %d (%s)" % (len(failed), ", ".join(failed)))
    print("  Output:    %s/" % output_dir)
    print("=" * 60)
    print("")

    for f in sorted(output_dir.glob("*.yaml")):
        data = yaml.safe_load(f.read_text())
        scenario_preview = str(data.get("scenario", ""))[:80]
        print("  %s: %s..." % (f.name, scenario_preview))


if __name__ == "__main__":
    main()
