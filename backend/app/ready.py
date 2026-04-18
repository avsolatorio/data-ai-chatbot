"""Dependency readiness checks for GET /ready."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.config import get_mcp_settings, settings

logger = logging.getLogger(__name__)


async def _check_data360_mcp() -> tuple[bool, str | None]:
    from app.ai.mcp_tools.adapter_factory import (
        MCP_DATA360_SERVER_NAME,
        create_multiserver_mcp_client,
    )

    mcp = get_mcp_settings()
    timeout = mcp.readiness_timeout if mcp.readiness_timeout > 0 else mcp.load_timeout
    try:
        client = create_multiserver_mcp_client()
        tools = await asyncio.wait_for(
            client.get_tools(server_name=MCP_DATA360_SERVER_NAME),
            timeout=timeout,
        )
    except TimeoutError:
        logger.warning("[ready] data360_mcp check timed out after %ss", timeout)
        return False, "timeout"
    except Exception:
        logger.warning("[ready] data360_mcp check failed", exc_info=True)
        return False, "mcp_unreachable"
    if not tools:
        logger.warning("[ready] data360_mcp returned no tools")
        return False, "no_tools"
    return True, None


async def run_readiness() -> tuple[int, dict[str, Any]]:
    if not settings.READINESS_ENABLED:
        return 200, {
            "status": "ready",
            "checks": {},
            "readiness_checks": "disabled",
        }

    mcp = get_mcp_settings()
    checks: dict[str, Any] = {}

    if not mcp.readiness_enabled:
        checks["data360_mcp"] = {"ok": True, "skipped": True}
        return 200, {"status": "ready", "checks": checks}

    ok, detail = await _check_data360_mcp()
    entry: dict[str, Any] = {"ok": ok}
    if detail:
        entry["detail"] = detail
    checks["data360_mcp"] = entry
    if not ok:
        return 503, {"status": "not_ready", "checks": checks}
    return 200, {"status": "ready", "checks": checks}
