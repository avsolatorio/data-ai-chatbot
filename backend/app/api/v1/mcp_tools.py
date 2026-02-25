"""API routes for MCP (Model Context Protocol) tools."""

import logging

from fastapi import APIRouter, Depends, Query, status

from app.ai.mcp_tools.data360_mcp import get_mcp_tools, read_mcp_app_resource
from app.api.deps import get_current_user
from app.core.errors import ChatSDKError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/app-resource")
async def get_mcp_app_resource(
    uri: str = Query(..., description="MCP app resource URI (e.g. ui://data360/chart-view.html)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Read an MCP app resource by URI for use by MCP Apps UI (e.g. @mcp-ui/client).
    Returns resource contents in MCP ReadResourceResult shape.
    """
    try:
        contents = await read_mcp_app_resource(uri)
        return {"contents": contents}
    except Exception as e:
        logger.warning("Failed to read MCP app resource %s: %s", uri, e, exc_info=True)
        raise ChatSDKError(
            "service_error:api",
            f"Failed to load MCP app resource: {e!s}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from e


@router.get("/tools")
async def list_mcp_tools(
    current_user: dict = Depends(get_current_user),
):
    """
    List available MCP tools.
    Returns tool definitions (name, description, parameters) for all connected MCP tools.
    """
    try:
        tools = await get_mcp_tools()
        return {"tools": tools, "count": len(tools)}
    except Exception as e:
        logger.warning("Failed to list MCP tools: %s", e, exc_info=True)
        raise ChatSDKError(
            "service_error:api",
            f"Failed to load MCP tools: {e!s}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from e
