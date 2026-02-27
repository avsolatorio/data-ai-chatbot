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


def validate_csrf(request: Request, require_origin: bool = True) -> None:
    """
    Validate CSRF protection using Origin header.

    For state-changing operations (POST, PUT, DELETE, PATCH), validates that:
    1. Origin header matches allowed CORS origins (if present)
    2. Or Referer header matches allowed origins (fallback)

    Args:
        request: FastAPI request object
        require_origin: If True, raises error if Origin/Referer missing. If False, only validates if present.

    Raises:
        HTTPException: 403 Forbidden if CSRF validation fails
    """
    # Only validate for state-changing methods
    if request.method not in ("POST", "PUT", "DELETE", "PATCH"):
        return

    # Get Origin header (preferred)
    origin = request.headers.get("Origin")

    # Fallback to Referer header if Origin is missing
    if not origin:
        referer = request.headers.get("Referer")
        if referer:
            # Extract origin from referer (e.g., "https://example.com/path" -> "https://example.com")
            try:
                from urllib.parse import urlparse

                parsed = urlparse(referer)
                origin = f"{parsed.scheme}://{parsed.netloc}"
            except Exception as e:
                logger.warning("Failed to parse Referer header: %s", e)
                origin = None

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

        # Normalize origins (remove trailing slashes, convert to lowercase for comparison)
        origin_normalized = origin.rstrip("/").lower()
        allowed_normalized = [o.rstrip("/").lower() for o in allowed_origins]

        if origin_normalized not in allowed_normalized:
            logger.warning(
                "CSRF validation failed: Origin %s not in allowed origins %s",
                origin,
                allowed_origins,
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
        try:
            require_origin = _require_origin_for_request(request)
            validate_csrf(request, require_origin=require_origin)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )
        return await call_next(request)
