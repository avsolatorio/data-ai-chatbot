"""Tool setup utilities for chat streaming."""

import asyncio
import logging
from typing import Any, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.mcp_tools.data360_mcp import get_mcp_tools
from app.ai.tools import (
    CREATE_DOCUMENT_TOOL_DEFINITION,
    UPDATE_DOCUMENT_TOOL_DEFINITION,
    create_document_tool,
    update_document_tool,
)
from app.config import get_mcp_settings

logger = logging.getLogger(__name__)


async def create_tool_wrappers(user_id: UUID, db: AsyncSession) -> Dict[str, Dict[str, Any]]:
    """
    Create async tool wrappers for OpenAI tools.
    These wrappers handle the _sse_writer parameter and pass user_id/db_session.
    """

    async def create_document_wrapper(**kwargs):
        sse_writer = kwargs.pop("_sse_writer", None)
        return await create_document_tool(
            title=kwargs["title"],
            kind=kwargs["kind"],
            user_id=str(user_id),
            db_session=db,
            sse_writer=sse_writer,
        )

    async def update_document_wrapper(**kwargs):
        sse_writer = kwargs.pop("_sse_writer", None)
        return await update_document_tool(
            document_id=kwargs["id"],
            description=kwargs["description"],
            user_id=str(user_id),
            db_session=db,
            sse_writer=sse_writer,
        )

    return {
        "createDocument": {
            "function": create_document_wrapper,
            "type": "tool",
        },
        "updateDocument": {
            "function": update_document_wrapper,
            "type": "tool",
        },
    }


async def prepare_tools(
    user_id: UUID, db: AsyncSession
) -> tuple[Dict[str, Dict[str, Any]], list[Dict[str, Any]]]:
    """
    Prepare tools and tool definitions for OpenAI streaming.
    Returns (tools_dict, tool_definitions_list).
    """
    logger.info("[tool_setup] create_tool_wrappers (local tools) start")
    tool_set = {
        "local": {
            "tool_definitions": [
                CREATE_DOCUMENT_TOOL_DEFINITION,
                UPDATE_DOCUMENT_TOOL_DEFINITION,
            ],
            "tools": await create_tool_wrappers(user_id, db),
        },
        "mcp": {
            "tool_definitions": [],
            "tools": {},
        },
    }
    logger.info("[tool_setup] create_tool_wrappers done")

    # Add MCP tools (gracefully handle connection failures and timeouts)
    mcp_load_timeout = get_mcp_settings().load_timeout
    logger.info("[tool_setup] get_mcp_tools start (timeout=%ss)", mcp_load_timeout)
    try:
        mcp_tools = await asyncio.wait_for(
            get_mcp_tools(),
            timeout=mcp_load_timeout,
        )
        logger.info("[tool_setup] get_mcp_tools done count=%d", len(mcp_tools))
        for tool in mcp_tools:
            tool_set["mcp"]["tools"][tool["function"]["name"]] = {
                "function": None,
                "type": "mcp",
            }
            tool_set["mcp"]["tool_definitions"].append(tool)
        tool_names = [t["function"]["name"] for t in mcp_tools]
        logger.info("Successfully loaded %d MCP tools: %s", len(mcp_tools), tool_names)
    except asyncio.TimeoutError:
        logger.warning(
            "[tool_setup] get_mcp_tools timed out after %ss (MCP server unreachable or slow). "
            "Continuing without MCP tools.",
            mcp_load_timeout,
        )
    except Exception as e:
        logger.warning(
            "Failed to load MCP tools (continuing without them): %s",
            str(e),
            exc_info=True,
        )

    return tool_set
