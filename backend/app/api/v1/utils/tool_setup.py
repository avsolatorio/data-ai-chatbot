"""Tool setup utilities for chat streaming."""

import asyncio
import logging
from typing import Any, Dict, List
from uuid import UUID

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.mcp_tools.data360_mcp import get_mcp_tool_bundle
from app.ai.mcp_tools.partitions import DATA_TOOL_NAMES, VIZ_TOOL_NAMES
from app.ai.tools import (
    CREATE_DOCUMENT_TOOL_DEFINITION,
    UPDATE_DOCUMENT_TOOL_DEFINITION,
    create_document_tool,
    update_document_tool,
)
from app.config import get_mcp_settings, get_settings

logger = logging.getLogger(__name__)


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
    MCP tools are loaded once via langchain-mcp-adapters (shared TTL cache in data360_mcp).
    """
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

    tool_set: Dict[str, Dict[str, Any]] = {
        "local": {
            "tool_definitions": local_defs,
            "tools": local_tools,
            "langchain_tools": local_lc_tools,
        },
        "mcp": {
            "tool_definitions": [],
            "tools": {},
        },
        "mcp_data": {"langchain_tools": []},
        "mcp_viz": {"langchain_tools": []},
    }

    mcp_load_timeout = get_mcp_settings().load_timeout
    logger.info(
        "[tool_setup] get_mcp_tool_bundle start (timeout=%ss, cache via data360_mcp)",
        mcp_load_timeout,
    )
    try:
        lc_tools, mcp_openai_defs = await asyncio.wait_for(
            get_mcp_tool_bundle(),
            timeout=mcp_load_timeout,
        )
    except asyncio.TimeoutError:
        logger.warning(
            "[tool_setup] get_mcp_tool_bundle timed out after %ss. Continuing without MCP tools.",
            mcp_load_timeout,
        )
    except Exception as e:
        logger.warning(
            "Failed to load MCP tools (continuing without them): %s",
            str(e),
            exc_info=True,
        )
    else:
        for tool_def in mcp_openai_defs:
            tool_set["mcp"]["tools"][tool_def["function"]["name"]] = {
                "function": None,
                "type": "mcp",
            }
            tool_set["mcp"]["tool_definitions"].append(tool_def)
        tool_set["mcp_data"]["langchain_tools"] = [t for t in lc_tools if t.name in DATA_TOOL_NAMES]
        tool_set["mcp_viz"]["langchain_tools"] = [t for t in lc_tools if t.name in VIZ_TOOL_NAMES]
        tool_names = [t["function"]["name"] for t in mcp_openai_defs]
        logger.info(
            "Successfully loaded %d MCP tools (adapter); LangGraph data=%d viz=%d names=%s",
            len(mcp_openai_defs),
            len(tool_set["mcp_data"]["langchain_tools"]),
            len(tool_set["mcp_viz"]["langchain_tools"]),
            tool_names,
        )

    return tool_set
