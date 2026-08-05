"""
Unit tests for the canViewAdmin field on GET /api/auth/me, the shared
get_admin_emails() helper, and the require_admin() dependency in deps.py.

These tests mock the DB user lookup and settings to avoid requiring a live
database, mirroring the test_can_view_token_usage.py approach.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.deps import get_admin_emails, require_admin
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


def _extract_data(result):
    """Extract response dict whether result is a dict or JSONResponse."""
    if isinstance(result, dict):
        return result
    import json

    return json.loads(result.body)


# ---------------------------------------------------------------------------
# Tests for get_admin_emails() helper
# ---------------------------------------------------------------------------


def test_get_admin_emails_parses_comma_separated():
    with patch("app.api.deps.settings") as mock_settings:
        mock_settings.ADMIN_EMAILS = "admin@example.com, Boss@example.com ,dev@example.com"
        result = get_admin_emails()
    assert result == {"admin@example.com", "boss@example.com", "dev@example.com"}


def test_get_admin_emails_returns_empty_set_when_blank():
    with patch("app.api.deps.settings") as mock_settings:
        mock_settings.ADMIN_EMAILS = ""
        result = get_admin_emails()
    assert result == set()


def test_get_admin_emails_handles_none():
    with patch("app.api.deps.settings") as mock_settings:
        mock_settings.ADMIN_EMAILS = None
        result = get_admin_emails()
    assert result == set()


# ---------------------------------------------------------------------------
# Integration tests for canViewAdmin field on /api/auth/me
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_can_view_admin_is_true_for_admin():
    """User in ADMIN_EMAILS gets canViewAdmin=True."""
    user = _make_user("admin@example.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "admin@example.com,other@example.com"
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is True


@pytest.mark.asyncio
async def test_can_view_admin_is_false_for_non_admin():
    """User NOT in ADMIN_EMAILS gets canViewAdmin=False."""
    user = _make_user("regular@example.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "admin@example.com"
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is False


@pytest.mark.asyncio
async def test_can_view_admin_is_false_when_list_empty():
    """When ADMIN_EMAILS is empty, all users get canViewAdmin=False."""
    user = _make_user("anyone@example.com")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = ""
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is False


@pytest.mark.asyncio
async def test_can_view_admin_is_case_insensitive():
    """Email comparison is case-insensitive."""
    user = _make_user("Admin@Example.COM")

    with (
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "admin@example.com"
        current_user = {"id": str(user.id), "type": "regular"}

        result = await get_current_user_info(
            http_request=_make_request(),
            current_user=current_user,
            db=AsyncMock(),
        )

    data = _extract_data(result)
    assert data["canViewAdmin"] is True


# ---------------------------------------------------------------------------
# Tests for require_admin() dependency
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_require_admin_raises_when_not_configured():
    """Empty ADMIN_EMAILS raises 403 with 'not configured' detail."""
    with (
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = ""
        with pytest.raises(HTTPException) as excinfo:
            await require_admin(
                current_user={"id": "00000000-0000-0000-0000-000000000001"},
                db=AsyncMock(),
            )
    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Admin access is not configured"


@pytest.mark.asyncio
async def test_require_admin_raises_for_non_admin_user():
    """Authenticated user not in ADMIN_EMAILS raises 403."""
    user = _make_user("regular@example.com")

    with (
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "admin@example.com"
        with pytest.raises(HTTPException) as excinfo:
            await require_admin(
                current_user={"id": str(user.id)},
                db=AsyncMock(),
            )
    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "You do not have admin access"


@pytest.mark.asyncio
async def test_require_admin_returns_user_for_admin():
    """Admin user in ADMIN_EMAILS passes and gets the current_user back."""
    user = _make_user("admin@example.com")
    current_user = {"id": str(user.id), "type": "regular"}

    with (
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.deps.settings") as mock_settings,
    ):
        mock_settings.ADMIN_EMAILS = "admin@example.com"
        result = await require_admin(
            current_user=current_user,
            db=AsyncMock(),
        )

    assert result == current_user


# ---------------------------------------------------------------------------
# Disabled-user rejection tests for auth endpoints
# ---------------------------------------------------------------------------


def _make_disabled_user(disabled: bool = True) -> MagicMock:
    """Return a mock user with disabled flag set."""
    user = MagicMock()
    user.id = "00000000-0000-0000-0000-000000000001"
    user.email = "user@example.com"
    user.type = "regular"
    user.name = None
    user.disabled = disabled
    user.password = "hashed_password"
    return user


@pytest.mark.asyncio
async def test_login_rejects_disabled_user():
    """POST /login with correct credentials for a disabled user returns 403."""
    from app.api.v1.auth import LoginRequest, login

    user = _make_disabled_user(disabled=True)

    with (
        patch("app.api.v1.auth.get_user_by_email", new=AsyncMock(return_value=user)),
        patch("app.api.v1.auth.get_recent_failed_attempts", new=AsyncMock(return_value=0)),
        patch("app.api.v1.auth.verify_password", return_value=True),
        patch("app.api.v1.auth.get_password_hash", return_value="dummy_hash"),
        patch("app.api.v1.auth.validate_csrf"),
        patch("app.api.v1.auth.check_rate_limit", new=AsyncMock()),
    ):
        login_req = LoginRequest(email="user@example.com", password="correct")
        http_request = MagicMock()
        http_request.client.host = "127.0.0.1"

        with pytest.raises(HTTPException) as excinfo:
            await login(request=login_req, http_request=http_request, db=AsyncMock())

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Account has been disabled"


@pytest.mark.asyncio
async def test_login_allows_enabled_user():
    """POST /login with correct credentials for an enabled non-admin user succeeds."""
    from app.api.v1.auth import LoginRequest, login

    user = _make_disabled_user(disabled=False)

    with (
        patch("app.api.v1.auth.get_user_by_email", new=AsyncMock(return_value=user)),
        patch("app.api.v1.auth.get_recent_failed_attempts", new=AsyncMock(return_value=0)),
        patch("app.api.v1.auth.verify_password", return_value=True),
        patch("app.api.v1.auth.get_password_hash", return_value="dummy_hash"),
        patch("app.api.v1.auth.create_access_token", return_value="jwt_token"),
        patch("app.api.v1.auth.generate_session_token", new=AsyncMock(return_value="session_abc")),
        patch("app.api.v1.auth.validate_csrf"),
        patch("app.api.v1.auth.check_rate_limit", new=AsyncMock()),
        patch("app.api.v1.auth.clear_failed_attempts", new=AsyncMock()),
        patch("app.api.v1.auth.set_auth_cookie"),
    ):
        login_req = LoginRequest(email="user@example.com", password="correct")
        http_request = MagicMock()
        http_request.client.host = "127.0.0.1"
        from fastapi.responses import JSONResponse

        result = await login(request=login_req, http_request=http_request, db=AsyncMock())

    assert isinstance(result, JSONResponse)
    assert result.status_code == 200


@pytest.mark.asyncio
async def test_guest_reuses_disabled_guest_returns_403():
    """POST /guest reusing a disabled guest session returns 403."""
    from app.api.v1.auth import create_guest

    user = _make_disabled_user(disabled=True)
    user.type = "guest"
    user.email = "guest-disabled@anonymous.local"

    http_request = MagicMock()
    http_request.client.host = "127.0.0.1"
    http_request.client.port = 12345
    http_request.cookies = {"guest_session_id": "opaque_session_123"}

    with (
        patch(
            "app.api.v1.auth.validate_session_token_async", new=AsyncMock(return_value=str(user.id))
        ),
        patch("app.api.v1.auth.get_user_by_id", new=AsyncMock(return_value=user)),
        patch("app.api.v1.auth.validate_csrf"),
        patch("app.api.v1.auth.check_rate_limit", new=AsyncMock()),
    ):
        with pytest.raises(HTTPException) as excinfo:
            await create_guest(http_request=http_request, db=AsyncMock())

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Account has been disabled"


@pytest.mark.asyncio
async def test_refresh_rejects_disabled_user_via_deps():
    """Verify get_current_user rejects disabled users — covers /refresh path."""
    from app.api.deps import get_current_user

    user = _make_disabled_user(disabled=True)
    user_id = str(user.id)

    http_request = MagicMock()
    http_request.client.host = "127.0.0.1"
    http_request.client.port = 12345
    http_request.cookies = {"auth_token": "valid_jwt"}

    with (
        patch(
            "app.api.deps.decode_access_token",
            return_value={"sub": user_id, "type": "regular", "jti": "jti-1"},
        ),
        patch("app.api.deps.is_token_revoked", new=AsyncMock(return_value=False)),
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
    ):
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user(
                request=http_request,
                credentials=None,
                db=AsyncMock(),
            )

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Account has been disabled"
