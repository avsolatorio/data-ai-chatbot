"""
Validate Azure AD (MSAL) access tokens and extract claims.
Used when AUTH_PROVIDER=msal. Requires AZURE_AD_TENANT_ID to be set.

Accepts both v1 (sts.windows.net) and v2 (login.microsoftonline.com/.../v2.0) issuer formats.
Fetches jwks_uri from OpenID metadata first, then falls back to known URLs.
For Graph tokens (User.Read) set AZURE_AD_VALID_AUDIENCES to include the Graph GUID below.
User-impersonation tokens have aud = the API (resource) app ID; add that to AZURE_AD_VALID_AUDIENCES.
"""

import json
import logging
import urllib.request
from typing import Any, Optional

import jwt
from jwt import PyJWKClient

from app.config import settings

logger = logging.getLogger(__name__)

# Microsoft Graph API well-known audience (User.Read, openid, profile tokens)
MSGRAPH_AUDIENCE = "00000003-0000-0000-c000-000000000000"

# Cache: (label -> PyJWKClient)
_jwks_clients: dict[str, PyJWKClient] = {}
# Cache: tenant_id -> (jwks_v2, jwks_v1, jwks_v1_0)
_metadata_jwks_cache: dict[str, tuple[Optional[str], Optional[str], Optional[str]]] = {}


