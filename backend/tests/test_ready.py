"""Tests for GET /ready (Data360 MCP readiness)."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app import ready as ready_mod
from app.main import app

client = TestClient(app)


def test_ready_readiness_globally_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ready_mod.settings, "READINESS_ENABLED", False)
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["readiness_checks"] == "disabled"
    assert data["checks"] == {}


def test_ready_mcp_check_skipped(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ready_mod.settings, "READINESS_ENABLED", True)

    def fake_mcp() -> MagicMock:
        m = MagicMock()
        m.readiness_enabled = False
        return m

    monkeypatch.setattr(ready_mod, "get_mcp_settings", fake_mcp)
    response = client.get("/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["checks"]["data360_mcp"]["ok"] is True
    assert body["checks"]["data360_mcp"]["skipped"] is True


def test_ready_mcp_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ready_mod.settings, "READINESS_ENABLED", True)
    mcp = MagicMock()
    mcp.readiness_enabled = True
    mcp.readiness_timeout = 0.0
    mcp.load_timeout = 5.0
    monkeypatch.setattr(ready_mod, "get_mcp_settings", lambda: mcp)

    fake_client = MagicMock()
    fake_client.get_tools = AsyncMock(return_value=[MagicMock()])

    monkeypatch.setattr(
        "app.ai.mcp_tools.adapter_factory.create_multiserver_mcp_client",
        lambda: fake_client,
    )
    response = client.get("/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["checks"]["data360_mcp"]["ok"] is True


def test_ready_mcp_unreachable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ready_mod.settings, "READINESS_ENABLED", True)
    mcp = MagicMock()
    mcp.readiness_enabled = True
    mcp.readiness_timeout = 0.0
    mcp.load_timeout = 5.0
    monkeypatch.setattr(ready_mod, "get_mcp_settings", lambda: mcp)

    fake_client = MagicMock()
    fake_client.get_tools = AsyncMock(side_effect=ConnectionError("refused"))

    monkeypatch.setattr(
        "app.ai.mcp_tools.adapter_factory.create_multiserver_mcp_client",
        lambda: fake_client,
    )
    response = client.get("/ready")
    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "not_ready"
    assert body["checks"]["data360_mcp"]["ok"] is False
    assert body["checks"]["data360_mcp"]["detail"] == "mcp_unreachable"


def test_ready_mcp_no_tools(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ready_mod.settings, "READINESS_ENABLED", True)
    mcp = MagicMock()
    mcp.readiness_enabled = True
    mcp.readiness_timeout = 0.0
    mcp.load_timeout = 5.0
    monkeypatch.setattr(ready_mod, "get_mcp_settings", lambda: mcp)

    fake_client = MagicMock()
    fake_client.get_tools = AsyncMock(return_value=[])

    monkeypatch.setattr(
        "app.ai.mcp_tools.adapter_factory.create_multiserver_mcp_client",
        lambda: fake_client,
    )
    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json()["checks"]["data360_mcp"]["detail"] == "no_tools"


def test_ready_mcp_timeout(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(ready_mod.settings, "READINESS_ENABLED", True)
    mcp = MagicMock()
    mcp.readiness_enabled = True
    mcp.readiness_timeout = 0.05
    mcp.load_timeout = 5.0
    monkeypatch.setattr(ready_mod, "get_mcp_settings", lambda: mcp)

    async def slow(*_args: object, **_kwargs: object) -> list[object]:
        import asyncio

        await asyncio.sleep(1.0)
        return []

    fake_client = MagicMock()
    fake_client.get_tools = AsyncMock(side_effect=slow)

    monkeypatch.setattr(
        "app.ai.mcp_tools.adapter_factory.create_multiserver_mcp_client",
        lambda: fake_client,
    )
    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json()["checks"]["data360_mcp"]["detail"] == "timeout"
