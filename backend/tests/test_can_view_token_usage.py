"""
Unit tests for the canViewTokenUsage field on GET /api/auth/me
and the shared get_reviewer_emails() helper in deps.py.

These tests exercise the logic that determines whether a given user's email
is in the FEEDBACK_REVIEWER_EMAILS allowlist. They mock the DB user lookup
and settings to avoid requiring a live database.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.api.deps import get_reviewer_emails
from app.api.v1.auth import get_current_user_info

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(email: str, name: str | None = None) -> MagicMock:
    """Return a minimal mock user object."""
    user = MagicMock()
    user.id = "00000000-0000-0000-0000-000000000001"
    user.email = email
    user.type = "regular"
    user.name = name
    return user


def _make_request() -> MagicMock:
    return MagicMock()


# ---------------------------------------------------------------------------
# Tests for get_reviewer_emails() helper
# ---------------------------------------------------------------------------


def test_get_reviewer_emails_parses_comma_separated():
    with patch("app.api.deps.settings") as mock_settings:
        mock_settings.FEEDBACK_REVIEWER_EMAILS = "a@example.com, B@example.com , c@example.com"
        result = get_reviewer_emails()
    assert result == {"a@example.com", "b@example.com", "c@example.com"}


def test_get_reviewer_emails_returns_empty_set_when_blank():
    with patch("app.api.deps.settings") as mock_settings:
        mock_settings.FEEDBACK_REVIEWER_EMAILS = ""
        result = get_reviewer_emails()
    assert result == set()


def test_get_reviewer_emails_handles_none():
    with patch("app.api.deps.settings") as mock_settings:
        mock_settings.FEEDBACK_REVIEWER_EMAILS = None
        result = get_reviewer_emails()
    assert result == set()


# ---------------------------------------------------------------------------
# Integration tests for canViewTokenUsage field on /api/auth/me
#
# NOTE: patch target is app.api.deps.settings because get_reviewer_emails()
# now reads settings from that module (not from auth.py).
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_can_view_token_usage_is_true_for_reviewer():
    """User in FEEDBACK_REVIEWER_EMAILS gets canViewTokenUsage=True."""
    user = _make_user("reviewer@example.com")
    reviewer_emails = "reviewer@example.com,other@example.com"

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.FEEDBACK_REVIEWER_EMAILS = reviewer_emails
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    # result may be a JSONResponse or dict depending on restoration flag
    data = result if isinstance(result, dict) else result.body
    if not isinstance(result, dict):
        import json

        data = json.loads(data)

    assert data["canViewTokenUsage"] is True


@pytest.mark.asyncio
async def test_can_view_token_usage_is_false_for_non_reviewer():
    """User NOT in FEEDBACK_REVIEWER_EMAILS gets canViewTokenUsage=False."""
    user = _make_user("regular@example.com")
    reviewer_emails = "reviewer@example.com"

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.FEEDBACK_REVIEWER_EMAILS = reviewer_emails
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = result if isinstance(result, dict) else result.body
    if not isinstance(result, dict):
        import json

        data = json.loads(data)

    assert data["canViewTokenUsage"] is False


@pytest.mark.asyncio
async def test_can_view_token_usage_is_false_when_list_empty():
    """When FEEDBACK_REVIEWER_EMAILS is empty, all users get canViewTokenUsage=False."""
    user = _make_user("anyone@example.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.FEEDBACK_REVIEWER_EMAILS = ""
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = result if isinstance(result, dict) else result.body
    if not isinstance(result, dict):
        import json

        data = json.loads(data)

    assert data["canViewTokenUsage"] is False


@pytest.mark.asyncio
async def test_can_view_token_usage_is_case_insensitive():
    """Email comparison is case-insensitive."""
    user = _make_user("Reviewer@Example.COM")
    reviewer_emails = "reviewer@example.com"

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.FEEDBACK_REVIEWER_EMAILS = reviewer_emails
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = result if isinstance(result, dict) else result.body
    if not isinstance(result, dict):
        import json

        data = json.loads(data)

    assert data["canViewTokenUsage"] is True
