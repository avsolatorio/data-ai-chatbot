"""
CSRF protection utilities.
Uses Origin/Referer header validation for state-changing operations.
"""

import logging
from typing import Callable

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from app.config import settings

logger = logging.getLogger(__name__)


def _get_origin_from_headers(request: Request) -> str | None:
    """
    Extract client origin from request headers, in order of preference:
    Origin, Referer, X-Forwarded-Host+Proto (when behind a trusted proxy).
    """
    origin = request.headers.get("Origin")
    if origin:
        return origin

    referer = request.headers.get("Referer")
    if referer:
        try:
            from urllib.parse import urlparse

            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                return f"{parsed.scheme}://{parsed.netloc}"
        except Exception as e:
            logger.warning("Failed to parse Referer header: %s", e)

    # Fallback: X-Forwarded-Host + X-Forwarded-Proto (common when CDN/proxy strips Origin/Referer)
    forwarded_host = request.headers.get("X-Forwarded-Host")
    forwarded_proto = request.headers.get("X-Forwarded-Proto")
    if forwarded_host and forwarded_proto:
        host = forwarded_host.split(",")[0].strip()
        proto = forwarded_proto.split(",")[0].strip().lower() or "https"
        if host:
            return f"{proto}://{host}"
    return None


def _normalize_origin(origin: str) -> str:
    """Normalize origin for comparison: lowercase, no trailing slash, strip default ports."""
    from urllib.parse import urlparse

    origin = origin.rstrip("/").lower()
    try:
        parsed = urlparse(origin if "://" in origin else f"https://{origin}")
        if parsed.hostname:
            # Strip default ports (443 for https, 80 for http) so https://x:443 matches https://x
            port = parsed.port
            if port in (443, 80):
                return f"{parsed.scheme}://{parsed.hostname}"
            if port is not None:
                return f"{parsed.scheme}://{parsed.hostname}:{port}"
            return f"{parsed.scheme}://{parsed.hostname}"
    except Exception:
        pass
    return origin


def validate_csrf(request: Request, require_origin: bool = True) -> None:
    """
    Validate CSRF protection using Origin header.

    For state-changing operations (POST, PUT, DELETE, PATCH), validates that:
    1. Origin header matches allowed CORS origins (if present)
    2. Or Referer header matches allowed origins (fallback)
    3. Or X-Forwarded-Host+Proto when behind a proxy that strips Origin/Referer

    Args:
        request: FastAPI request object
        require_origin: If True, raises error if Origin/Referer missing. If False, only validates if present.

    Raises:
        HTTPException: 403 Forbidden if CSRF validation fails
    """
    # Only validate for state-changing methods
    if request.method not in ("POST", "PUT", "DELETE", "PATCH"):
        return

    origin = _get_origin_from_headers(request)

    # If no origin/referer and we require it, reject
    if not origin and require_origin:
        logger.warning("CSRF validation failed: Missing Origin/Referer header")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed: Missing Origin header",
        )

    # If origin is present, validate it against allowed origins
    if origin:
        allowed_origins = settings.CORS_ORIGINS
        if isinstance(allowed_origins, str):
            allowed_origins = [allowed_origins]

        origin_normalized = _normalize_origin(origin)
        allowed_normalized = [_normalize_origin(o) for o in allowed_origins]

        if origin_normalized not in allowed_normalized:
            logger.warning(
                "CSRF validation failed: Origin %r (normalized %r) not in allowed %s",
                origin,
                origin_normalized,
                allowed_normalized,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF validation failed: Invalid Origin",
            )

    # If origin is missing but we don't require it (e.g., for API clients), allow
    # This allows programmatic access while still protecting browser-based requests


def _require_origin_for_request(request: Request) -> bool:
    """
    Require Origin/Referer when the request carries credentials (Cookie), or when
    CSRF_REQUIRE_ORIGIN_ALWAYS is True (closes "Absence of Origin Headers" finding).
    """
    if settings.CSRF_REQUIRE_ORIGIN_ALWAYS:
        return True
    # Header names are case-insensitive; Starlette normalizes to lowercase
    return "cookie" in request.headers


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Middleware that runs CSRF validation (Origin/Referer check) on all
    state-changing requests (POST, PUT, PATCH, DELETE). When Origin/Referer
    is present it must match CORS_ORIGINS. When the request sends credentials
    (Cookie), Origin/Referer is required; otherwise omitted origin is allowed.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method not in ("POST", "PUT", "DELETE", "PATCH"):
            return await call_next(request)

        # Debug: log CSRF validation attempt for state-changing requests
        has_cookie = "cookie" in request.headers
        origin_raw = request.headers.get("Origin")
        referer_raw = request.headers.get("Referer")
        forwarded_host = request.headers.get("X-Forwarded-Host")
        forwarded_proto = request.headers.get("X-Forwarded-Proto")
        logger.debug(
            "CSRF check: method=%s path=%s cookie=%s origin=%s referer=%s x-forwarded-host=%s x-forwarded-proto=%s",
            request.method,
            request.url.path,
            has_cookie,
            "present" if origin_raw else "absent",
            "present" if referer_raw else "absent",
            "present" if forwarded_host else "absent",
            "present" if forwarded_proto else "absent",
        )

        try:
            require_origin = _require_origin_for_request(request)
            origin = _get_origin_from_headers(request)
            logger.debug(
                "CSRF check: require_origin=%s origin=%s",
                require_origin,
                origin or "absent",
            )
            validate_csrf(request, require_origin=require_origin)
            logger.debug("CSRF check passed: method=%s path=%s", request.method, request.url.path)
        except HTTPException as exc:
            logger.debug(
                "CSRF check failed: method=%s path=%s status=%s detail=%s",
                request.method,
                request.url.path,
                exc.status_code,
                exc.detail,
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )
        return await call_next(request)
