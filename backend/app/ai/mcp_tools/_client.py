from functools import cache
from typing import Literal

import httpx
from fastmcp import Client
from fastmcp.client.transports import SSETransport, StreamableHttpTransport

from app.ai.mcp_tools._apim_auth import build_apim_auth
from app.config import get_mcp_settings


@cache
def get_mcp_client(
    transport: Literal["sse", "http"] = "http",
) -> Client[SSETransport | StreamableHttpTransport]:
    """Get a cached MCP client instance.
    TODO: Deprecate SSE transport.
    """
    settings = get_mcp_settings()
    apim_auth = build_apim_auth(settings)

    if transport == "sse":
        _transport: SSETransport | StreamableHttpTransport = SSETransport(
            url=settings.server_url,
            httpx_client_factory=lambda **kw: create_httpx_client(apim_auth=apim_auth, **kw),
        )
    else:
        _transport = StreamableHttpTransport(
            url=settings.server_url,
            httpx_client_factory=lambda **kw: create_httpx_client(apim_auth=apim_auth, **kw),
        )

    return Client(_transport)


def create_httpx_client(
    headers: dict[str, str] | None = None,
    timeout: httpx.Timeout | None = None,
    auth: httpx.Auth | None = None,
    apim_auth: httpx.Auth | None = None,
    **kwargs,
) -> httpx.AsyncClient:
    """Create an httpx client with configurable SSL verification.

    ``apim_auth`` takes precedence over the ``auth`` kwarg passed by FastMCP
    transports (which is None by default). This ensures APIM bearer tokens are
    injected on every request when MCP_INTERNAL=True.
    """
    settings = get_mcp_settings()
    resolved_auth = apim_auth if apim_auth is not None else auth
    return httpx.AsyncClient(
        headers=headers,
        timeout=timeout or httpx.Timeout(settings.timeout),
        auth=resolved_auth,
        verify=settings.ssl_verify,
        **kwargs,
    )
