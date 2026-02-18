"""
Validate Azure AD (MSAL) access tokens and extract claims.
Used when AUTH_PROVIDER=msal. Requires AZURE_AD_TENANT_ID to be set.
"""

import logging
from typing import Any, Optional

import jwt
from jwt import PyJWKClient

from app.config import settings

logger = logging.getLogger(__name__)

# Cache JWKS client per tenant to avoid refetching keys on every request
_jwks_client: Optional[PyJWKClient] = None


def _get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client
    tenant_id = (settings.AZURE_AD_TENANT_ID or "").strip()
    if not tenant_id:
        return None
    if _jwks_client is None:
        jwks_uri = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
        _jwks_client = PyJWKClient(jwks_uri)
    return _jwks_client


def validate_azure_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Validate an Azure AD v2.0 access token and return claims.
    Returns None if token is invalid or Azure AD is not configured.
    """
    tenant_id = (settings.AZURE_AD_TENANT_ID or "").strip()
    if not tenant_id:
        logger.debug(
            "Azure AD not configured (AZURE_AD_TENANT_ID empty), skipping token validation"
        )
        return None

    client = _get_jwks_client()
    if not client:
        return None

    try:
        signing_key = client.get_signing_key_from_jwt(token)
    except Exception as e:
        logger.debug("Failed to get signing key from JWT: %s", e)
        return None

    client_id = (settings.AZURE_AD_CLIENT_ID or "").strip()
    issuer = f"https://login.microsoftonline.com/{tenant_id}/v2.0"
    # When tenant is "common", token issuer contains the actual tenant id; skip iss verification
    verify_iss = tenant_id.lower() != "common"

    try:
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id if client_id else None,
            issuer=issuer if verify_iss else None,
            options={
                "verify_aud": bool(client_id),
                "verify_exp": True,
                "verify_iss": verify_iss,
            },
        )
        return payload
    except jwt.InvalidAudienceError:
        logger.debug("Azure AD token audience mismatch")
        return None
    except jwt.ExpiredSignatureError:
        logger.debug("Azure AD token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.debug("Azure AD token invalid: %s", e)
        return None


def get_azure_claims_for_user(
    payload: dict[str, Any],
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extract (azure_oid, email, name) from validated Azure AD token payload.
    oid = stable user id; preferred_username or email = email; name = display name.
    """
    oid = payload.get("oid") or payload.get("sub")
    if isinstance(oid, str):
        oid = oid.strip() or None
    else:
        oid = None

    email = payload.get("preferred_username") or payload.get("email")
    if isinstance(email, str):
        email = email.strip() or None
    else:
        email = None

    name = payload.get("name")
    if isinstance(name, str):
        name = name.strip() or None
    else:
        name = None

    return (oid, email, name)
