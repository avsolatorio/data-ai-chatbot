"""
Request logging middleware for API routes.
Logs method, path, status, and duration at INFO level; useful for tracing and debugging.
"""

import logging
import time
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log API requests: method, path, status code, duration.
    Only logs /api/* paths to avoid noise from health checks and static assets.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "api_request: method=%s path=%s status=%s duration_ms=%.1f",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

        # Log at DEBUG for failed requests to aid troubleshooting
        if response.status_code >= 400:
            logger.debug(
                "api_request_failed: method=%s path=%s status=%s query=%s",
                request.method,
                request.url.path,
                response.status_code,
                str(request.query_params) if request.query_params else "",
            )

        return response
