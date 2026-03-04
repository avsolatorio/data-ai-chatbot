"""
Generate persona YAML files for Data360 Chat evaluation.

Creates ConversationalGolden-compatible persona files in two modes:

  1. --from-docs: Read MVP feature/user-story documents and infer
     realistic chatbot-user personas with scenarios, user descriptions,
     and expected outcomes.

  2. --describe: Provide a freeform text description and let the LLM
     create a single persona YAML from it.

Output format matches existing persona YAMLs (scenario, user_description,
expected_outcome) and works directly with run_conversation_eval.py.

Usage:
    # Generate personas from MVP docs (infers user types automatically)
    python -m evals.generate_personas \
        --from-docs evals/mvp_features.md evals/mvp_user_stories.md

    # Generate a single persona from a description
    python -m evals.generate_personas \
        --describe "A blind user using a screen reader who wants poverty data"

    # Generate with custom count and model
    python -m evals.generate_personas \
        --from-docs evals/mvp_features.md --count 5 --model gpt-4.1

    # Preview without saving (dry-run)
    python -m evals.generate_personas \
        --describe "An economist comparing GDP" --dry-run
"""

from __future__ import annotations

import argparse
import json
import logging
import re
from pathlib import Path

import yaml

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("generate_personas")

PERSONAS_DIR = Path(__file__).parent / "personas"

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_EXAMPLE_PERSONA = """\
```yaml
scenario: >
  A graduate student is writing a thesis chapter on East African
  economic development. They need to find Kenya's GDP data, compare
  it with Tanzania in a table, visualize the comparison with a chart,
  understand the methodology and limitations of the indicators, and
  get follow-up suggestions leading to deeper analysis.

user_description: >
  Maria is a 24-year-old economics master's student at the University
  of Nairobi. She is writing her thesis on economic growth in East Africa.
  She speaks clearly but is not an expert in data APIs. She asks for data
  step by step: first GDP, then comparison, then a chart, then methodology.
  She occasionally asks follow-up questions about what the data means.
  She always asks for the next logical step rather than dumping all
  questions at once.

expected_outcome: >
  ALL of the following must be achieved before the conversation is complete:
  (1) The student retrieves Kenya's GDP data with specific numerical values
  wrapped in claim tags and a clear data source citation.
  (2) The student gets a side-by-side comparison table of Kenya vs Tanzania
  GDP data with units and time periods.
  (3) A chart or visualization is generated showing the GDP trends,
  presented as a clickable markdown link.
  (4) The student learns about the methodology or limitations of the
  GDP indicator, including the data source or measurement approach.
  (5) The chatbot suggests relevant follow-up questions for deeper analysis.
```"""

_PERSONA_RULES = """\
RULES:
1. Each persona MUST test DIFFERENT chatbot capabilities.
2. The `scenario` describes WHAT HAPPENS — a realistic situation where someone
   uses the chatbot. It should describe a multi-step interaction, not a single
   question. Name specific countries, indicators, or topics.
3. The `user_description` describes WHO the user is — their name, age, role,
   technical literacy, and HOW they ask questions (step-by-step, one at a time,
   waits for each response). Include personality traits.
4. The `expected_outcome` lists SPECIFIC, TESTABLE criteria that must ALL be met.
   Start with "ALL of the following must be achieved before the conversation is
   complete:" then use numbered items (1), (2), (3), etc. Include 4-5 goals.
   Reference concrete chatbot behaviors: claim tags, source citations, markdown
   tables, chart links, API URLs, limitations notices, follow-up suggestions.
5. The `key` is a lowercase_snake_case identifier for the persona file name.
6. Scenarios should describe concrete data queries and chatbot usage — not
   abstract discussions about the chatbot's features."""

_FROM_DOCS_SYSTEM = """\
You are an evaluation engineer for Data360 Chat, a conversational AI that \
provides authoritative development data (GDP, poverty, health indicators, etc.) \
from the World Bank's Data360 platform.

Your task: read the provided product documents and generate {count} DISTINCT \
evaluation personas. Each persona represents a realistic user who would \
interact with this chatbot.

{rules}

Personas should span diverse user types: policymakers, students, journalists, \
analysts, technical users, multilingual users, adversarial testers, etc.

Here is an example of a well-written persona:

{example}

You MUST respond with valid JSON. Use a JSON object with a "personas" key \
containing an array of {count} objects, each with keys: key, scenario, \
user_description, expected_outcome."""

