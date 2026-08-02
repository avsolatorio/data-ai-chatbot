"""
Unit tests for the admin analytics endpoints (Phase 1).

Tests the endpoint functions directly with a mocked async DB session
(mirroring the no-live-database approach of test_admin_auth.py), plus
route registration and unauthenticated access checks.
"""

from datetime import date, datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.v1.admin.analytics import router
from app.main import app


class FakeRow:
    """Row-like object supporting both attribute and index access."""

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        self._keys = list(kwargs)

    def __getitem__(self, index):
        return self.__dict__[self._keys[index]]


class FakeResult:
    def __init__(self, scalar_one=None, one=None, all_rows=None):
        self._scalar_one = scalar_one
        self._one = one
        self._all = all_rows

    def scalar_one(self):
        return self._scalar_one

    def one(self):
        return self._one

    def all(self):
        return self._all


class FakeDb:
    """Async session stub returning preconfigured results per execute() call."""

    def __init__(self, results):
        self._results = list(results)
        self.executed = 0

    async def execute(self, stmt):
        if self.executed >= len(self._results):
            raise AssertionError("db.execute called more times than mocked")
        result = self._results[self.executed]
        self.executed += 1
        return result


def _one(value):
    return FakeResult(scalar_one=value)


def _rows(rows):
    return FakeResult(all_rows=rows)


# ---------------------------------------------------------------------------
# Route registration
# ---------------------------------------------------------------------------


def test_router_registers_analytics_paths():
    paths = [r.path for r in router.routes]
    assert paths == ["/users", "/chats", "/feedback", "/tokens"]


def test_endpoints_require_auth():
    client = TestClient(app)
    for path in (
        "/api/admin/analytics/users",
        "/api/admin/analytics/chats",
        "/api/admin/analytics/feedback",
        "/api/admin/analytics/tokens",
    ):
        response = client.get(path)
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /users
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_user_analytics_shape_and_values():
    db = FakeDb(
        [
            _one(10),  # totalUsers
            _one(7),  # registeredUsers
            _one(3),  # guestUsers
            _one(2),  # newUsers7d
            _one(4),  # newUsers30d
            _one(2),  # activeUsers7d
            _one(4),  # activeUsers30d
        ]
    )
    result = await router.routes[0].endpoint(admin={"id": "admin"}, db=db)

    assert db.executed == 7
    assert result == {
        "totalUsers": 10,
        "registeredUsers": 7,
        "guestUsers": 3,
        "newUsers7d": 2,
        "newUsers30d": 4,
        "activeUsers7d": 2,
        "activeUsers30d": 4,
    }


@pytest.mark.asyncio
async def test_user_analytics_handles_none_scalars():
    db = FakeDb([_one(None) for _ in range(7)])
    result = await router.routes[0].endpoint(admin={"id": "admin"}, db=db)
    assert result["totalUsers"] == 0
    assert result["registeredUsers"] == 0
    assert result["guestUsers"] == 0


@pytest.mark.asyncio
async def test_user_analytics_with_date_range():
    """from_date/to_date params flow through without error."""
    db = FakeDb([_one(None) for _ in range(7)])
    result = await router.routes[0].endpoint(
        admin={"id": "admin"},
        db=db,
        from_date=date(2026, 1, 1),
        to_date=date(2026, 7, 1),
    )
    assert result["totalUsers"] == 0


# ---------------------------------------------------------------------------
# GET /chats
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_chat_analytics_shape_and_values():
    db = FakeDb(
        [
            _one(10),  # totalChats
            _one(40),  # totalMessages
            _one(3),  # chats7d
            _one(6),  # chats30d
            _rows(
                [
                    ({"latest": {"modelId": "gpt-5.2"}, "byMessageId": {"m1": {}}},),
                    ({"modelId": "azure/gpt-4o"},),  # legacy plain usage dict
                    (None,),
                ]
            ),
        ]
    )
    result = await router.routes[1].endpoint(admin={"id": "admin"}, db=db)

    assert result["totalChats"] == 10
    assert result["totalMessages"] == 40
    assert result["chats7d"] == 3
    assert result["chats30d"] == 6
    assert result["avgMessagesPerChat"] == 4.0
    assert result["topModels"] == [
        {"model": "gpt-5.2", "count": 1},
        {"model": "azure/gpt-4o", "count": 1},
    ]


