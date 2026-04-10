"""Tool setup utilities for chat streaming."""

import asyncio
import logging
import time
from typing import Any, Dict, List
from uuid import UUID

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.graph.mcp_tools import get_langchain_mcp_tools
from app.ai.mcp_tools.data360_mcp import get_mcp_tools
from app.ai.tools import (
    CREATE_DOCUMENT_TOOL_DEFINITION,
    UPDATE_DOCUMENT_TOOL_DEFINITION,
    create_document_tool,
    update_document_tool,
)
from app.config import get_mcp_settings, get_settings

logger = logging.getLogger(__name__)

# In-memory cache for MCP tool list to avoid calling list_tools on every chat.
# (cached_at_monotonic, mcp_tools_list) or None when empty/error.
_mcp_tools_cache: tuple[float, list] | None = None
_mcp_tools_cache_lock = asyncio.Lock()


# ── Pydantic schemas for local LangChain tools ────────────────────────────────


class _CreateDocumentInput(BaseModel):
    title: str = Field(description="The title of the document")
    kind: str = Field(description='The kind of document to create: "text", "code", or "sheet"')


class _UpdateDocumentInput(BaseModel):
    id: str = Field(description="The ID of the document to update")
    description: str = Field(description="The description of changes that need to be made")


def _make_local_langchain_tools(user_id: UUID, db: AsyncSession) -> List[StructuredTool]:
    """Build LangChain StructuredTool wrappers for createDocument / updateDocument.

    The returned tools capture ``user_id`` and ``db`` via closure so they can be
    passed directly to ``llm.bind_tools()`` in narrator_node / direct_node.

    Note: ``sse_writer=None`` — document-content streaming SSE events are not
    emitted on the LangGraph path (the tool still creates and saves the document).
    """

    async def _create_document(title: str, kind: str) -> dict:
        return await create_document_tool(
            title=title,
            kind=kind,
            user_id=str(user_id),
            db_session=db,
            sse_writer=None,
        )

    async def _update_document(id: str, description: str) -> dict:
        return await update_document_tool(
            document_id=id,
            description=description,
            user_id=str(user_id),
            db_session=db,
            sse_writer=None,
        )

    return [
        StructuredTool(
            name="createDocument",
            description=CREATE_DOCUMENT_TOOL_DEFINITION["function"]["description"],
            args_schema=_CreateDocumentInput,
            coroutine=_create_document,
        ),
        StructuredTool(
            name="updateDocument",
            description=UPDATE_DOCUMENT_TOOL_DEFINITION["function"]["description"],
            args_schema=_UpdateDocumentInput,
            coroutine=_update_document,
        ),
    ]


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


async def prepare_tools(user_id: UUID, db: AsyncSession) -> Dict[str, Dict[str, Any]]:
    """
    Prepare tools and tool definitions for OpenAI streaming.
    Returns tool_set: {"local": {tools, tool_definitions}, "mcp": {tools, tool_definitions}}.
    When ENABLE_LOCAL_TOOLS=false, local tools/definitions are empty.
    MCP tool list is cached for 5 minutes to avoid calling list_tools on every chat.
    """
    global _mcp_tools_cache
    enable_local = get_settings().ENABLE_LOCAL_TOOLS
    if enable_local:
        logger.info("[tool_setup] create_tool_wrappers (local tools) start")
        local_defs = [
            CREATE_DOCUMENT_TOOL_DEFINITION,
            UPDATE_DOCUMENT_TOOL_DEFINITION,
        ]
        local_tools = await create_tool_wrappers(user_id, db)
        logger.info("[tool_setup] create_tool_wrappers done")
    else:
        local_defs = []
        local_tools = {}
        logger.info("[tool_setup] local tools disabled via ENABLE_LOCAL_TOOLS=false")

    local_lc_tools: List[StructuredTool] = (
        _make_local_langchain_tools(user_id, db) if enable_local else []
    )

    tool_set = {
        "local": {
            "tool_definitions": local_defs,
            "tools": local_tools,
            "langchain_tools": local_lc_tools,
        },
        "mcp": {
            "tool_definitions": [],
            "tools": {},
        },
        # LangChain tool groups for the LangGraph pipeline
        "mcp_data": {"langchain_tools": []},
        "mcp_viz": {"langchain_tools": []},
    }

    # Add MCP tools (with 5-minute cache; gracefully handle connection failures and timeouts)
    mcp_tools: list = []
    async with _mcp_tools_cache_lock:
        now = time.monotonic()
        if (
            _mcp_tools_cache is not None
            and (now - _mcp_tools_cache[0]) < get_mcp_settings().tools_cache_ttl_seconds
        ):
            mcp_tools = _mcp_tools_cache[1]
            logger.info(
                "[tool_setup] using cached MCP tools count=%d (age=%.0fs)",
                len(mcp_tools),
                now - _mcp_tools_cache[0],
            )

    if not mcp_tools:
        mcp_load_timeout = get_mcp_settings().load_timeout
        logger.info("[tool_setup] get_mcp_tools start (timeout=%ss)", mcp_load_timeout)
        try:
            mcp_tools = await asyncio.wait_for(
                get_mcp_tools(),
                timeout=mcp_load_timeout,
            )
            async with _mcp_tools_cache_lock:
                _mcp_tools_cache = (time.monotonic(), mcp_tools)
            logger.info("[tool_setup] get_mcp_tools done count=%d", len(mcp_tools))
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

    if mcp_tools:
        for tool in mcp_tools:
            tool_set["mcp"]["tools"][tool["function"]["name"]] = {
                "function": None,
                "type": "mcp",
            }
            tool_set["mcp"]["tool_definitions"].append(tool)
        tool_names = [t["function"]["name"] for t in mcp_tools]
        logger.info("Successfully loaded %d MCP tools: %s", len(mcp_tools), tool_names)

    # ── LangChain MCP tools for the LangGraph pipeline ────────────────────────
    logger.info("[tool_setup] get_langchain_mcp_tools start")
    try:
        lc_data_tools, lc_viz_tools = await asyncio.wait_for(
            get_langchain_mcp_tools(),
            timeout=get_mcp_settings().load_timeout,
        )
        tool_set["mcp_data"]["langchain_tools"] = lc_data_tools
        tool_set["mcp_viz"]["langchain_tools"] = lc_viz_tools
        logger.info(
            "[tool_setup] LangChain MCP tools: data=%d viz=%d",
            len(lc_data_tools),
            len(lc_viz_tools),
        )
    except asyncio.TimeoutError:
        logger.warning(
            "[tool_setup] get_langchain_mcp_tools timed out after %ss. "
            "LangGraph pipeline will run without MCP tools.",
            get_mcp_settings().load_timeout,
        )
    except Exception as exc:
        logger.warning(
            "[tool_setup] get_langchain_mcp_tools failed: %s. "
            "LangGraph pipeline will run without MCP tools.",
            exc,
            exc_info=True,
        )

    return tool_set
