"""
DEF-004: Admin rate limit exemption tests.

The global RateLimitMiddleware should skip /api/admin/* paths.
These tests verify that admin paths pass through the middleware without
rate-limit checks even when RATE_LIMIT_ENABLED is True.
"""

from unittest.mock import patch

from fastapi import Response
from starlette.requests import Request
from starlette.types import ASGIApp

from app.core.rate_limit import RateLimitMiddleware


def _make_scope(path: str) -> dict:
    return {
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": [(b"host", b"testserver")],
        "client": ("127.0.0.1", 12345),
    }


def _make_request(path: str) -> Request:
    scope = _make_scope(path)
    return Request(scope)


async def _call_next(request: Request) -> Response:
    return Response(b"ok", status_code=200)


class _FakeApp(ASGIApp):
    """Minimal ASGI app that returns 200 for any request."""

    async def __call__(self, scope, receive, send):
        pass


async def test_admin_health_exempt_from_rate_limit():
    """GET /api/admin/health is not rate-limited."""
    middleware = RateLimitMiddleware(app=_FakeApp())

    with patch("app.core.rate_limit.settings") as mock_settings:
        mock_settings.RATE_LIMIT_ENABLED = True
        mock_settings.RATE_LIMIT_REQUESTS = 1
        mock_settings.RATE_LIMIT_WINDOW_SECONDS = 60

        request = _make_request("/api/admin/health")
        response = await middleware.dispatch(request, _call_next)
        assert response.status_code == 200

        # Second request also passes (no rate limit applied)
        request2 = _make_request("/api/admin/health")
        response2 = await middleware.dispatch(request2, _call_next)
        assert response2.status_code == 200


async def test_admin_subpath_exempt_from_rate_limit():
    """GET /api/admin/moderation/users is not rate-limited."""
    middleware = RateLimitMiddleware(app=_FakeApp())

    with patch("app.core.rate_limit.settings") as mock_settings:
        mock_settings.RATE_LIMIT_ENABLED = True
        mock_settings.RATE_LIMIT_REQUESTS = 1
        mock_settings.RATE_LIMIT_WINDOW_SECONDS = 60

        request = _make_request("/api/admin/moderation/users")
        response = await middleware.dispatch(request, _call_next)
        assert response.status_code == 200


async def test_non_admin_path_still_rate_limited():
    """Non-admin /api/ path is still subject to rate limiting."""
    middleware = RateLimitMiddleware(app=_FakeApp())

    with patch("app.core.rate_limit.check_rate_limit") as mock_check:
        with patch("app.core.rate_limit.settings") as mock_settings:
            mock_settings.RATE_LIMIT_ENABLED = True
            mock_settings.RATE_LIMIT_REQUESTS = 50
            mock_settings.RATE_LIMIT_WINDOW_SECONDS = 60

            request = _make_request("/api/chat")
            await middleware.dispatch(request, _call_next)
            mock_check.assert_called_once()


async def test_non_api_path_skips_rate_limit_entirely():
    """Non-/api paths are never rate-limited."""
    middleware = RateLimitMiddleware(app=_FakeApp())

    with patch("app.core.rate_limit.check_rate_limit") as mock_check:
        with patch("app.core.rate_limit.settings") as mock_settings:
            mock_settings.RATE_LIMIT_ENABLED = True
            mock_settings.RATE_LIMIT_REQUESTS = 50
            mock_settings.RATE_LIMIT_WINDOW_SECONDS = 60

            request = _make_request("/health")
            response = await middleware.dispatch(request, _call_next)
            assert response.status_code == 200
            mock_check.assert_not_called()
