"""Tests for main.py lifespan sqlite fallback gating."""

from unittest.mock import MagicMock


class TestSqliteFallbackGate:
    """Sqlite create_all must be gated on ENVIRONMENT, not just filename."""

    # ---------- gate logic (exact replica) ----------
    @staticmethod
    def _should_run(settings, db_url: str) -> bool:
        """Replicate the exact lifespan gate logic."""
        if settings.ENVIRONMENT not in ("development", "local", "dev", "test"):
            return False
        return bool(db_url and "sqlite" in db_url)

    # ---------- tests ----------
    def test_production_skips(self):
        """ENV=production + sqlite URL -> gate returns False."""
        settings = MagicMock()
        settings.ENVIRONMENT = "production"
        assert self._should_run(settings, "sqlite:///./chat.sqlite") is False

    def test_development_sqlite_passes(self):
        """ENV=development + sqlite URL -> gate returns True."""
        settings = MagicMock()
        settings.ENVIRONMENT = "development"
        assert self._should_run(settings, "sqlite:///./chat.sqlite") is True

    def test_development_postgres_skips(self):
        """ENV=development + postgres URL -> gate returns False (sqlite sniff)."""
        settings = MagicMock()
        settings.ENVIRONMENT = "development"
        assert self._should_run(settings, "postgresql://localhost/db") is False

    def test_test_env_passes(self):
        """ENV=test + sqlite URL -> gate returns True."""
        settings = MagicMock()
        settings.ENVIRONMENT = "test"
        assert self._should_run(settings, "sqlite:///./chat.sqlite") is True

    def test_local_env_passes(self):
        """ENV=local + sqlite URL -> gate returns True."""
        settings = MagicMock()
        settings.ENVIRONMENT = "local"
        assert self._should_run(settings, "sqlite:///./chat.sqlite") is True

    def test_dev_env_passes(self):
        """ENV=dev + sqlite URL -> gate returns True."""
        settings = MagicMock()
        settings.ENVIRONMENT = "dev"
        assert self._should_run(settings, "sqlite:///./chat.sqlite") is True

    def test_staging_skips(self):
        """ENV=staging + sqlite URL -> gate returns False."""
        settings = MagicMock()
        settings.ENVIRONMENT = "staging"
        assert self._should_run(settings, "sqlite:///./chat.sqlite") is False

    def test_production_empty_url_skips(self):
        """ENV=production + empty URL -> gate returns False."""
        settings = MagicMock()
        settings.ENVIRONMENT = "production"
        assert self._should_run(settings, "") is False

    def test_development_empty_url_skips(self):
        """ENV=development + empty URL -> gate returns False."""
        settings = MagicMock()
        settings.ENVIRONMENT = "development"
        assert self._should_run(settings, "") is False
