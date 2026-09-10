"""Ensure the release-please manifest stays in sync with the config package keys."""

import json
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]

CONFIG_PATH = REPO_ROOT / ".github" / "release-please-config.json"
MANIFEST_PATH = REPO_ROOT / ".github" / "release-please-manifest.json"


@pytest.fixture
def release_config() -> dict:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


@pytest.fixture
def release_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_manifest_keys_match_config_packages(release_config: dict, release_manifest: dict) -> None:
    expected = set(release_config["packages"])
    actual = set(release_manifest)
    assert actual == expected, (
        f"release-please-manifest keys {actual!r} must match config packages {expected!r}"
    )