def _fetch_jwks_uri_from_metadata(metadata_url: str) -> Optional[str]:
    """Fetch OpenID metadata and return jwks_uri. Returns None on error."""
    try:
        req = urllib.request.Request(metadata_url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            return data.get("jwks_uri") or None
    except Exception as e:
        logger.debug("Failed to fetch metadata %s: %s", metadata_url, e)
        return None


def _jwks_uris_for_tenant(tenant_id: str) -> list[tuple[str, str]]:
    """Build list of (label, jwks_uri) to try. Uses metadata first, then fallbacks."""
    result: list[tuple[str, str]] = []

    # Prefer jwks_uri from OpenID metadata (v2.0, v1.0, and legacy v1 paths)
    if tenant_id not in _metadata_jwks_cache:
        v2_meta = (
            f"https://login.microsoftonline.com/{tenant_id}/v2.0/.well-known/openid-configuration"
        )
        v1_meta = f"https://login.microsoftonline.com/{tenant_id}/.well-known/openid-configuration"
        v1_0_meta = (
            f"https://login.microsoftonline.com/{tenant_id}/v1.0/.well-known/openid-configuration"
        )
        jwks_v2 = _fetch_jwks_uri_from_metadata(v2_meta)
        jwks_v1 = _fetch_jwks_uri_from_metadata(v1_meta)
        jwks_v1_0 = _fetch_jwks_uri_from_metadata(v1_0_meta)
        _metadata_jwks_cache[tenant_id] = (jwks_v2, jwks_v1, jwks_v1_0)
    jwks_v2, jwks_v1, jwks_v1_0 = _metadata_jwks_cache[tenant_id]
    for label, uri in [
        ("metadata_v2", jwks_v2),
        ("metadata_v1.0", jwks_v1_0),
        ("metadata_v1", jwks_v1),
    ]:
        if uri and uri not in (r[1] for r in result):
            result.append((label, uri))

    # Fallbacks
    for label, uri in [
        ("v2.0", f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"),
        ("v1", f"https://login.microsoftonline.com/{tenant_id}/discovery/keys"),
        ("common_v2", "https://login.microsoftonline.com/common/discovery/v2.0/keys"),
        ("common_v1", "https://login.microsoftonline.com/common/discovery/keys"),
    ]:
        if uri not in (r[1] for r in result):
            result.append((label, uri))
    return result


def _get_jwks_client(uri_key: str, jwks_uri: str) -> PyJWKClient:
    if uri_key not in _jwks_clients:
        _jwks_clients[uri_key] = PyJWKClient(jwks_uri)
    return _jwks_clients[uri_key]


def _valid_issuers(tenant_id: str) -> list[str]:
    """Return accepted issuer URLs for this tenant (v1 and v2)."""
    return [
        f"https://login.microsoftonline.com/{tenant_id}/v2.0",
        f"https://sts.windows.net/{tenant_id}/",
    ]


def _get_valid_audiences() -> list[str]:
    """Build list of valid audience values for token validation."""
    valid_raw = (getattr(settings, "AZURE_AD_VALID_AUDIENCES", "") or "").strip()
    if valid_raw:
        return [a.strip() for a in valid_raw.split(",") if a.strip()]
    client_id = (settings.AZURE_AD_CLIENT_ID or "").strip()
    # Default: client ID + Graph audience so User.Read tokens work
    audiences = [client_id] if client_id else []
    if MSGRAPH_AUDIENCE not in audiences:
        audiences.append(MSGRAPH_AUDIENCE)
    return audiences


def _log_token_claims_for_debug(token: str) -> None:
    """Decode token without verification and log aud/iss/exp to help debug 401s."""
    try:
        unverified = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
        )
        aud = unverified.get("aud")
        iss = unverified.get("iss")
        exp = unverified.get("exp")
        logger.warning(
            "Azure AD token claims (unverified, for debugging): aud=%s, iss=%s, exp=%s. "
            "Set AZURE_AD_VALID_AUDIENCES to include the token's aud value (e.g. API app ID).",
            aud,
            iss,
            exp,
        )
    except Exception as e:
        logger.warning("Could not decode token for debug logging: %s", e)


def validate_azure_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Validate an Azure AD access token (v1 or v2) and return claims.
    Fetches jwks_uri from OpenID metadata, then tries multiple JWKS endpoints.
    """
    parts = token.split(".")
    if len(parts) != 3:
        logger.warning(
            "Azure AD token has %s parts instead of 3; cookie may have truncated the token (max ~4KB). "
            "Consider sending token only in Authorization header.",
            len(parts),
        )
        return None

    tenant_id = (settings.AZURE_AD_TENANT_ID or "").strip()
    if not tenant_id:
        logger.warning(
            "Azure AD not configured (AZURE_AD_TENANT_ID empty), skipping token validation"
        )
        return None

    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        logger.warning("Failed to read JWT header: %s", e)
        return None

    kid = unverified_header.get("kid")
    alg = unverified_header.get("alg") or "RS256"
    if kid is None:
        logger.warning("JWT header missing kid")
        return None

    valid_audiences = _get_valid_audiences()
    valid_issuers_list = _valid_issuers(tenant_id) if tenant_id.lower() != "common" else []

    skip_verify = getattr(settings, "AZURE_AD_SKIP_SIGNATURE_VERIFY", False)
    if skip_verify:
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True, "verify_aud": False},
            )
            iss = (payload.get("iss") or "").rstrip("/")
            if valid_issuers_list and not any(iss == u.rstrip("/") for u in valid_issuers_list):
                logger.warning("Azure AD (skip_verify): issuer %s not in allowed list", iss)
                return None
            aud = payload.get("aud")
            if valid_audiences:
                aud_list = [aud] if not isinstance(aud, list) else aud
                if not aud_list or not any(a in valid_audiences for a in aud_list):
                    logger.warning("Azure AD (skip_verify): audience not in allowed list")
                    return None
            logger.debug(
                "Azure AD token accepted with AZURE_AD_SKIP_SIGNATURE_VERIFY=true. "
                "Use only for development or when v1 token verification is not possible."
            )
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Azure AD token expired")
            return None
        except Exception as e:
            logger.warning("Azure AD (skip_verify) decode failed: %s", e)
            return None

    uris_to_try = _jwks_uris_for_tenant(tenant_id)
    last_error: Optional[Exception] = None

    for label, jwks_uri in uris_to_try:
        try:
            client = _get_jwks_client(label, jwks_uri)
            signing_key = client.get_signing_key(kid)
            key = signing_key.key
            payload = jwt.decode(
                token,
                key,
                algorithms=[alg],
                audience=valid_audiences if valid_audiences else None,
                options={
                    "verify_aud": bool(valid_audiences),
                    "verify_exp": True,
                    "verify_iss": False,
                },
            )
            if valid_issuers_list:
                iss = (payload.get("iss") or "").rstrip("/")
                if not any(iss == u.rstrip("/") for u in valid_issuers_list):
                    raise jwt.InvalidIssuerError("Issuer not in allowed list")
            logger.debug("Azure AD token validated with JWKS endpoint: %s", label)
            return payload
        except jwt.InvalidAudienceError:
            _log_token_claims_for_debug(token)
            logger.warning(
                "Azure AD token audience mismatch. Token aud must be in: %s. "
                "For Graph tokens use 00000003-0000-0000-c000-000000000000; for custom API use the API app ID.",
                valid_audiences,
            )
            return None
        except jwt.ExpiredSignatureError:
            logger.warning("Azure AD token expired")
            return None
        except jwt.InvalidIssuerError:
            _log_token_claims_for_debug(token)
            logger.warning(
                "Azure AD token issuer not allowed. Ensure AZURE_AD_TENANT_ID matches the tenant in token iss."
            )
            return None
        except jwt.InvalidTokenError as e:
            last_error = e
            logger.debug(
                "Azure AD token validation failed for JWKS endpoint %s: %s",
                label,
                e,
            )
            continue
        except Exception as e:
            last_error = e
            logger.warning(
                "Azure AD token validation raised unexpected error for JWKS endpoint %s: %s",
                label,
                e,
            )
            continue

    _log_token_claims_for_debug(token)
    logger.warning(
        "Azure AD token invalid after trying all JWKS endpoints: %s. "
        "Ensure AZURE_AD_TENANT_ID=%s matches the tenant in token iss.",
        last_error,
        tenant_id,
    )
    return None


def get_azure_claims_for_user(
    payload: dict[str, Any],
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extract (azure_oid, email, name) from validated Azure AD token payload.
    Supports both v2 claims (oid, preferred_username, name) and v1 (sub, upn, unique_name).
    """
    oid = payload.get("oid") or payload.get("sub")
    if isinstance(oid, str):
        oid = oid.strip() or None
    else:
        oid = None

    email = (
        payload.get("preferred_username")
        or payload.get("email")
        or payload.get("upn")
        or payload.get("unique_name")
    )
    if isinstance(email, str):
        email = email.strip() or None
        if email.startswith("live.com#"):
            email = email[9:].strip() or email
    else:
        email = None

    name = payload.get("name")
    if isinstance(name, str):
        name = name.strip() or None
    else:
        name = None

    return (oid, email, name)
