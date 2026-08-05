"""Admin health endpoints (Phase 3)."""

import logging
import time
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.database import engine, get_db
from app.models.auth_session import AuthSession
from app.models.chat_token_usage import ChatTokenUsage

logger = logging.getLogger(__name__)
router = APIRouter()

# App start time for uptime computation.
_start_time = time.time()


async def _check_mcp() -> tuple[bool, str]:
    """
    Check MCP server connectivity.

    Connects via fastmcp.Client (full handshake) to verify the MCP protocol
    is working. Returns (ok, reason).
    """
    try:
        from app.ai.mcp_tools._client import get_mcp_client

        client = get_mcp_client()
        async with client:
            await client.list_tools()
        return True, "connected"
    except httpx.ConnectError:
        logger.warning("[admin/health] MCP unreachable", exc_info=True)
        return False, "unreachable"
    except Exception:
        logger.warning("[admin/health] MCP check failed", exc_info=True)
        return False, "error"


@router.get("")
async def get_health(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Liveness and connectivity summary for the admin dashboard."""
    db_ok = True
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        logger.warning("[admin/health] db check failed", exc_info=True)
        db_ok = False

    mcp_ok, mcp_reason = await _check_mcp()

    overall = "ok" if db_ok and mcp_ok else "degraded"
    uptime = int(time.time() - _start_time)

    return {
        "status": overall,
        "db": "connected" if db_ok else "error",
        "mcp": mcp_reason,
        "mcpReason": mcp_reason,
        "uptimeSeconds": uptime,
    }


@router.get("/metrics")
async def get_metrics(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Operational metrics for the admin dashboard."""
    now = datetime.utcnow()
    since = now - timedelta(hours=24)

    # Active (non-expired) sessions.
    result = await db.execute(
        select(func.count()).select_from(AuthSession).where(AuthSession.expires_at > now)
    )
    active_sessions = result.scalar() or 0

    # DB pool size: { size, checkedOut }.
    db_pool_size = {"size": 0, "checkedOut": 0}
    try:
        pool = engine.pool
        db_pool_size["size"] = int(pool.size())
        db_pool_size["checkedOut"] = int(pool.checkedout())
    except Exception:
        logger.debug("[admin/health] db pool size check failed", exc_info=True)

    # Token usage aggregation from ChatTokenUsage (last 24h).
    token_result = await db.execute(
        select(
            func.coalesce(func.sum(ChatTokenUsage.total_tokens), 0),
            func.coalesce(func.sum(ChatTokenUsage.cost_usd), 0.0),
        ).where(ChatTokenUsage.created_at >= since)
    )
    total_tokens_24h, cost_estimate_24h = token_result.one()
    total_tokens_24h = int(total_tokens_24h or 0)
    cost_estimate_24h = float(cost_estimate_24h or 0.0)

    # tokenRate24h = tokens per minute averaged over 24h (1440 minutes).
    token_rate_24h = round(total_tokens_24h / 1440.0, 1) if total_tokens_24h > 0 else 0.0

    return {
        "errorRate24h": 0.0,
        "avgResponseTimeMs": 0,
        "rateLimitHits24h": 0,
        "activeSessions": active_sessions,
        "dbPoolSize": db_pool_size,
        "totalTokens24h": total_tokens_24h,
        "tokenRate24h": token_rate_24h,
        "costEstimate24h": round(cost_estimate_24h, 6),
    }
