"""
Role matrix tests: admin supersedes reviewer.

Admin (ADMIN_EMAILS) is the super-role — gets everything, including
reviewer powers (canViewTokenUsage). Reviewer (FEEDBACK_REVIEWER_EMAILS)
is a sub-role.

Part A — /api/auth/me flag tests (canViewAdmin, canViewTokenUsage):
  1. Sole reviewer  -> canViewAdmin=false, canViewTokenUsage=true
  2. Sole admin      -> canViewAdmin=true,  canViewTokenUsage=true (NEW)
  3. Both (admin)    -> canViewAdmin=true,  canViewTokenUsage=true
  4. Both (reviewer) -> canViewAdmin=false, canViewTokenUsage=true
  5. Neither         -> canViewAdmin=false, canViewTokenUsage=false

Part B — require_feedback_reviewer dependency tests (backend gate):
  1. Admin allowed (ADMIN_EMAILS only, no reviewers)
  2. Reviewer allowed
  3. Both lists — admin+reviewer allowed
  4. Neither list — blocked (403)
  5. Admin blocked when both lists empty (403)
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.deps import require_feedback_reviewer
from app.api.v1.auth import get_current_user_info


def _make_user(email: str, name: str | None = None) -> MagicMock:
    user = MagicMock()
    user.id = "00000000-0000-0000-0000-000000000001"
    user.email = email
    user.type = "regular"
    user.name = name
    return user


def _make_request() -> MagicMock:
    return MagicMock()


def _extract_data(result) -> dict:
    """Extract response dict whether result is a dict or JSONResponse."""
    if isinstance(result, dict):
        return result
    import json

    return json.loads(result.body)


# ---------------------------------------------------------------------------
# Case 1 — Sole reviewer
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_role_matrix_sole_reviewer():
    """Reviewer in FEEDBACK_REVIEWER_EMAILS only — not admin."""
    user = _make_user("r@x.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = ""
        mock_settings.FEEDBACK_REVIEWER_EMAILS = "r@x.com"
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is False
    assert data["canViewTokenUsage"] is True


# ---------------------------------------------------------------------------
# Case 2 — Sole admin (super-role)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_role_matrix_sole_admin_supersedes():
    """Admin in ADMIN_EMAILS gets canViewTokenUsage even if not in FEEDBACK_REVIEWER_EMAILS."""
    user = _make_user("a@x.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "a@x.com"
        mock_settings.FEEDBACK_REVIEWER_EMAILS = ""
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is True
    assert data["canViewTokenUsage"] is True


# ---------------------------------------------------------------------------
# Case 3 — Both (admin in both lists)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_role_matrix_both_admin():
    """Admin in both ADMIN_EMAILS and FEEDBACK_REVIEWER_EMAILS gets both flags."""
    user = _make_user("a@x.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "a@x.com"
        mock_settings.FEEDBACK_REVIEWER_EMAILS = "a@x.com, r@x.com"
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is True
    assert data["canViewTokenUsage"] is True


# ---------------------------------------------------------------------------
# Case 4 — Both (reviewer-only in both lists)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_role_matrix_both_reviewer():
    """Reviewer in FEEDBACK_REVIEWER_EMAILS but not in ADMIN_EMAILS — reviewer only."""
    user = _make_user("r@x.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "a@x.com"
        mock_settings.FEEDBACK_REVIEWER_EMAILS = "a@x.com, r@x.com"
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is False
    assert data["canViewTokenUsage"] is True


# ---------------------------------------------------------------------------
# Case 5 — Neither (regular user)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_role_matrix_neither():
    """Regular user not in any allowlist gets no privileges."""
    user = _make_user("u@x.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = ""
        mock_settings.FEEDBACK_REVIEWER_EMAILS = ""
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is False
    assert data["canViewTokenUsage"] is False


# ===========================================================================
# Part B — require_feedback_reviewer dependency (backend access gate)
# ===========================================================================


@pytest.mark.asyncio
async def test_require_feedback_reviewer_allows_admin():
    """Admin in ADMIN_EMAILS passes require_feedback_reviewer even with empty FEEDBACK_REVIEWER_EMAILS."""
    user = _make_user("admin@x.com")

    with (
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "admin@x.com"
        mock_settings.FEEDBACK_REVIEWER_EMAILS = ""
        result = await require_feedback_reviewer(
            current_user={"id": str(user.id)},
            db=AsyncMock(),
        )
    assert result == {"id": str(user.id)}


@pytest.mark.asyncio
async def test_require_feedback_reviewer_allows_reviewer():
    """Reviewer in FEEDBACK_REVIEWER_EMAILS passes even with empty ADMIN_EMAILS."""
    user = _make_user("rev@x.com")

    with (
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = ""
        mock_settings.FEEDBACK_REVIEWER_EMAILS = "rev@x.com"
        result = await require_feedback_reviewer(
            current_user={"id": str(user.id)},
            db=AsyncMock(),
        )
    assert result == {"id": str(user.id)}


@pytest.mark.asyncio
async def test_require_feedback_reviewer_allows_both():
    """Admin in both ADMIN_EMAILS and FEEDBACK_REVIEWER_EMAILS passes."""
    user = _make_user("both@x.com")

    with (
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "both@x.com"
        mock_settings.FEEDBACK_REVIEWER_EMAILS = "both@x.com"
        result = await require_feedback_reviewer(
            current_user={"id": str(user.id)},
            db=AsyncMock(),
        )
    assert result == {"id": str(user.id)}


@pytest.mark.asyncio
async def test_require_feedback_reviewer_blocks_neither():
    """User not in any allowlist gets 403 when both lists are configured but user not in them."""
    user = _make_user("user@x.com")

    with (
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "admin@x.com"
        mock_settings.FEEDBACK_REVIEWER_EMAILS = "rev@x.com"
        with pytest.raises(HTTPException) as excinfo:
            await require_feedback_reviewer(
                current_user={"id": str(user.id)},
                db=AsyncMock(),
            )
    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "You do not have permission to view feedback"


@pytest.mark.asyncio
async def test_require_feedback_reviewer_blocks_when_both_empty():
    """When both allowlists are empty, every user gets 403."""
    user = _make_user("anyone@x.com")

    with (
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = ""
        mock_settings.FEEDBACK_REVIEWER_EMAILS = ""
        with pytest.raises(HTTPException) as excinfo:
            await require_feedback_reviewer(
                current_user={"id": str(user.id)},
                db=AsyncMock(),
            )
    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Feedback review is not configured or access is disabled"
