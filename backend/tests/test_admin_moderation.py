"""
Tests for Phase 2 admin moderation endpoints:
- GET /api/admin/moderation/users
- POST /api/admin/moderation/users/{id}/disable
- GET /api/admin/moderation/chats
- DELETE /api/admin/moderation/chats/{id}
- disabled users are rejected by get_current_user

The DB-backed tests run against the local Postgres (conftest remaps host/port
to localhost:5433). They create their own fixture rows and always clean them
up, using a dedicated NullPool engine so connections never leak across event
loops. If no Postgres is reachable those tests are skipped. The disabled-auth
tests mock the DB and always run.
"""

import asyncio
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.api.deps import get_current_user, require_admin
from app.config import settings
from app.core.database import get_db
from app.main import app
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.models.vote import Vote

client = TestClient(app)

ADMIN = {"id": "00000000-0000-0000-0000-000000000001", "type": "regular"}

test_engine = create_async_engine(settings.POSTGRES_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


def _db_available() -> bool:
    async def probe():
        async with test_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    try:
        asyncio.run(probe())
        return True
    except Exception:
        return False


DB_AVAILABLE = _db_available()
requires_db = pytest.mark.skipif(not DB_AVAILABLE, reason="Postgres not reachable")


async def _get_test_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@pytest.fixture
def admin_override():
    app.dependency_overrides[require_admin] = lambda: ADMIN
    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.pop(require_admin, None)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def non_admin_override():
    """Override require_admin to raise 403 for non-admin rejection tests."""

    async def _deny():
        raise HTTPException(status_code=403, detail="You do not have admin access")

    app.dependency_overrides[require_admin] = _deny
    yield
    app.dependency_overrides.pop(require_admin, None)


async def _create_user(db, email, name=None, disabled=False):
    user = User(id=uuid.uuid4(), email=email, type="regular", name=name, disabled=disabled)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _create_chat(db, user_id, title, n_messages=0):
    now = datetime.utcnow()
    chat = Chat(
        id=uuid.uuid4(),
        userId=user_id,
        title=title,
        visibility="private",
        createdAt=now,
        updatedAt=now,
    )
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    for _ in range(n_messages):
        msg = Message(
            id=uuid.uuid4(),
            chatId=chat.id,
            role="user",
            parts=[],
            attachments=[],
            createdAt=datetime.utcnow(),
        )
        db.add(msg)
    if n_messages:
        await db.commit()
    return chat


async def _cleanup(users=None, chats=None):
    users = users or []
    chats = chats or []
    async with TestSessionLocal() as db:
        for chat in chats:
            await db.execute(delete(Vote).where(Vote.chatId == chat.id))
            await db.execute(delete(Message).where(Message.chatId == chat.id))
            await db.execute(delete(Chat).where(Chat.id == chat.id))
        for user in users:
            await db.execute(delete(User).where(User.id == user.id))
        await db.commit()


# ---------------------------------------------------------------------------
# GET /api/admin/moderation/users
# ---------------------------------------------------------------------------


@requires_db
async def test_list_users_returns_users_with_chat_counts(admin_override):
    users = []
    chats = []
    try:
        async with TestSessionLocal() as db:
            u1 = await _create_user(db, f"mod-{uuid.uuid4()}@example.com", name="Alpha")
            u2 = await _create_user(db, f"mod-{uuid.uuid4()}@example.com", name="Beta")
            users.extend([u1, u2])
            c1 = await _create_chat(db, u1.id, "Chat one", n_messages=2)
            c2 = await _create_chat(db, u1.id, "Chat two", n_messages=1)
            chats.extend([c1, c2])

        # Filter by email prefix to isolate our test users
        prefix = u1.email.split("@")[0].split("-")[0]
        response = client.get(f"/api/admin/moderation/users?q={prefix}")
        assert response.status_code == 200
        data = response.json()
        by_id = {u["id"]: u for u in data["users"]}
        assert by_id[str(u1.id)]["email"] == u1.email
        assert by_id[str(u1.id)]["chatCount"] == 2
        assert by_id[str(u2.id)]["chatCount"] == 0
        assert by_id[str(u2.id)]["disabled"] is False
        assert by_id[str(u1.id)]["type"] == "regular"
        assert by_id[str(u1.id)]["name"] == "Alpha"
        assert "createdAt" in by_id[str(u1.id)]
        assert data["total"] >= 2
    finally:
        await _cleanup(users, chats)


@requires_db
async def test_list_users_search_filters_by_email(admin_override):
    users = []
    try:
        async with TestSessionLocal() as db:
            u = await _create_user(db, f"modsearch-{uuid.uuid4()}@example.com")
            users.append(u)

        unique = u.email.split("@")[0]
        response = client.get(f"/api/admin/moderation/users?q={unique}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 1
        assert data["users"][0]["id"] == str(u.id)
        assert data["total"] == 1

        response2 = client.get("/api/admin/moderation/users?q=zzzz-no-match-zzzz")
        assert response2.json()["total"] == 0
    finally:
        await _cleanup(users)


@requires_db
async def test_list_users_respects_pagination(admin_override):
    users = []
    try:
        async with TestSessionLocal() as db:
            u1 = await _create_user(db, f"modpage-{uuid.uuid4()}@example.com")
            u2 = await _create_user(db, f"modpage-{uuid.uuid4()}@example.com")
            users.extend([u1, u2])

        response = client.get("/api/admin/moderation/users?pageSize=1&page=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 1
        assert data["total"] >= 2
    finally:
        await _cleanup(users)


# ---------------------------------------------------------------------------
# POST /api/admin/moderation/users/{id}/disable  (toggle)
# ---------------------------------------------------------------------------


@requires_db
async def test_toggle_user_disabled_flips_state(admin_override):
    """Toggle flips disabled from False to True, then True to False."""
    users = []
    try:
        async with TestSessionLocal() as db:
            u = await _create_user(db, f"modtoggle-{uuid.uuid4()}@example.com")
            users.append(u)

        # Initially not disabled
        assert u.disabled is False

        # First toggle: False -> True
        response = client.post(f"/api/admin/moderation/users/{u.id}/disable")
        assert response.status_code == 200
        assert response.json() == {"ok": True, "disabled": True}

        # Second toggle: True -> False (round-trip)
        response = client.post(f"/api/admin/moderation/users/{u.id}/disable")
        assert response.status_code == 200
        assert response.json() == {"ok": True, "disabled": False}

        # Third call confirms idempotent toggle
        response = client.post(f"/api/admin/moderation/users/{u.id}/disable")
        assert response.status_code == 200
        assert response.json() == {"ok": True, "disabled": True}
    finally:
        await _cleanup(users)


@requires_db
async def test_toggle_user_disabled_returns_404_for_missing_user(admin_override):
    response = client.post(f"/api/admin/moderation/users/{uuid.uuid4()}/disable")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


# ---------------------------------------------------------------------------
# GET /api/admin/moderation/chats
# ---------------------------------------------------------------------------


@requires_db
async def test_list_chats_returns_chats_with_email_and_message_count(admin_override):
    users = []
    chats = []
    try:
        async with TestSessionLocal() as db:
            u = await _create_user(db, f"modchats-{uuid.uuid4()}@example.com")
            users.append(u)
            c = await _create_chat(db, u.id, "Admin chat title", n_messages=3)
            chats.append(c)

        response = client.get("/api/admin/moderation/chats")
        assert response.status_code == 200
        data = response.json()
        by_id = {ch["id"]: ch for ch in data["chats"]}
        assert by_id[str(c.id)]["title"] == "Admin chat title"
        assert by_id[str(c.id)]["userId"] == str(u.id)
        assert by_id[str(c.id)]["userEmail"] == u.email
        assert by_id[str(c.id)]["messageCount"] == 3
        assert "createdAt" in by_id[str(c.id)]
        assert "updatedAt" in by_id[str(c.id)]
        assert data["total"] >= 1
    finally:
        await _cleanup(users, chats)


@requires_db
async def test_list_chats_filters_by_title_and_user_id(admin_override):
    users = []
    chats = []
    try:
        async with TestSessionLocal() as db:
            u1 = await _create_user(db, f"modcf-{uuid.uuid4()}@example.com")
            u2 = await _create_user(db, f"modcf-{uuid.uuid4()}@example.com")
            users.extend([u1, u2])
            c1 = await _create_chat(db, u1.id, "UniqueSearchTerm")
            c2 = await _create_chat(db, u2.id, "Other")
            chats.extend([c1, c2])

        response = client.get("/api/admin/moderation/chats?q=UniqueSearchTerm")
        assert response.status_code == 200
        data = response.json()
        assert len(data["chats"]) == 1
        assert data["chats"][0]["id"] == str(c1.id)

        response = client.get(f"/api/admin/moderation/chats?userId={u1.id}")
        data = response.json()
        assert all(ch["userId"] == str(u1.id) for ch in data["chats"])
    finally:
        await _cleanup(users, chats)


@requires_db
async def test_list_chats_excludes_soft_deleted(admin_override):
    """Soft-deleted chats should not appear in list."""
    users = []
    chats = []
    try:
        async with TestSessionLocal() as db:
            u = await _create_user(db, f"modsd-{uuid.uuid4()}@example.com")
            users.append(u)
            c1 = await _create_chat(db, u.id, "Visible chat")
            c2 = await _create_chat(db, u.id, "Deleted chat")
            chats.extend([c1, c2])

        # Soft-delete c2
        client.delete(f"/api/admin/moderation/chats/{c2.id}")

        response = client.get("/api/admin/moderation/chats")
        data = response.json()
        chat_ids = [ch["id"] for ch in data["chats"]]
        assert str(c1.id) in chat_ids
        assert str(c2.id) not in chat_ids
    finally:
        await _cleanup(users, chats)


@requires_db
async def test_list_chats_respects_pagination(admin_override):
    users = []
    chats = []
    try:
        async with TestSessionLocal() as db:
            u = await _create_user(db, f"modchpage-{uuid.uuid4()}@example.com")
            users.append(u)
            c1 = await _create_chat(db, u.id, "Page chat 1")
            c2 = await _create_chat(db, u.id, "Page chat 2")
            chats.extend([c1, c2])

        response = client.get("/api/admin/moderation/chats?pageSize=1&page=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["chats"]) == 1
        assert data["total"] >= 2
    finally:
        await _cleanup(users, chats)


# ---------------------------------------------------------------------------
# DELETE /api/admin/moderation/chats/{id}  (soft delete)
# ---------------------------------------------------------------------------


@requires_db
async def test_delete_chat_soft_deletes(admin_override):
    """Soft-delete sets deletedAt, chat row still exists."""
    users = []
    chats = []
    try:
        async with TestSessionLocal() as db:
            u = await _create_user(db, f"moddel-{uuid.uuid4()}@example.com")
            users.append(u)
            c = await _create_chat(db, u.id, "Doomed chat", n_messages=2)
            chats.append(c)

        response = client.delete(f"/api/admin/moderation/chats/{c.id}")
        assert response.status_code == 200
        assert response.json() == {"ok": True}

        # Chat row still exists with deletedAt set
        async with TestSessionLocal() as db:
            chat = await db.get(Chat, c.id)
            assert chat is not None
            assert chat.deletedAt is not None

            # Messages also soft-deleted
            msgs = (
                await db.execute(
                    select(Message.id).where(Message.chatId == c.id, Message.deletedAt.is_(None))
                )
            ).all()
            assert len(msgs) == 0

            # Votes hard-deleted
            vote_count = (
                await db.execute(
                    text(f'SELECT count(*) FROM "Vote_v2" WHERE "chatId" = \'{c.id}\'')
                )
            ).scalar()
            assert vote_count == 0
    finally:
        await _cleanup(users, chats)


@requires_db
async def test_delete_chat_returns_404_for_missing_chat(admin_override):
    response = client.delete(f"/api/admin/moderation/chats/{uuid.uuid4()}")
    assert response.status_code == 404


@requires_db
async def test_delete_chat_idempotent_second_call_404(admin_override):
    """Second soft-delete on same chat returns 404."""
    users = []
    chats = []
    try:
        async with TestSessionLocal() as db:
            u = await _create_user(db, f"moddel2-{uuid.uuid4()}@example.com")
            users.append(u)
            c = await _create_chat(db, u.id, "Soft kill me")
            chats.append(c)

        response1 = client.delete(f"/api/admin/moderation/chats/{c.id}")
        assert response1.status_code == 200

        response2 = client.delete(f"/api/admin/moderation/chats/{c.id}")
        assert response2.status_code == 404
    finally:
        await _cleanup(users, chats)


# ---------------------------------------------------------------------------
# Non-admin 403
# ---------------------------------------------------------------------------


def test_users_endpoint_rejects_non_admin(non_admin_override):
    response = client.get("/api/admin/moderation/users")
    assert response.status_code == 403


def test_toggle_disable_endpoint_rejects_non_admin(non_admin_override):
    response = client.post(f"/api/admin/moderation/users/{uuid.uuid4()}/disable")
    assert response.status_code == 403


def test_chats_endpoint_rejects_non_admin(non_admin_override):
    response = client.get("/api/admin/moderation/chats")
    assert response.status_code == 403


def test_delete_chat_endpoint_rejects_non_admin(non_admin_override):
    response = client.delete(f"/api/admin/moderation/chats/{uuid.uuid4()}")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# DEF-005: Null byte in search query
# ---------------------------------------------------------------------------


@requires_db
async def test_list_users_null_byte_search_returns_empty(admin_override):
    """q=%00 returns 200 with empty list after stripping null bytes."""
    response = client.get("/api/admin/moderation/users?q=%00")
    assert response.status_code == 200
    data = response.json()
    assert data["users"] == []
    assert data["total"] == 0


@requires_db
async def test_list_chats_null_byte_search_returns_empty(admin_override):
    """q=%00 returns 200 with empty list after stripping null bytes."""
    response = client.get("/api/admin/moderation/chats?q=%00")
    assert response.status_code == 200
    data = response.json()
    assert data["chats"] == []
    assert data["total"] == 0


@requires_db
async def test_list_users_null_byte_with_text(admin_override):
    """q=foo%00bar strips null bytes and searches for 'foobar'."""
    users = []
    try:
        async with TestSessionLocal() as db:
            u1 = await _create_user(db, f"foobar-{uuid.uuid4()}@example.com")
            u2 = await _create_user(db, f"other-{uuid.uuid4()}@example.com")
            users.extend([u1, u2])

        response = client.get("/api/admin/moderation/users?q=foo%00bar")
        assert response.status_code == 200
        data = response.json()
        # "foobar" in email matches after null bytes stripped
        assert data["total"] >= 1
    finally:
        await _cleanup(users)


# ---------------------------------------------------------------------------
# get_current_user disabled check (mocked, no DB)
# ---------------------------------------------------------------------------


def _make_request():
    req = MagicMock()
    req.cookies = {}
    req.url.path = "/api/test"
    return req


def _make_credentials():
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-token")


def _make_user(disabled: bool):
    user = MagicMock()
    user.id = uuid.uuid4()
    user.email = "user@example.com"
    user.type = "regular"
    user.name = "User"
    user.password_changed_at = None
    user.disabled = disabled
    return user


@pytest.mark.asyncio
async def test_get_current_user_rejects_disabled_user():
    user = _make_user(disabled=True)
    user_id = str(user.id)

    with (
        patch(
            "app.api.deps.decode_access_token",
            return_value={"sub": user_id, "type": "regular", "jti": "jti-1"},
        ),
        patch("app.api.deps.is_token_revoked", new=AsyncMock(return_value=False)),
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
    ):
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user(
                request=_make_request(),
                credentials=_make_credentials(),
                db=AsyncMock(),
            )

    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Account has been disabled"


@pytest.mark.asyncio
async def test_get_current_user_allows_enabled_user():
    user = _make_user(disabled=False)
    user_id = str(user.id)

    with (
        patch(
            "app.api.deps.decode_access_token",
            return_value={"sub": user_id, "type": "regular", "jti": "jti-2"},
        ),
        patch("app.api.deps.is_token_revoked", new=AsyncMock(return_value=False)),
        patch("app.api.deps.get_user_by_id", new=AsyncMock(return_value=user)),
    ):
        result = await get_current_user(
            request=_make_request(),
            credentials=_make_credentials(),
            db=AsyncMock(),
        )

    assert result == {"id": user_id, "type": "regular"}