_FROM_DOCS_USER = """\
Here are the product documents:

{doc_blocks}

Generate {count} personas as JSON."""

_DESCRIBE_SYSTEM = """\
You are an evaluation engineer for Data360 Chat, a conversational AI that \
provides authoritative development data (GDP, poverty, health indicators, etc.) \
from the World Bank's Data360 platform.

Your task: given a user's description of a persona they want to create, \
generate a complete evaluation persona.

{rules}

Here is an example of an existing persona:

{example}

You MUST respond with valid JSON. Use a JSON object with keys: key, scenario, \
user_description, expected_outcome."""

_DESCRIBE_USER = """\
Create a persona based on this description:

{description}

Respond with a single JSON object."""


# ---------------------------------------------------------------------------
# Core functions
# ---------------------------------------------------------------------------

def _call_llm(
    system_prompt: str,
    user_prompt: str,
    model: str = "gpt-4.1-mini",
    temperature: float = 0.7,
) -> str:
    """Call the OpenAI API and return the response text."""
    from openai import OpenAI

    client = OpenAI()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content.strip()


def _parse_json_response(text: str) -> list[dict] | dict:
    """Extract JSON from an LLM response."""
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.MULTILINE)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned, flags=re.MULTILINE)
    result = json.loads(cleaned)

    # Handle {"personas": [...]} wrapper
    if isinstance(result, dict) and "personas" in result:
        return result["personas"]

    return result


def _validate_persona(persona: dict) -> bool:
    """Validate that a persona dict has required fields."""
    for field in ("key", "scenario", "user_description", "expected_outcome"):
        if field not in persona:
            logger.error("Missing required field: %s", field)
            return False
        if not persona[field] or len(str(persona[field]).strip()) < 20:
            logger.error("Field '%s' is too short", field)
            return False

    outcome = str(persona["expected_outcome"])
    if "ALL of the following" not in outcome:
        logger.warning(
            "[%s] expected_outcome missing 'ALL of the following' prefix",
            persona["key"],
        )

    goal_count = len(re.findall(r"\(\d+\)", outcome))
    if goal_count < 3:
        logger.warning(
            "[%s] expected_outcome has only %d goals (expected 4-5)",
            persona["key"], goal_count,
        )

    return True


