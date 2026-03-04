"""
Generate synthetic ConversationalGoldens from documents using DeepEval's Synthesizer.

Uses DeepEval's built-in document-to-golden pipeline to create multi-turn
conversation scenarios from your knowledge base documents.

Prerequisites:
    pip install chromadb langchain-core langchain-community langchain-text-splitters

Usage:
    # Generate from documents
    python -m evals.generate_goldens \\
        --docs path/to/doc1.md path/to/doc2.pdf \\
        --output evals/goldens/generated.json

    # Use config file settings
    python -m evals.generate_goldens --config evals/eval_config.yaml

    # Customize generation
    python -m evals.generate_goldens \\
        --docs README.md \\
        --max-goldens 5 \\
        --chunk-size 512
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("generate_goldens")


def _load_synthesizer_config(config_path: str | None = None) -> dict:
    """Load synthesizer settings from eval config."""
    import yaml

    path = Path(config_path) if config_path else Path(__file__).parent / "eval_config.yaml"
    if not path.exists():
        return {}

    config = yaml.safe_load(path.read_text())
    return config.get("synthesizer", {})


def generate_goldens(
    document_paths: list[str],
    max_goldens_per_context: int = 2,
    chunk_size: int = 1024,
    chunk_overlap: int = 0,
    max_contexts_per_document: int = 3,
    output_path: str | None = None,
) -> list[dict]:
    """Generate ConversationalGoldens from documents.

    Args:
        document_paths: Paths to documents to generate goldens from.
        max_goldens_per_context: Max goldens per context chunk.
        chunk_size: Size of document chunks.
        chunk_overlap: Overlap between chunks.
        max_contexts_per_document: Max contexts to extract per document.
        output_path: Path to save generated goldens JSON.

    Returns:
        List of golden dicts with scenario, user_description, expected_outcome.
    """
    from deepeval.synthesizer import Synthesizer
    from deepeval.synthesizer.config import ContextConstructionConfig

    # Validate document paths
    valid_paths = []
    for p in document_paths:
        path = Path(p)
        if not path.exists():
            logger.warning("Document not found, skipping: %s", p)
            continue
        valid_paths.append(str(path))

    if not valid_paths:
        raise FileNotFoundError(
            f"No valid documents found. Checked: {document_paths}"
        )

    logger.info("Generating goldens from %d document(s):", len(valid_paths))
    for p in valid_paths:
        logger.info("  - %s", p)

    # Configure context construction
    context_config = ContextConstructionConfig(
        max_contexts_per_document=max_contexts_per_document,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    # Create synthesizer and generate multi-turn goldens
    synthesizer = Synthesizer()
    goldens = synthesizer.generate_conversational_goldens_from_docs(
        document_paths=valid_paths,
        max_goldens_per_context=max_goldens_per_context,
        context_construction_config=context_config,
        include_expected_outcome=True,
    )

    logger.info("Generated %d conversational goldens", len(goldens))

    # Convert to serializable format
    results = []
    for i, golden in enumerate(goldens):
        entry = {
            "key": f"synth_{i}",
            "scenario": golden.scenario or "",
            "user_description": golden.user_description or "",
            "expected_outcome": golden.expected_outcome or "",
            "source": "synthesizer",
        }
        results.append(entry)
        logger.info(
            "  Golden %d: %s", i + 1,
            (entry["scenario"][:80] + "...") if len(entry["scenario"]) > 80 else entry["scenario"],
        )

    # Save to file
    if output_path:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(results, indent=2))
        logger.info("Saved %d goldens to: %s", len(results), out)

    return results


# ---------------------------------------------------------------------------
# Post-processing: enrich goldens with user_description
# ---------------------------------------------------------------------------

_ENRICH_PROMPT = """\
You are helping prepare evaluation data for a development data chatbot.

Given a conversation scenario, extract the PRIMARY user persona — the person
who will be asking questions of the chatbot. Write a concise user_description
(2-3 sentences) that includes:
1. Their role/title (e.g., "A government policy analyst")
2. Their technical literacy level
3. What they need from the chatbot

Scenario:
{scenario}

Expected outcome:
{expected_outcome}

