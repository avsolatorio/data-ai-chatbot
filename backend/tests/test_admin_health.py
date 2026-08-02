"""
Unit tests for the Phase 3 admin health endpoints (GET /api/admin/health and
GET /api/admin/health/metrics).

The endpoint logic is exercised directly with a fake session so no live
database is required; wiring is verified through the ASGI app.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.deps import require_admin
from app.api.v1.admin.health import get_health, get_metrics
from app.core.database import get_db
from app.main import app


class _FakeSession:
    """Minimal AsyncSession stand-in: execute() is awaitable."""

    def __init__(
        self,
        execute_ok: bool = True,
        count: int = 0,
        token_row: tuple = (0, 0.0),
        pool_size: int | None = None,  # kept for test readability, engine.pool is used
    ):
        self.execute_ok = execute_ok
        self._count = count
        self._token_row = token_row
        self._pool_size = pool_size
        self.executed: list = []

    async def execute(self, stmt):
        self.executed.append(stmt)
        if not self.execute_ok:
            raise RuntimeError("db down")
        rendered = str(stmt)
        result = MagicMock()
        if "authsession" in rendered.lower():
            result.scalar.return_value = self._count
        elif "chattokenusage" in rendered.lower():
            result.one.return_value = self._token_row
        else:
            result.scalar.return_value = self._count
        return result


def _admin() -> dict:
    return {"id": "00000000-0000-0000-0000-000000000001", "type": "regular"}


# ---------------------------------------------------------------------------
# get_health
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_health_ok():
    db = _FakeSession()
    with patch(
        "app.api.v1.admin.health._check_mcp", new=AsyncMock(return_value=(True, "connected"))
    ):
        body = await get_health(admin=_admin(), db=db)
    assert body["status"] == "ok"
    assert body["db"] == "connected"
    assert body["mcp"] == "connected"
    assert body["mcpReason"] == "connected"
    assert isinstance(body["uptimeSeconds"], int)
    assert body["uptimeSeconds"] >= 0


@pytest.mark.asyncio
async def test_get_health_degraded_when_db_down():
    db = _FakeSession(execute_ok=False)
    with patch(
        "app.api.v1.admin.health._check_mcp", new=AsyncMock(return_value=(True, "connected"))
    ):
        body = await get_health(admin=_admin(), db=db)
    assert body["status"] == "degraded"
    assert body["db"] == "error"
    assert body["mcp"] == "connected"


@pytest.mark.asyncio
async def test_get_health_degraded_when_mcp_down():
    db = _FakeSession()
    with patch("app.api.v1.admin.health._check_mcp", new=AsyncMock(return_value=(False, "error"))):
        body = await get_health(admin=_admin(), db=db)
    assert body["status"] == "degraded"
    assert body["db"] == "connected"
    assert body["mcp"] == "error"
    assert body["mcpReason"] == "error"


@pytest.mark.asyncio
async def test_get_health_degraded_when_mcp_unreachable():
    db = _FakeSession()
    with patch(
        "app.api.v1.admin.health._check_mcp", new=AsyncMock(return_value=(False, "unreachable"))
    ):
        body = await get_health(admin=_admin(), db=db)
    assert body["status"] == "degraded"
    assert body["db"] == "connected"
    assert body["mcp"] == "unreachable"
    assert body["mcpReason"] == "unreachable"


@pytest.mark.asyncio
async def test_get_health_degraded_when_both_down():
    db = _FakeSession(execute_ok=False)
    with patch("app.api.v1.admin.health._check_mcp", new=AsyncMock(return_value=(False, "error"))):
        body = await get_health(admin=_admin(), db=db)
    assert body["status"] == "degraded"
    assert body["db"] == "error"
    assert body["mcp"] == "error"


@pytest.mark.asyncio
async def test_get_health_pings_db_with_select_1():
    db = _FakeSession()
    with patch(
        "app.api.v1.admin.health._check_mcp", new=AsyncMock(return_value=(True, "connected"))
    ):
        await get_health(admin=_admin(), db=db)
    assert len(db.executed) >= 1
    assert any("SELECT 1" in str(e) for e in db.executed)


# ---------------------------------------------------------------------------
# get_metrics
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_metrics_basic_shape():
    db = _FakeSession(count=7, token_row=(5000, 0.025))
    with patch("app.api.v1.admin.health.engine") as mock_engine:
        mock_engine.pool.size.return_value = 5
        mock_engine.pool.checkedout.return_value = 2
        body = await get_metrics(admin=_admin(), db=db)
    assert body["errorRate24h"] == 0.0
    assert body["avgResponseTimeMs"] == 0
    assert body["rateLimitHits24h"] == 0
    assert body["activeSessions"] == 7
    assert isinstance(body["dbPoolSize"], dict)
    assert body["dbPoolSize"]["size"] == 5
    assert body["dbPoolSize"]["checkedOut"] == 2
    assert body["totalTokens24h"] == 5000
    assert body["tokenRate24h"] == round(5000 / 1440.0, 1)
    assert body["costEstimate24h"] == round(0.025, 6)


@pytest.mark.asyncio
async def test_get_metrics_zero_tokens_defaults():
    db = _FakeSession(count=3, token_row=(0, 0.0))
    with patch("app.api.v1.admin.health.engine") as mock_engine:
        mock_engine.pool.size.return_value = 3
        mock_engine.pool.checkedout.return_value = 0
        body = await get_metrics(admin=_admin(), db=db)
    assert body["totalTokens24h"] == 0
    assert body["tokenRate24h"] == 0.0
    assert body["costEstimate24h"] == 0.0
    assert body["activeSessions"] == 3


@pytest.mark.asyncio
async def test_get_metrics_token_rate_calculation():
    db = _FakeSession(count=1, token_row=(1440, 0.0))
    with patch("app.api.v1.admin.health.engine") as mock_engine:
        mock_engine.pool.size.return_value = 1
        mock_engine.pool.checkedout.return_value = 0
        body = await get_metrics(admin=_admin(), db=db)
    assert body["totalTokens24h"] == 1440
    assert body["tokenRate24h"] == 1.0  # 1440 tokens / 1440 minutes


@pytest.mark.asyncio
async def test_get_metrics_pool_unavailable():
    db = _FakeSession(count=3)
    with patch("app.api.v1.admin.health.engine") as mock_engine:
        mock_engine.pool.size.return_value = 0
        mock_engine.pool.checkedout.return_value = 0
        body = await get_metrics(admin=_admin(), db=db)
    assert body["dbPoolSize"] == {"size": 0, "checkedOut": 0}
    assert body["activeSessions"] == 3


@pytest.mark.asyncio
async def test_get_metrics_sessions_query():
    db = _FakeSession(count=3)
    await get_metrics(admin=_admin(), db=db)
    rendered_all = " ".join(str(e) for e in db.executed)
    assert "AuthSession" in rendered_all


@pytest.mark.asyncio
async def test_get_metrics_token_usage_query():
    db = _FakeSession(count=0, token_row=(100, 0.001))
    await get_metrics(admin=_admin(), db=db)
    rendered_all = " ".join(str(e) for e in db.executed)
    assert "chattokenusage" in rendered_all.lower()


# ---------------------------------------------------------------------------
# Wiring through the ASGI app
# ---------------------------------------------------------------------------


def test_health_requires_auth():
    client = TestClient(app)
    response = client.get("/api/admin/health")
    assert response.status_code == 401


def test_metrics_requires_auth():
    client = TestClient(app)
    response = client.get("/api/admin/health/metrics")
    assert response.status_code == 401


def test_health_returns_200_for_admin():
    client = TestClient(app)

    async def _override_db():
        yield _FakeSession(count=4, token_row=(200, 0.001))

    with (
        patch(
            "app.api.v1.admin.health._check_mcp",
            new=AsyncMock(return_value=(True, "connected")),
        ),
        patch.object(app, "dependency_overrides", {require_admin: lambda: _admin()}),
    ):
        app.dependency_overrides[get_db] = _override_db
        response = client.get("/api/admin/health")

    data = response.json()
    assert response.status_code == 200
    assert data["status"] == "ok"
    assert data["db"] == "connected"
    assert data["mcp"] == "connected"
    assert data["mcpReason"] == "connected"
    assert isinstance(data["uptimeSeconds"], int)


def test_metrics_returns_200_for_admin():
    client = TestClient(app)

    async def _override_db():
        yield _FakeSession(count=4, token_row=(200, 0.001))

    with patch.object(app, "dependency_overrides", {require_admin: lambda: _admin()}):
        app.dependency_overrides[get_db] = _override_db
        response = client.get("/api/admin/health/metrics")

    data = response.json()
    assert response.status_code == 200
    assert data["errorRate24h"] == 0.0
    assert data["avgResponseTimeMs"] == 0
    assert data["rateLimitHits24h"] == 0
    assert data["activeSessions"] == 4
    assert isinstance(data["dbPoolSize"], dict)
    assert "size" in data["dbPoolSize"]
    assert "checkedOut" in data["dbPoolSize"]
    assert "totalTokens24h" in data
    assert "tokenRate24h" in data
    assert "costEstimate24h" in data
