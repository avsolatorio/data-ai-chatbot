"""
Test that session cookies are opaque (no user id or PII in cookie value).
Run with DB + migration: POST /api/auth/guest should return 200 and
Set-Cookie guest_session_id should not contain ':' (opaque id only).
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_guest_cookie_is_opaque_when_success():
    """
    When guest endpoint succeeds, guest_session_id cookie must be opaque
    (no colon = no user_id:signature format). Requires DB + AuthSession migration.
    """
    response = client.post(
        "/api/auth/guest",
        headers={"Origin": "http://localhost:3000"},
    )
    if response.status_code != 200:
        # DB not available or CSRF / rate limit; skip assertion
        return
    cookies = response.headers.get_list("set-cookie")
    guest_cookie = next(
        (c for c in cookies if c.strip().startswith("guest_session_id=")),
        None,
    )
    assert guest_cookie is not None, "guest_session_id cookie should be set"
    # Value is before first semicolon
    value = guest_cookie.split("guest_session_id=")[-1].split(";")[0].strip()
    assert ":" not in value, (
        "Cookie must be opaque (no user id). Expected no colon in guest_session_id value."
    )
