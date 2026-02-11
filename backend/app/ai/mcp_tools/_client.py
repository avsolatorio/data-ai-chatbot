from functools import cache
from typing import Literal

import httpx
from fastmcp import Client
from fastmcp.client.transports import SSETransport, StreamableHttpTransport

from app.config import get_mcp_servers_config, get_mcp_settings


@cache
def get_mcp_client(
    transport: Literal["sse", "http"] = "http",
) -> Client[SSETransport | StreamableHttpTransport]:
    """Get a cached MCP client instance. Server list is driven by config (see get_mcp_servers_config)."""
    config = {"mcpServers": get_mcp_servers_config()}
    return Client(config)


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
