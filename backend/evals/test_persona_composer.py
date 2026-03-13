"""Tests for persona_composer.py."""

import pytest

from evals.persona_composer import (
    compose,
    compose_random,
    list_available,
    load_bases,
    load_countries,
    load_patterns,
    load_topics,
)


class TestLoadFunctions:
    """Test that YAML loading works for all facets."""

    def test_load_bases(self):
        bases = load_bases()
        assert len(bases) == 6
        assert "student" in bases
        assert "decision_maker" in bases
        for key, base in bases.items():
            assert "scenario_template" in base, f"{key} missing scenario_template"
            assert "user_description_template" in base, f"{key} missing user_description_template"
            assert "expected_outcome_template" in base, f"{key} missing expected_outcome_template"

    def test_load_topics(self):
        topics = load_topics()
        assert len(topics) >= 10
        for key, topic in topics.items():
            assert "topic_concept" in topic, f"{key} missing topic_concept"
            assert "topic_terms" in topic, f"{key} missing topic_terms"

    def test_load_countries(self):
        countries = load_countries()
        assert len(countries) >= 5
        for key, country in countries.items():
            assert "region" in country, f"{key} missing region"
            assert "variants" in country, f"{key} missing variants"
            assert len(country["variants"]) >= 2, f"{key} has too few variants"

    def test_load_patterns(self):
        patterns = load_patterns()
        assert len(patterns) >= 8
        for key, pattern in patterns.items():
            assert "pattern_description" in pattern, f"{key} missing pattern_description"
            assert "pattern_outcomes" in pattern, f"{key} missing pattern_outcomes"


class TestCompose:
    """Test the compose function."""

    def test_compose_produces_required_fields(self):
        result = compose(
            "student",
            "health_outcomes",
            "south_asia",
            "visualize",
            variant_index=0,
        )
        assert "scenario" in result
        assert "user_description" in result
        assert "expected_outcome" in result

    def test_compose_fills_all_placeholders(self):
        result = compose(
            "student",
            "health_outcomes",
            "south_asia",
            "visualize",
            variant_index=0,
        )
        for field in ("scenario", "user_description", "expected_outcome"):
            value = result[field]
            assert "{" not in value, f"Unresolved placeholder in {field}: {value}"

    def test_compose_all_base_topic_combinations(self):
        """Every base x first topic x first country x first pattern must resolve."""
        bases = list(load_bases().keys())
        first_topic = list(load_topics().keys())[0]
        first_country = list(load_countries().keys())[0]
        first_pattern = list(load_patterns().keys())[0]

        for base_key in bases:
            result = compose(
                base_key,
                first_topic,
                first_country,
                first_pattern,
                variant_index=0,
            )
            for field in ("scenario", "user_description", "expected_outcome"):
                assert "{" not in result[field], (
                    f"Unresolved placeholder for base={base_key}: {result[field]}"
                )

    def test_compose_with_specific_variant(self):
        result = compose(
            "student",
            "health_outcomes",
            "south_asia",
            "visualize",
            variant_index=3,
        )
        assert "India and Bangladesh" in result["scenario"]

    def test_compose_records_metadata(self):
        result = compose(
            "student",
            "health_outcomes",
            "south_asia",
            "visualize",
            variant_index=0,
        )
        assert result["_composed_from"] == "student:health_outcomes:south_asia:visualize"
        assert result["_geo"] == "South Asia"

    def test_compose_unknown_base_raises(self):
        with pytest.raises(KeyError, match="Unknown base"):
            compose("nonexistent", "health_outcomes", "south_asia", "visualize")

    def test_compose_unknown_topic_raises(self):
        with pytest.raises(KeyError, match="Unknown topic"):
            compose("student", "nonexistent", "south_asia", "visualize")

    def test_compose_invalid_variant_raises(self):
        with pytest.raises(ValueError, match="variant_index"):
            compose(
                "student",
                "health_outcomes",
                "south_asia",
                "visualize",
                variant_index=999,
            )


class TestComposeRandom:
    """Test the compose_random function."""

    def test_compose_random_produces_valid_output(self):
        result = compose_random("student")
        assert "scenario" in result
        assert "user_description" in result
        assert "expected_outcome" in result
        for field in ("scenario", "user_description", "expected_outcome"):
            assert "{" not in result[field]

    def test_compose_random_varies(self):
        """Two random compositions should differ (with high probability)."""
        results = set()
        for _ in range(10):
            r = compose_random("student")
            results.add(r["_composed_from"] + "|" + r["_geo"])
        # With 10 topics x 5 countries x 8 patterns x ~5 variants,
        # 10 draws should produce at least 2 distinct combos.
        assert len(results) >= 2, "Random compositions produced no variation"


class TestListAvailable:
    """Test the list_available function."""

    def test_list_available_returns_all_dimensions(self):
        available = list_available()
        assert "bases" in available
        assert "topics" in available
        assert "countries" in available
        assert "patterns" in available
        assert len(available["bases"]) == 6
        assert len(available["topics"]) >= 10
        assert len(available["countries"]) >= 5
        assert len(available["patterns"]) >= 8
