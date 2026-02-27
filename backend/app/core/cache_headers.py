"""
Cache-prevention middleware for form and sensitive response security.

Prevents browsers and intermediary caches from storing responses that may
contain sensitive data (e.g. form pages, API responses with user data),
mitigating form caching and information disclosure risks.
"""

from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Headers to prevent caching (RFC 7234, HTTP/1.0 compatibility)
CACHE_PREVENTION_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
}


class CachePreventionMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds cache-prevention headers to all responses.

    Reduces risk of:
    - Sensitive information in cached responses
    - Stale form data being reused
    - Browser/proxy caching of authenticated or dynamic content
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        for name, value in CACHE_PREVENTION_HEADERS.items():
            response.headers[name] = value
        return response
