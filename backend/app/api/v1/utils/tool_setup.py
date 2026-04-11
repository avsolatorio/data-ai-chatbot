"""Tool setup utilities for LangGraph chat (LangChain tools only)."""

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


class _CreateDocumentInput(BaseModel):
    title: str = Field(description="The title of the document")
    kind: str = Field(description='The kind of document to create: "text", "code", or "sheet"')


class _UpdateDocumentInput(BaseModel):
    id: str = Field(description="The ID of the document to update")
    description: str = Field(description="The description of changes that need to be made")


def _make_local_langchain_tools(user_id: UUID, db: AsyncSession) -> List[StructuredTool]:
    """Build LangChain StructuredTool wrappers for createDocument / updateDocument."""

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


async def prepare_tools(user_id: UUID, db: AsyncSession) -> Dict[str, Dict[str, Any]]:
    """
    Load tools for the LangGraph pipeline.

    Returns tool_set with:
      - local.langchain_tools — local StructuredTools (or [])
      - mcp_data.langchain_tools / mcp_viz.langchain_tools — MCP tools from the adapter bundle
    """
    enable_local = get_settings().ENABLE_LOCAL_TOOLS
    if enable_local:
        logger.info("[tool_setup] local LangChain tools (create/update document)")
        local_lc_tools: List[StructuredTool] = _make_local_langchain_tools(user_id, db)
    else:
        local_lc_tools = []
        logger.info("[tool_setup] local tools disabled via ENABLE_LOCAL_TOOLS=false")

    tool_set: Dict[str, Dict[str, Any]] = {
        "local": {
            "langchain_tools": local_lc_tools,
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
        lc_tools, _mcp_openai_defs = await asyncio.wait_for(
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
        tool_set["mcp_data"]["langchain_tools"] = [t for t in lc_tools if t.name in DATA_TOOL_NAMES]
        tool_set["mcp_viz"]["langchain_tools"] = [t for t in lc_tools if t.name in VIZ_TOOL_NAMES]
        tool_names = [t.name for t in lc_tools]
        logger.info(
            "Successfully loaded %d MCP tools (adapter); LangGraph data=%d viz=%d names=%s",
            len(lc_tools),
            len(tool_set["mcp_data"]["langchain_tools"]),
            len(tool_set["mcp_viz"]["langchain_tools"]),
            tool_names,
        )

    return tool_set