def _save_persona_yaml(
    persona: dict,
    output_dir: Path,
    overwrite: bool = False,
) -> Path:
    """Save a persona dict as a YAML file."""
    key = persona["key"]
    filepath = output_dir / f"{key}.yaml"

    if filepath.exists() and not overwrite:
        logger.warning(
            "File already exists, skipping: %s (use --overwrite)", filepath
        )
        return filepath

    data = {
        "scenario": persona["scenario"].strip(),
        "user_description": persona["user_description"].strip(),
        "expected_outcome": persona["expected_outcome"].strip(),
    }

    content = yaml.dump(
        data,
        default_flow_style=False,
        allow_unicode=True,
        width=72,
        sort_keys=False,
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    filepath.write_text(content)
    return filepath


def generate_from_docs(
    doc_paths: list[str],
    count: int = 6,
    model: str = "gpt-4.1-mini",
    output_dir: Path | None = None,
    overwrite: bool = False,
    dry_run: bool = False,
) -> list[dict]:
    """Generate personas by reading documents and inferring user types."""
    output_dir = output_dir or PERSONAS_DIR

    doc_blocks = []
    for p in doc_paths:
        path = Path(p)
        if not path.exists():
            logger.warning("Document not found, skipping: %s", p)
            continue
        doc_blocks.append(
            f"--- DOCUMENT: {path.name} ---\n{path.read_text()}\n--- END ---"
        )

    if not doc_blocks:
        raise FileNotFoundError(f"No valid documents found: {doc_paths}")

    logger.info(
        "Generating %d personas from %d document(s) using %s...",
        count, len(doc_blocks), model,
    )

    system = _FROM_DOCS_SYSTEM.format(
        count=count, rules=_PERSONA_RULES, example=_EXAMPLE_PERSONA,
    )
    user = _FROM_DOCS_USER.format(
        doc_blocks="\n\n".join(doc_blocks), count=count,
    )

    raw = _call_llm(system, user, model=model)
    personas = _parse_json_response(raw)

    if not isinstance(personas, list):
        personas = [personas]

    logger.info("Generated %d personas", len(personas))

    valid_personas = []
    for persona in personas:
        if not _validate_persona(persona):
            logger.error("  INVALID: %s -- skipping", persona.get("key", "?"))
            continue

        valid_personas.append(persona)
        logger.info(
            "  [%s] %s",
            persona["key"],
            persona["scenario"][:80] + "...",
        )

        if not dry_run:
            filepath = _save_persona_yaml(
                persona, output_dir, overwrite=overwrite,
            )
            logger.info("    -> Saved: %s", filepath)
        else:
            print(f"\n--- {persona['key']} ---")
            print(yaml.dump(
                {k: persona[k] for k in ("scenario", "user_description", "expected_outcome")},
                default_flow_style=False, allow_unicode=True,
                width=72, sort_keys=False,
            ))

    return valid_personas


def generate_from_description(
    description: str,
    model: str = "gpt-4.1-mini",
    output_dir: Path | None = None,
    overwrite: bool = False,
    dry_run: bool = False,
) -> dict:
    """Generate a single persona from a freeform text description."""
    output_dir = output_dir or PERSONAS_DIR

    logger.info("Generating persona from description using %s...", model)
    logger.info("  Description: %s", description[:120])

    system = _DESCRIBE_SYSTEM.format(
        rules=_PERSONA_RULES, example=_EXAMPLE_PERSONA,
    )
    user = _DESCRIBE_USER.format(description=description)
    raw = _call_llm(system, user, model=model)
    persona = _parse_json_response(raw)

    if isinstance(persona, list):
        persona = persona[0]

    if not _validate_persona(persona):
        logger.error("Generated persona failed validation")
        return persona

    logger.info(
        "Generated persona: [%s] %s",
        persona["key"], persona["scenario"][:80] + "...",
    )

    if not dry_run:
        filepath = _save_persona_yaml(
            persona, output_dir, overwrite=overwrite,
        )
        logger.info("  -> Saved: %s", filepath)
    else:
        print(f"\n--- {persona['key']} ---")
        print(yaml.dump(
            {k: persona[k] for k in ("scenario", "user_description", "expected_outcome")},
            default_flow_style=False, allow_unicode=True,
            width=72, sort_keys=False,
        ))

    return persona


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Generate persona YAML files for Data360 Chat evaluation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  # Generate personas from MVP docs
  python -m evals.generate_personas \\
      --from-docs evals/mvp_features.md evals/mvp_user_stories.md

  # Generate a single persona from a description
  python -m evals.generate_personas \\
      --describe "A blind user using a screen reader"

  # Preview without saving
  python -m evals.generate_personas \\
      --describe "An economist comparing GDP" --dry-run

  # Generate 10 personas with a specific model
  python -m evals.generate_personas \\
      --from-docs evals/mvp_features.md --count 10 --model gpt-4.1
""",
    )

    # Mode: mutually exclusive
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--from-docs",
        nargs="+",
        metavar="DOC",
        help="Document paths to infer personas from",
    )
    mode.add_argument(
        "--describe",
        type=str,
        help='Freeform persona description (e.g., "A blind user...")',
    )

    # Common options
    parser.add_argument(
        "--count",
        type=int,
        default=6,
        help="Number of personas to generate (--from-docs only, default: 6)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gpt-4.1-mini",
        help="LLM model to use (default: gpt-4.1-mini)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Output directory for YAML files (default: evals/personas/)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing persona files with the same key",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print generated personas without saving to files",
    )

    args = parser.parse_args()

    output_dir = Path(args.output_dir) if args.output_dir else None

    if args.from_docs:
        personas = generate_from_docs(
            doc_paths=args.from_docs,
            count=args.count,
            model=args.model,
            output_dir=output_dir,
            overwrite=args.overwrite,
            dry_run=args.dry_run,
        )

        print(f"\n{'=' * 60}")
        print(f"  Generated {len(personas)} personas")
        if not args.dry_run:
            print(f"  Output: {output_dir or PERSONAS_DIR}/")
        print(f"{'=' * 60}")

    elif args.describe:
        persona = generate_from_description(
            description=args.describe,
            model=args.model,
            output_dir=output_dir,
            overwrite=args.overwrite,
            dry_run=args.dry_run,
        )

        print(f"\n{'=' * 60}")
        print(f"  Generated persona: {persona.get('key', '?')}")
        if not args.dry_run:
            print(f"  Output: {output_dir or PERSONAS_DIR}/{persona['key']}.yaml")
        print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
