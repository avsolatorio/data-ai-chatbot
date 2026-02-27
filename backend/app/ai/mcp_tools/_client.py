from functools import cache
from typing import Literal

import httpx
from fastmcp import Client
from fastmcp.client.transports import SSETransport, StreamableHttpTransport

from app.config import get_mcp_settings


def get_mcp_client(
    transport: Literal["sse", "http"] = "http",
    server_url: str | None = None,
) -> Client[SSETransport | StreamableHttpTransport]:
    """Get a cached MCP client instance.
    Cache is keyed by (transport, url) so changing MCP_SERVER_URL
    picks up a new client on next call (no process restart required).
    TODO: Deprecate SSE transport.
    """
    url = server_url if server_url is not None else get_mcp_settings().server_url
    return _cached_mcp_client(transport, url)


@cache
def _cached_mcp_client(
    transport: Literal["sse", "http"],
    url: str,
) -> Client[SSETransport | StreamableHttpTransport]:
    if transport == "sse":
        transport_instance = SSETransport(
            url=url,
            httpx_client_factory=create_httpx_client,
        )
    elif transport == "http":
        transport_instance = StreamableHttpTransport(
            url=url,
            httpx_client_factory=create_httpx_client,
        )
    else:
        raise ValueError(f"Unknown transport: {transport!r}")
    return Client(transport_instance)


def create_httpx_client(
    headers: dict[str, str] | None = None,
    timeout: httpx.Timeout | None = None,
    auth: httpx.Auth | None = None,
    **kwargs,
) -> httpx.AsyncClient:
    """Create an httpx client with configurable SSL verification."""
    settings = get_mcp_settings()
    return httpx.AsyncClient(
        headers=headers,
        timeout=timeout or httpx.Timeout(settings.timeout),
        auth=auth,
        verify=settings.ssl_verify,
        **kwargs,
    )