Respond with ONLY the user_description text, nothing else.
"""


def enrich_goldens_with_user_descriptions(
    goldens: list[dict],
    model: str = "gpt-4.1-mini",
) -> list[dict]:
    """Post-process goldens to add user_description from scenarios.

    Uses the LLM to extract the primary user persona from each scenario
    and populate the user_description field.

    Args:
        goldens: List of golden dicts (must have 'scenario', 'expected_outcome').
        model: LLM model to use for extraction.

    Returns:
        The same list with user_description populated.
    """
    from openai import OpenAI

    client = OpenAI()
    enriched_count = 0

    for i, golden in enumerate(goldens):
        # Skip if already has a user_description
        if golden.get("user_description"):
            logger.info("  Golden %d: already has user_description, skipping", i + 1)
            continue

        prompt = _ENRICH_PROMPT.format(
            scenario=golden.get("scenario", ""),
            expected_outcome=golden.get("expected_outcome", ""),
        )

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3,
            )
            user_desc = response.choices[0].message.content.strip()
            golden["user_description"] = user_desc
            enriched_count += 1
            logger.info(
                "  Golden %d: %s",
                i + 1, user_desc[:80] + "..." if len(user_desc) > 80 else user_desc,
            )
        except Exception as e:
            logger.error("  Golden %d: enrichment failed: %s", i + 1, e)

    logger.info("Enriched %d/%d goldens with user_description", enriched_count, len(goldens))
    return goldens


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic ConversationalGoldens from documents"
    )
    parser.add_argument(
        "--docs",
        nargs="+",
        default=None,
        help="Document paths to generate goldens from",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="evals/goldens/generated.json",
        help="Output JSON file path (default: evals/goldens/generated.json)",
    )
    parser.add_argument(
        "--max-goldens",
        type=int,
        default=None,
        help="Max goldens per context (default: from config or 2)",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=None,
        help="Document chunk size (default: from config or 1024)",
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to eval config YAML",
    )
    parser.add_argument(
        "--enrich",
        action="store_true",
        help="Post-process goldens to add user_description via LLM",
    )
    parser.add_argument(
        "--enrich-only",
        type=str,
        default=None,
        help="Path to existing goldens JSON to enrich (skips generation)",
    )
    parser.add_argument(
        "--enrich-model",
        type=str,
        default="gpt-4.1-mini",
        help="LLM model for user_description extraction (default: gpt-4.1-mini)",
    )

    args = parser.parse_args()

    # Enrich-only mode: skip generation, just post-process existing file
    if args.enrich_only:
        path = Path(args.enrich_only)
        if not path.exists():
            parser.error(f"Goldens file not found: {path}")

        goldens = json.loads(path.read_text())
        logger.info("Enriching %d goldens from %s", len(goldens), path)

        goldens = enrich_goldens_with_user_descriptions(
            goldens, model=args.enrich_model,
        )

        # Save back
        out = Path(args.output) if args.output != "evals/goldens/generated.json" else path
        out.write_text(json.dumps(goldens, indent=2))
        logger.info("Saved enriched goldens to: %s", out)
        return

    # Load config for defaults
    synth_config = _load_synthesizer_config(args.config)
    ctx_config = synth_config.get("context_construction", {})

    # Resolve document paths (CLI > config > error)
    doc_paths = args.docs or synth_config.get("document_paths", [])
    if not doc_paths:
        parser.error(
            "No documents specified. Use --docs or set "
            "synthesizer.document_paths in eval_config.yaml"
        )

    results = generate_goldens(
        document_paths=doc_paths,
        max_goldens_per_context=args.max_goldens or synth_config.get("max_goldens_per_context", 2),
        chunk_size=args.chunk_size or ctx_config.get("chunk_size", 1024),
        chunk_overlap=ctx_config.get("chunk_overlap", 0),
        max_contexts_per_document=ctx_config.get("max_contexts_per_document", 3),
        output_path=args.output,
    )

    # Post-process if requested
    if args.enrich:
        logger.info("Enriching goldens with user_description...")
        results = enrich_goldens_with_user_descriptions(
            results, model=args.enrich_model,
        )
        # Re-save with enriched data
        if args.output:
            out = Path(args.output)
            out.write_text(json.dumps(results, indent=2))
            logger.info("Re-saved enriched goldens to: %s", out)


if __name__ == "__main__":
    main()

