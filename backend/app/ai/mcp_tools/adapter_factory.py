"""Build langchain-mcp-adapters MultiServerMCPClient from MCPSettings."""

from __future__ import annotations

import json
import logging
from datetime import timedelta
from typing import TYPE_CHECKING, Any

import httpx
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.interceptors import MCPToolCallRequest
from langchain_mcp_adapters.sessions import Connection, McpHttpClientFactory

from app.ai.mcp_tools._apim_auth import build_apim_auth
from app.config import get_mcp_settings

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

logger = logging.getLogger(__name__)

MCP_DATA360_SERVER_NAME = "data360"


def _effective_transport(url: str, configured: str) -> str:
    """Return adapter transport key: ``sse`` or ``http`` (streamable HTTP)."""
    c = (configured or "").strip().lower()
    if c in ("sse", "http", "streamable_http", "streamable-http"):
        if c == "streamable-http":
            return "http"
        if c == "streamable_http":
            return "http"
        return c
    # auto
    u = url.lower()
    if "sse" in u or u.rstrip("/").endswith("/sse"):
        return "sse"
    return "http"


def _parse_headers(settings: Any, dynamic_auth_active: bool = False) -> dict[str, Any]:
    headers: dict[str, Any] = {}
    raw = (settings.headers_json or "").strip()
    if raw:
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as e:
            logger.warning("[mcp] MCP_HEADERS_JSON is not valid JSON: %s", e)
        else:
            if isinstance(parsed, dict):
                headers.update(parsed)
            else:
                logger.warning("[mcp] MCP_HEADERS_JSON must be a JSON object")
    # Skip static bearer when dynamic APIM auth is active to avoid conflicts.
    if not dynamic_auth_active:
        bearer = (settings.authorization_bearer or "").strip()
        if bearer:
            headers["Authorization"] = f"Bearer {bearer}"
    return headers


def _httpx_factory(settings: Any, apim_auth: httpx.Auth | None = None) -> McpHttpClientFactory:
    def factory(
        headers: dict[str, str] | None = None,
        timeout: httpx.Timeout | None = None,
        auth: httpx.Auth | None = None,
    ) -> httpx.AsyncClient:
        # Dynamic APIM auth takes precedence over any auth passed by the adapter.
        resolved_auth = apim_auth if apim_auth is not None else auth
        return httpx.AsyncClient(
            headers=headers,
            timeout=timeout or httpx.Timeout(settings.timeout),
            auth=resolved_auth,
            verify=settings.ssl_verify,
        )

    return factory


def build_data360_connection() -> Connection:
    """Single-server connection dict for MultiServerMCPClient."""
    settings = get_mcp_settings()
    url = settings.server_url
    transport = _effective_transport(url, settings.transport)
    apim_auth = build_apim_auth(settings)
    headers = _parse_headers(settings, dynamic_auth_active=apim_auth is not None) or None
    httpx_client_factory = _httpx_factory(settings, apim_auth=apim_auth)

    if apim_auth is not None:
        logger.info("[mcp] APIM bearer auth enabled (MCP_INTERNAL=True) url=%s", url)
    else:
        logger.info("[mcp] No APIM auth (MCP_INTERNAL=False) url=%s", url)

    if transport == "sse":
        conn: Connection = {
            "transport": "sse",
            "url": url,
            "timeout": float(settings.timeout),
            "sse_read_timeout": float(max(settings.timeout, 300.0)),
            "httpx_client_factory": httpx_client_factory,
        }
        if headers:
            conn["headers"] = headers
        return conn

    # streamable HTTP (adapter accepts http / streamable_http)
    td = timedelta(seconds=float(settings.timeout))
    sse_td = timedelta(seconds=float(max(settings.timeout, 300.0)))
    conn_http: Connection = {
        "transport": "http",
        "url": url,
        "timeout": td,
        "sse_read_timeout": sse_td,
        "httpx_client_factory": httpx_client_factory,
    }
    if headers:
        conn_http["headers"] = headers
    return conn_http


class NormalizeMcpToolArgsInterceptor:
    """Apply ``normalize_mcp_tool_arguments`` to every MCP tool call (adapter path)."""

    async def __call__(
        self,
        request: MCPToolCallRequest,
        handler: Callable[[MCPToolCallRequest], Awaitable[Any]],
    ) -> Any:
        from app.ai.mcp_tools.normalize import normalize_mcp_tool_arguments

        normalized = normalize_mcp_tool_arguments(dict(request.args))
        return await handler(request.override(args=normalized))


def create_multiserver_mcp_client() -> MultiServerMCPClient:
    """Client with one ``data360`` server and argument normalization."""
    connections = {MCP_DATA360_SERVER_NAME: build_data360_connection()}
    logger.info(
        "[mcp] MultiServerMCPClient transport=%s url=%s",
        connections[MCP_DATA360_SERVER_NAME]["transport"],
        connections[MCP_DATA360_SERVER_NAME]["url"],
    )
    return MultiServerMCPClient(
        connections,
        tool_interceptors=[NormalizeMcpToolArgsInterceptor()],
    )
