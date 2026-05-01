"""
Azure APIM bearer-token authentication for the MCP client.

When MCP_INTERNAL=True the chatbot's MCP client must present a bearer token
that APIM validates before forwarding the request to the data360-mcp server.
Tokens are obtained via the Azure AD client-credentials flow using the
azure-identity library, which caches them and auto-refreshes ~5 min before expiry.

Credentials (tenant, client ID, client secret) are read from the global
AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET env vars -- the same
ones used for Azure OpenAI via LiteLLM. Only the scope (MCP_AUTH_SCOPE) is
specific to the APIM resource.
"""

from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING, Generator

import httpx
from azure.identity import ClientSecretCredential

if TYPE_CHECKING:
    from app.config import MCPSettings

logger = logging.getLogger(__name__)

# Module-level credential singleton. Recreated only when the credential key changes.
_credential: ClientSecretCredential | None = None
_credential_key: tuple[str, str] | None = None


def _get_credential() -> ClientSecretCredential:
    """Return (and lazily create) the module-level credential singleton.

    Reads AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET from the
    environment at call time (same values used for Azure OpenAI).
    """
    global _credential, _credential_key

    tenant_id = os.environ["AZURE_TENANT_ID"]
    client_id = os.environ["AZURE_CLIENT_ID"]
    client_secret = os.environ["AZURE_CLIENT_SECRET"]

    key = (tenant_id, client_id)
    if _credential is None or _credential_key != key:
        logger.info(
            "[mcp-auth] Creating ClientSecretCredential tenant=%s client=%s",
            tenant_id,
            client_id,
        )
        _credential = ClientSecretCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
        )
        _credential_key = key

    return _credential


def get_apim_bearer_token(scope: str) -> str:
    """Acquire (or return cached) a bearer token for the given APIM scope.

    Azure Identity handles expiry and refresh transparently.
    Raises ``azure.core.exceptions.ClientAuthenticationError`` on failure.
    """
    credential = _get_credential()
    token = credential.get_token(scope)
    logger.debug("[mcp-auth] Bearer token acquired/refreshed for scope=%s", scope)
    return token.token


class ApimBearerAuth(httpx.Auth):
    """httpx Auth implementation that injects a dynamically refreshed bearer token.

    Called by httpx on every request, so tokens are always current.
    The underlying ClientSecretCredential caches tokens until near expiry,
    so calling get_apim_bearer_token() per-request is inexpensive in practice.
    """

    def __init__(self, scope: str) -> None:
        self._scope = scope

    def auth_flow(self, request: httpx.Request) -> Generator[httpx.Request, httpx.Response, None]:
        token = get_apim_bearer_token(self._scope)
        request.headers["Authorization"] = f"Bearer {token}"
        yield request


def build_apim_auth(settings: MCPSettings) -> ApimBearerAuth | None:
    """Return an ApimBearerAuth instance when MCP_INTERNAL=True, else None."""
    if not settings.internal:
        return None
    return ApimBearerAuth(settings.auth_scope)
