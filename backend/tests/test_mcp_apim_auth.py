"""Tests for MCP APIM authentication (issue #105).

Covers:
- ApimBearerAuth injects Authorization header on every request
- No auth when MCP_INTERNAL=False
- Token is refreshed by Azure Identity (per-request get_token call)
- MCPSettings validation fails fast with clear error when internal=True but credentials missing
- _parse_headers skips static bearer when dynamic auth is active
- _httpx_factory auth precedence: APIM auth > adapter-supplied auth > None

All tests are offline -- azure.identity.ClientSecretCredential is mocked.
"""

from __future__ import annotations

from typing import Generator
from unittest.mock import MagicMock, patch

import httpx
import pytest

from app.ai.mcp_tools._apim_auth import ApimBearerAuth, build_apim_auth, get_apim_bearer_token
from app.ai.mcp_tools.adapter_factory import _httpx_factory, _parse_headers

_SCOPE = "api://scope/.default"
_AZURE_ENV = {
    "AZURE_TENANT_ID": "tenant-id",
    "AZURE_CLIENT_ID": "client-id",
    "AZURE_CLIENT_SECRET": "client-secret",  # pragma: allowlist secret
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_mcp_settings(
    *,
    internal: bool = False,
    auth_scope: str = _SCOPE,
    authorization_bearer: str = "",
    headers_json: str = "",
    timeout: float = 30.0,
    ssl_verify: bool = True,
) -> MagicMock:
    """Return a MagicMock that looks like MCPSettings."""
    m = MagicMock()
    m.internal = internal
    m.auth_scope = auth_scope
    m.authorization_bearer = authorization_bearer
    m.headers_json = headers_json
    m.timeout = timeout
    m.ssl_verify = ssl_verify
    return m


def _fake_token(token_string: str = "fake-token-abc") -> MagicMock:
    t = MagicMock()
    t.token = token_string
    return t


# ---------------------------------------------------------------------------
# get_apim_bearer_token
# ---------------------------------------------------------------------------


class TestGetApimBearerToken:
    def test_returns_token_string(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for k, v in _AZURE_ENV.items():
            monkeypatch.setenv(k, v)

        with patch("app.ai.mcp_tools._apim_auth.ClientSecretCredential") as mock_cred_cls:
            mock_cred = MagicMock()
            mock_cred.get_token.return_value = _fake_token("my-access-token")
            mock_cred_cls.return_value = mock_cred

            import app.ai.mcp_tools._apim_auth as auth_mod

            auth_mod._credential = None
            auth_mod._credential_key = None

            token = get_apim_bearer_token(_SCOPE)

        assert token == "my-access-token"
        mock_cred.get_token.assert_called_once_with(_SCOPE)

    def test_reuses_credential_for_same_key(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for k, v in _AZURE_ENV.items():
            monkeypatch.setenv(k, v)

        with patch("app.ai.mcp_tools._apim_auth.ClientSecretCredential") as mock_cred_cls:
            mock_cred = MagicMock()
            mock_cred.get_token.return_value = _fake_token("tok1")
            mock_cred_cls.return_value = mock_cred

            import app.ai.mcp_tools._apim_auth as auth_mod

            auth_mod._credential = None
            auth_mod._credential_key = None

            get_apim_bearer_token(_SCOPE)
            get_apim_bearer_token(_SCOPE)

        assert mock_cred_cls.call_count == 1
        assert mock_cred.get_token.call_count == 2

    def test_recreates_credential_on_tenant_change(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for k, v in _AZURE_ENV.items():
            monkeypatch.setenv(k, v)

        with patch("app.ai.mcp_tools._apim_auth.ClientSecretCredential") as mock_cred_cls:
            mock_cred = MagicMock()
            mock_cred.get_token.return_value = _fake_token()
            mock_cred_cls.return_value = mock_cred

            import app.ai.mcp_tools._apim_auth as auth_mod

            auth_mod._credential = None
            auth_mod._credential_key = None

            get_apim_bearer_token(_SCOPE)

            monkeypatch.setenv("AZURE_TENANT_ID", "other-tenant")
            get_apim_bearer_token(_SCOPE)

        assert mock_cred_cls.call_count == 2


# ---------------------------------------------------------------------------
# ApimBearerAuth
# ---------------------------------------------------------------------------


class TestApimBearerAuth:
    def _run_auth_flow(self, auth: ApimBearerAuth, request: httpx.Request) -> httpx.Request:
        """Exhaust the auth_flow generator and return the modified request."""
        gen: Generator = auth.auth_flow(request)
        modified = next(gen)
        try:
            gen.send(MagicMock(spec=httpx.Response))
        except StopIteration:
            pass
        return modified

    def test_injects_authorization_header(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for k, v in _AZURE_ENV.items():
            monkeypatch.setenv(k, v)
        request = httpx.Request("POST", "https://apim.example.com/mcp")

        with patch("app.ai.mcp_tools._apim_auth.ClientSecretCredential") as mock_cred_cls:
            mock_cred = MagicMock()
            mock_cred.get_token.return_value = _fake_token("bearer-xyz")
            mock_cred_cls.return_value = mock_cred

            import app.ai.mcp_tools._apim_auth as auth_mod

            auth_mod._credential = None
            auth_mod._credential_key = None

            auth = ApimBearerAuth(_SCOPE)
            modified = self._run_auth_flow(auth, request)

        assert modified.headers["Authorization"] == "Bearer bearer-xyz"

    def test_calls_get_token_per_request(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Each auth_flow call fetches a fresh token (Azure Identity may return cached)."""
        for k, v in _AZURE_ENV.items():
            monkeypatch.setenv(k, v)

        with patch("app.ai.mcp_tools._apim_auth.ClientSecretCredential") as mock_cred_cls:
            mock_cred = MagicMock()
            mock_cred.get_token.side_effect = [
                _fake_token("tok-1"),
                _fake_token("tok-2"),
            ]
            mock_cred_cls.return_value = mock_cred

            import app.ai.mcp_tools._apim_auth as auth_mod

            auth_mod._credential = None
            auth_mod._credential_key = None

            auth = ApimBearerAuth(_SCOPE)
            r1 = self._run_auth_flow(auth, httpx.Request("POST", "https://x.com"))
            r2 = self._run_auth_flow(auth, httpx.Request("POST", "https://x.com"))

        assert r1.headers["Authorization"] == "Bearer tok-1"
        assert r2.headers["Authorization"] == "Bearer tok-2"


# ---------------------------------------------------------------------------
# build_apim_auth
# ---------------------------------------------------------------------------


class TestBuildApimAuth:
    def test_returns_none_when_not_internal(self) -> None:
        settings = _make_mcp_settings(internal=False)
        assert build_apim_auth(settings) is None

    def test_returns_auth_when_internal(self) -> None:
        settings = _make_mcp_settings(internal=True)
        auth = build_apim_auth(settings)
        assert isinstance(auth, ApimBearerAuth)


# ---------------------------------------------------------------------------
# _parse_headers -- static bearer skipped when dynamic auth active
# ---------------------------------------------------------------------------


class TestParseHeaders:
    def test_static_bearer_included_when_no_dynamic_auth(self) -> None:
        settings = _make_mcp_settings(authorization_bearer="static-token")
        headers = _parse_headers(settings, dynamic_auth_active=False)
        assert headers.get("Authorization") == "Bearer static-token"

    def test_static_bearer_skipped_when_dynamic_auth_active(self) -> None:
        settings = _make_mcp_settings(authorization_bearer="static-token")
        headers = _parse_headers(settings, dynamic_auth_active=True)
        assert "Authorization" not in headers

    def test_extra_headers_json_always_included(self) -> None:
        settings = _make_mcp_settings(headers_json='{"X-Custom": "value"}')
        headers = _parse_headers(settings, dynamic_auth_active=True)
        assert headers.get("X-Custom") == "value"

    def test_empty_headers_when_nothing_set(self) -> None:
        settings = _make_mcp_settings()
        headers = _parse_headers(settings)
        assert headers == {}


# ---------------------------------------------------------------------------
# _httpx_factory -- apim_auth takes precedence over adapter-supplied auth
# ---------------------------------------------------------------------------


class TestHttpxFactory:
    def test_apim_auth_overrides_adapter_auth(self) -> None:
        settings = _make_mcp_settings()
        apim_auth = MagicMock(spec=httpx.Auth)
        adapter_auth = MagicMock(spec=httpx.Auth)

        factory = _httpx_factory(settings, apim_auth=apim_auth)
        client = factory(auth=adapter_auth)

        assert client.auth is apim_auth

    def test_adapter_auth_used_when_no_apim_auth(self) -> None:
        settings = _make_mcp_settings()
        adapter_auth = MagicMock(spec=httpx.Auth)

        factory = _httpx_factory(settings, apim_auth=None)
        client = factory(auth=adapter_auth)

        assert client.auth is adapter_auth

    def test_no_auth_when_both_none(self) -> None:
        settings = _make_mcp_settings()
        factory = _httpx_factory(settings, apim_auth=None)
        client = factory(auth=None)
        assert client.auth is None


# ---------------------------------------------------------------------------
# MCPSettings validation -- fail fast when internal=True but credentials missing
# ---------------------------------------------------------------------------


class TestMCPSettingsValidation:
    def test_raises_when_scope_missing(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """MCP_INTERNAL=true with no scope should raise immediately."""
        for k, v in _AZURE_ENV.items():
            monkeypatch.setenv(k, v)

        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="MCP_AUTH_SCOPE"):
            from app.config import MCPSettings

            MCPSettings(internal=True, auth_scope="")

    def test_raises_when_azure_creds_missing(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for var in ("AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"):
            monkeypatch.delenv(var, raising=False)

        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="AZURE_TENANT_ID"):
            from app.config import MCPSettings

            MCPSettings(internal=True, auth_scope="api://x/.default")

    def test_passes_when_all_present(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for k, v in _AZURE_ENV.items():
            monkeypatch.setenv(k, v)

        from app.config import MCPSettings

        s = MCPSettings(internal=True, auth_scope="api://x/.default")
        assert s.internal is True
        assert s.auth_scope == "api://x/.default"

    def test_no_validation_when_internal_false(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for var in ("AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"):
            monkeypatch.delenv(var, raising=False)

        from app.config import MCPSettings

        # Should not raise even with all credentials missing
        s = MCPSettings(internal=False)
        assert s.internal is False
