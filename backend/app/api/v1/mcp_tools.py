"""API routes for MCP (Model Context Protocol) tools."""

import logging

from fastapi import APIRouter, Depends, status

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
