"""API routes for MCP (Model Context Protocol) tools."""

import logging

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import HTMLResponse

from app.ai.mcp_tools._client import get_mcp_client
from app.ai.mcp_tools.data360_mcp import get_mcp_tools
from app.api.deps import get_current_user
from app.core.errors import ChatSDKError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/tools")
async def list_mcp_tools(
    current_user: dict = Depends(get_current_user),
):
    """
    List available MCP tools.
    Returns tool definitions (name, description, parameters) for all connected MCP tools.
    """
    try:
        # OpenAI-shaped defs from shared langchain-mcp-adapters bundle cache (data360_mcp)
        tools = await get_mcp_tools()
        return {"tools": tools, "count": len(tools)}
    except Exception as e:
        logger.warning("Failed to list MCP tools: %s", e, exc_info=True)
        raise ChatSDKError(
            "service_error:api",
            f"Failed to load MCP tools: {e!s}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from e


@router.get("/apps", response_class=HTMLResponse)
async def get_mcp_app_resource(
    uri: str = Query(
        ..., description="The MCP App resource URI (e.g. ui://data360-chart/index.html)"
    ),
):
    """
    Fetch a raw MCP App HTML resource from the data360-mcp server.

    This endpoint is intentionally unauthenticated: the iframe sandbox
    (allow-scripts, no allow-same-origin) cannot send cookies, so enforcing
    auth here would always fail. The content returned is public HTML from the
    MCP server — no user data is exposed.

    The frontend loads this URL as the `src` of a sandboxed `<iframe>` to render
    MCP App tool results (chart, interactive choices, etc.) via the postMessage
    ui/initialize → ui/notifications/tool-result protocol.
    """
    try:
        client = get_mcp_client()
        async with client:
            contents = await client.read_resource(uri)
        for item in contents:
            if hasattr(item, "text") and item.text:
                return HTMLResponse(
                    content=item.text,
                    media_type="text/html",
                )
        raise ChatSDKError(
            "not_found:mcp_app",
            f"No HTML content returned for MCP App resource: {uri}",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    except ChatSDKError:
        raise
    except Exception as e:
        logger.warning("Failed to fetch MCP App resource '%s': %s", uri, e, exc_info=True)
        raise ChatSDKError(
            "service_error:mcp_app",
            f"Failed to fetch MCP App resource: {e!s}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from e