@pytest.mark.asyncio
async def test_chat_analytics_empty_db():
    db = FakeDb([_one(0), _one(0), _one(0), _one(0), _rows([])])
    result = await router.routes[1].endpoint(admin={"id": "admin"}, db=db)

    assert result["totalChats"] == 0
    assert result["totalMessages"] == 0
    assert result["avgMessagesPerChat"] == 0.0  # no division by zero
    assert result["topModels"] == []


@pytest.mark.asyncio
async def test_chat_analytics_with_date_range():
    db = FakeDb([_one(0), _one(0), _one(0), _one(0), _rows([])])
    result = await router.routes[1].endpoint(
        admin={"id": "admin"},
        db=db,
        from_date=date(2026, 1, 1),
        to_date=date(2026, 7, 1),
    )
    assert result["totalChats"] == 0


# ---------------------------------------------------------------------------
# GET /feedback
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_feedback_analytics_shape_and_values():
    db = FakeDb(
        [
            _one(3.75),  # avgRating
            FakeResult(
                all_rows=[
                    (1, 5),
                    (2, 10),
                    (3, 20),
                    (4, 35),
                    (5, 30),
                ]
            ),  # ratingDistribution
            _one(100),  # totalFeedback
            _one(12),  # feedback7d
            FakeResult(one=(72, 100)),  # upvotes, total votes
            _rows(
                [
                    FakeRow(date=date(2026, 7, 25), avg_rating=4.1, count=12),
                    FakeRow(date=date(2026, 7, 26), avg_rating=3.9, count=15),
                ]
            ),
        ]
    )
    result = await router.routes[2].endpoint(admin={"id": "admin"}, db=db)

    assert result["avgRating"] == 3.8
    assert result["ratingDistribution"] == {
        "1": 5,
        "2": 10,
        "3": 20,
        "4": 35,
        "5": 30,
    }
    assert result["totalFeedback"] == 100
    assert result["feedback7d"] == 12
    assert result["upvoteRatio"] == 0.72
    assert result["feedbackTrend"] == [
        {"date": "2026-07-25", "avgRating": 4.1, "count": 12},
        {"date": "2026-07-26", "avgRating": 3.9, "count": 15},
    ]


