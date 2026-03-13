"""Composable persona builder for evaluation runs.

Assembles full persona definitions (scenario, user_description,
expected_outcome) from reusable base profiles and facets.
"""

from __future__ import annotations

import random
from pathlib import Path

import yaml

BASES_DIR = Path(__file__).parent / "personas" / "bases"
FACETS_DIR = Path(__file__).parent / "personas" / "facets"
TOPICS_DIR = FACETS_DIR / "topics"
COUNTRIES_DIR = FACETS_DIR / "countries"
PATTERNS_DIR = FACETS_DIR / "patterns"


def _load_yaml(path: Path) -> dict:
    """Load a single YAML file and return its contents as a dict."""
    with open(path) as f:
        return yaml.safe_load(f)


def _load_dir(directory: Path) -> dict[str, dict]:
    """Load all YAML files from a directory, keyed by filename stem."""
    result = {}
    for yaml_file in sorted(directory.glob("*.yaml")):
        result[yaml_file.stem] = _load_yaml(yaml_file)
    return result


def load_bases() -> dict[str, dict]:
    """Load all base profiles from personas/bases/."""
    return _load_dir(BASES_DIR)


def load_topics() -> dict[str, dict]:
    """Load all topic facets from personas/facets/topics/."""
    return _load_dir(TOPICS_DIR)


def load_countries() -> dict[str, dict]:
    """Load all country facets from personas/facets/countries/."""
    return _load_dir(COUNTRIES_DIR)


def load_patterns() -> dict[str, dict]:
    """Load all pattern facets from personas/facets/patterns/."""
    return _load_dir(PATTERNS_DIR)


def list_available() -> dict[str, list[str]]:
    """Return lists of available keys for each facet dimension."""
    return {
        "bases": sorted(load_bases().keys()),
        "topics": sorted(load_topics().keys()),
        "countries": sorted(load_countries().keys()),
        "patterns": sorted(load_patterns().keys()),
    }


def compose(
    base_key: str,
    topic_key: str,
    countries_key: str,
    pattern_key: str,
    *,
    variant_index: int | None = None,
) -> dict:
    """Compose a full persona from a base + topic + countries + pattern.

    Args:
        base_key: Key of the base profile (e.g. "student").
        topic_key: Key of the topic facet (e.g. "health_outcomes").
        countries_key: Key of the countries facet (e.g. "south_asia").
        pattern_key: Key of the pattern facet (e.g. "visualize").
        variant_index: If set, pick this specific country variant.
            If None, pick a random one.

    Returns:
        Dict with ``scenario``, ``user_description``, and
        ``expected_outcome`` -- the three fields DeepEval needs.

    Raises:
        KeyError: If any key is not found.
        ValueError: If templates contain unresolved placeholders.
    """
    bases = load_bases()
    topics = load_topics()
    countries = load_countries()
    patterns = load_patterns()

    if base_key not in bases:
        raise KeyError(f"Unknown base '{base_key}'. Available: {sorted(bases.keys())}")
    if topic_key not in topics:
        raise KeyError(f"Unknown topic '{topic_key}'. Available: {sorted(topics.keys())}")
    if countries_key not in countries:
        raise KeyError(
            f"Unknown countries '{countries_key}'. Available: {sorted(countries.keys())}"
        )
    if pattern_key not in patterns:
        raise KeyError(f"Unknown pattern '{pattern_key}'. Available: {sorted(patterns.keys())}")

    base = bases[base_key]
    topic = topics[topic_key]
    country = countries[countries_key]
    pattern = patterns[pattern_key]

    # Pick a country variant
    variants = country.get("variants", [{"geo": country.get("region", "")}])
    if variant_index is not None:
        if variant_index >= len(variants):
            raise ValueError(
                f"variant_index {variant_index} out of range (max {len(variants) - 1})"
            )
        variant = variants[variant_index]
    else:
        variant = random.choice(variants)

    # Build the template context by merging all facets + base defaults
    ctx = {}
    ctx.update(base.get("defaults", {}))
    ctx.update(topic)
    ctx.update(variant)
    ctx.update(pattern)
    ctx["region"] = country.get("region", "")

    # Resolve nested placeholders in pattern_outcomes (it may contain {geo})
    if "pattern_outcomes" in ctx and "{" in ctx["pattern_outcomes"]:
        ctx["pattern_outcomes"] = ctx["pattern_outcomes"].format(**ctx)

    # Fill templates
    scenario = base["scenario_template"].format(**ctx)
    user_description = base["user_description_template"].format(**ctx)
    expected_outcome = base["expected_outcome_template"].format(**ctx)

    # Validate no unresolved placeholders remain
    for field_name, value in [
        ("scenario", scenario),
        ("user_description", user_description),
        ("expected_outcome", expected_outcome),
    ]:
        if "{" in value and "}" in value:
            raise ValueError(f"Unresolved placeholder in {field_name}: {value}")

    composed_key = f"{base_key}:{topic_key}:{countries_key}:{pattern_key}"
    return {
        "scenario": scenario.strip(),
        "user_description": user_description.strip(),
        "expected_outcome": expected_outcome.strip(),
        "_composed_from": composed_key,
        "_geo": variant["geo"],
        "_scope": variant.get("scope", "unknown"),
    }


def compose_random(
    base_key: str,
    *,
    topic_keys: list[str] | None = None,
    countries_keys: list[str] | None = None,
    pattern_keys: list[str] | None = None,
) -> dict:
    """Compose a persona with random facets for the given base.

    Optionally restrict the pool of facets to choose from.

    Args:
        base_key: Key of the base profile.
        topic_keys: Restrict to these topics (default: all).
        countries_keys: Restrict to these countries (default: all).
        pattern_keys: Restrict to these patterns (default: all).

    Returns:
        Composed persona dict (same format as ``compose``).
    """
    all_topics = list(load_topics().keys())
    all_countries = list(load_countries().keys())
    all_patterns = list(load_patterns().keys())

    topic = random.choice(topic_keys or all_topics)
    country = random.choice(countries_keys or all_countries)
    pattern = random.choice(pattern_keys or all_patterns)

    return compose(base_key, topic, country, pattern)