@pytest.mark.asyncio
async def test_feedback_analytics_empty_db():
    db = FakeDb(
        [
            _one(None),  # avgRating -> 0
            FakeResult(all_rows=[]),  # ratingDistribution
            _one(0),  # totalFeedback
            _one(0),  # feedback7d
            FakeResult(one=(0, 0)),  # no votes -> ratio 0.0
            _rows([]),  # trend
        ]
    )
    result = await router.routes[2].endpoint(admin={"id": "admin"}, db=db)

    assert result["avgRating"] == 0
    assert result["ratingDistribution"] == {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    assert result["totalFeedback"] == 0
    assert result["upvoteRatio"] == 0.0
    assert result["feedbackTrend"] == []


@pytest.mark.asyncio
async def test_feedback_analytics_with_date_range():
    db = FakeDb(
        [
            _one(None),
            FakeResult(all_rows=[]),
            _one(0),
            _one(0),
            FakeResult(one=(0, 0)),
            _rows([]),
        ]
    )
    result = await router.routes[2].endpoint(
        admin={"id": "admin"},
        db=db,
        from_date=date(2026, 1, 1),
        to_date=date(2026, 7, 1),
    )
    assert result["totalFeedback"] == 0


# ---------------------------------------------------------------------------
# GET /tokens (date helpers inside tests to avoid drift)
# ---------------------------------------------------------------------------


def _now():
    return datetime.utcnow()


def _days_ago(days: int) -> datetime:
    return datetime.utcnow() - timedelta(days=days)


@pytest.mark.asyncio
async def test_token_analytics_happy_path():
    """Two chats with usage: one recent (7d), one older (30d)."""
    ago_1d = _days_ago(1)
    ago_10d = _days_ago(10)
    ago_60d = _days_ago(60)
    db = FakeDb(
        [
            _rows(
                [
                    (
                        {
                            "latest": {
                                "inputTokens": 100,
                                "outputTokens": 50,
                                "totalTokens": 150,
                                "modelId": "gpt-4o",
                                "costUSD": {"inputUSD": 0.01, "outputUSD": 0.02, "totalUSD": 0.03},
                            }
                        },
                        ago_1d,
                    ),
                    (
                        {
                            "latest": {
                                "inputTokens": 200,
                                "outputTokens": 100,
                                "totalTokens": 300,
                                "modelId": "gpt-4o",
                                "costUSD": {"inputUSD": 0.02, "outputUSD": 0.04, "totalUSD": 0.06},
                            }
                        },
                        ago_10d,
                    ),
                    (
                        {
                            "inputTokens": 50,
                            "outputTokens": 0,
                            "totalTokens": 50,
                            "modelId": "claude-3",
                        },
                        ago_60d,
                    ),
                ]
            )
        ]
    )
    result = await router.routes[3].endpoint(admin={"id": "admin"}, db=db)

    assert result["totalTokens"] == 500
    assert result["promptTokens"] == 350
    assert result["completionTokens"] == 150
    assert result["tokensByModel"] == {"gpt-4o": 450, "claude-3": 50}
    assert result["tokensLast7d"] == 150
    assert result["tokensLast30d"] == 450
    assert result["costEstimate7d"] == 0.03
    assert result["costEstimate30d"] == 0.09


@pytest.mark.asyncio
async def test_token_analytics_empty_db():
    db = FakeDb([_rows([])])
    result = await router.routes[3].endpoint(admin={"id": "admin"}, db=db)

    assert result["totalTokens"] == 0
    assert result["promptTokens"] == 0
    assert result["completionTokens"] == 0
    assert result["tokensByModel"] == {}
    assert result["tokensLast7d"] == 0
    assert result["tokensLast30d"] == 0
    assert result["costEstimate7d"] == 0.0
    assert result["costEstimate30d"] == 0.0


@pytest.mark.asyncio
async def test_token_analytics_null_last_context():
    """Rows with null lastContext are skipped gracefully."""
    ago_1d = _days_ago(1)
    db = FakeDb(
        [
            _rows(
                [
                    (
                        None,
                        ago_1d,
                    ),
                    (
                        {"notUsage": True},
                        ago_1d,
                    ),
                ]
            )
        ]
    )
    result = await router.routes[3].endpoint(admin={"id": "admin"}, db=db)

    assert result["totalTokens"] == 0
    assert result["tokensLast7d"] == 0


@pytest.mark.asyncio
async def test_token_analytics_legacy_shape_no_cost():
    """Legacy usage without costUSD yields zero cost."""
    ago_1d = _days_ago(1)
    db = FakeDb(
        [
            _rows(
                [
                    (
                        {"inputTokens": 10, "totalTokens": 10, "modelId": "legacy-model"},
                        ago_1d,
                    ),
                ]
            )
        ]
    )
    result = await router.routes[3].endpoint(admin={"id": "admin"}, db=db)

    assert result["totalTokens"] == 10
    assert result["promptTokens"] == 10
    assert result["completionTokens"] == 0
    assert result["tokensByModel"] == {"legacy-model": 10}
    assert result["costEstimate7d"] == 0.0


@pytest.mark.asyncio
async def test_token_analytics_with_date_range():
    """Custom from/to range returns only matching chats."""
    db = FakeDb([_rows([])])
    result = await router.routes[3].endpoint(
        admin={"id": "admin"},
        db=db,
        from_date=date(2026, 1, 1),
        to_date=date(2026, 7, 1),
    )
    assert result["totalTokens"] == 0


@pytest.mark.asyncio
async def test_token_analytics_cost_with_float_cost():
    """costUSD as a flat float value is handled."""
    ago_1d = _days_ago(1)
    db = FakeDb(
        [
            _rows(
                [
                    (
                        {
                            "latest": {
                                "inputTokens": 10,
                                "outputTokens": 5,
                                "totalTokens": 15,
                                "modelId": "test-model",
                                "costUSD": 0.005,
                            }
                        },
                        ago_1d,
                    ),
                ]
            )
        ]
    )
    result = await router.routes[3].endpoint(admin={"id": "admin"}, db=db)

    assert result["tokensByModel"] == {"test-model": 15}
    assert result["costEstimate7d"] == 0.005


# ---------------------------------------------------------------------------
# DEF-006: Reversed date range
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reversed_date_range_returns_400():
    """from_date > to_date raises HTTPException 400."""
    from app.api.v1.admin.analytics import _resolve_date_range

    with pytest.raises(HTTPException) as excinfo:
        _resolve_date_range(
            from_date=date(9999, 12, 31),
            to_date=date(1, 1, 1),
        )
    assert excinfo.value.status_code == 400
    assert excinfo.value.detail == "from must be <= to"
