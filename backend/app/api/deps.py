import asyncio
import logging
import time
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import (
    decode_access_token,
    get_azure_claims_for_user,
    validate_azure_access_token_async,
    validate_session_token_async,
)
from app.core.database import get_db
from app.db.queries.revoked_token_queries import is_token_revoked
from app.db.queries.user_queries import (
    get_or_create_user_from_azure_claims,
    get_user_by_id,
)

security = HTTPBearer(auto_error=False)  # Don't auto-raise error, we'll check cookies first

# Short-TTL cache for resolved user (reduces DB round-trips on repeated requests).
# Key: user_id (str), Value: (cached_at_monotonic, {"id", "type"}).
_user_cache: dict[str, tuple[float, dict]] = {}
_user_cache_lock = asyncio.Lock()

logger = logging.getLogger(__name__)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user from JWT token or session cookies.
    Checks cookies first (httpOnly cookie), then Authorization header (backward compatibility).
    If JWT expires but guest_session_id or user_session_id exists, restores the user.
    Resolved user is cached for 2 minutes to reduce DB round-trips on repeated requests.
    """
    logger.info("[deps] get_current_user start")

    all_cookies = list(request.cookies.keys())
    logger.debug("get_current_user: cookies received: %s", all_cookies)
    token = None
    msal_cookie_name = getattr(settings, "MSAL_AUTH_COOKIE_NAME", "UIT")
    azure_configured = bool(
        (getattr(settings, "AZURE_AD_TENANT_ID", "") or "").strip()
        and (getattr(settings, "AZURE_AD_CLIENT_ID", "") or "").strip()
    )

    # Resolve token: auth_token cookie, then MSAL cookie, then Authorization header
    token_source = "none"
    cookie_token = request.cookies.get("auth_token")
    if cookie_token:
        token = cookie_token
        token_source = "auth_token"
    if not token:
        msal_cookie = request.cookies.get(msal_cookie_name)
        if msal_cookie:
            token = msal_cookie
            token_source = msal_cookie_name
    if not token and credentials:
        token = credentials.credentials
        token_source = "Authorization"
    logger.debug(
        "get_current_user: token_source=%s path=%s",
        token_source,
        request.url.path,
    )

    # Try JWT first; if decode fails and Azure AD is configured, try Azure AD token
    if token:
        payload = decode_access_token(token)

        if payload is None and azure_configured:
            logger.debug(
                "JWT decode failed, attempting Azure AD token validation (Azure AD configured)"
            )
            azure_payload = await validate_azure_access_token_async(token)
            if azure_payload:
                oid, email, name = get_azure_claims_for_user(azure_payload)
                if oid and email:
                    # Optional: serve from cache to avoid get_or_create_user_from_azure_claims on every request
                    msal_cache_key = f"azure:{oid}"
                    async with _user_cache_lock:
                        now = time.monotonic()
                        entry = _user_cache.get(msal_cache_key)
                        if entry and (now - entry[0]) < settings.USER_CACHE_TTL_SECONDS:
                            logger.debug("[deps] get_current_user cache hit (azure) oid=%s", oid)
                            logger.info(
                                "[deps] get_current_user done (azure cached) user_id=%s",
                                entry[1].get("id"),
                            )
                            return entry[1]

                    user = await get_or_create_user_from_azure_claims(
                        db, azure_oid=oid, email=email, name=name
                    )
                    user_dict = {"id": str(user.id), "type": user.type or "regular"}
                    async with _user_cache_lock:
                        _user_cache[msal_cache_key] = (time.monotonic(), user_dict)
                    logger.info("[deps] get_current_user done (azure) user_id=%s", user.id)
                    return user_dict
                logger.warning("Azure AD token missing oid or email claim")
            else:
                logger.warning(
                    "Azure AD token validation failed. Check AZURE_AD_TENANT_ID, "
                    "AZURE_AD_CLIENT_ID, and token validity/expiry."
                )

        if payload is not None:
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
                )

            # Check if token is revoked (by JWT ID) – always hit DB for security
            jti = payload.get("jti")
            if jti and await is_token_revoked(db, jti):
                logger.warning("Token revoked: jti=%s, user_id=%s", jti, user_id)
                payload = None
            else:
                # Optional: serve from cache to avoid get_user_by_id on every request
                async with _user_cache_lock:
                    now = time.monotonic()
                    entry = _user_cache.get(user_id)
                    if entry and (now - entry[0]) < settings.USER_CACHE_TTL_SECONDS:
                        logger.debug("[deps] get_current_user cache hit user_id=%s", user_id)
                        logger.info("[deps] get_current_user done (jwt cached) user_id=%s", user_id)
                        return entry[1]

                # Single DB call: fetch user for both password_changed_at and existence check
                user = None
                try:
                    user_uuid = UUID(user_id)
                    user = await get_user_by_id(db, user_uuid)
                except (ValueError, TypeError) as e:
                    logger.debug("Invalid user_id for get_user_by_id: %s", e)
                except Exception as e:
                    logger.error("Error verifying user existence: %s", e)
                    payload = None

                if not user:
                    logger.warning(
                        "Token valid but user not found in DB (DB reset?): user_id=%s", user_id
                    )
                    payload = None
                else:
                    # Check if password was changed after token was issued (session invalidation)
                    if jti and hasattr(user, "password_changed_at") and user.password_changed_at:
                        token_issued_at = payload.get("iat")
                        if token_issued_at:
                            token_issued_datetime = datetime.utcfromtimestamp(token_issued_at)
                            if user.password_changed_at > token_issued_datetime:
                                logger.warning(
                                    "Token invalidated: password changed after token issuance. "
                                    "user_id=%s",
                                    user_id,
                                )
                                payload = None

                    if payload is not None:
                        user_dict = {"id": user_id, "type": payload.get("type", "regular")}
                        async with _user_cache_lock:
                            _user_cache[user_id] = (time.monotonic(), user_dict)
                        logger.info("[deps] get_current_user done (jwt) user_id=%s", user_id)
                        return user_dict
        # Token expired or invalid - fall through to guest session check

    # No valid token - check for session ID cookies (fallback for JWT key loss)
    guest_session_id = request.cookies.get("guest_session_id")
    logger.debug(
        "JWT expired/invalid, checking guest_session_id cookie: present=%s",
        guest_session_id is not None,
    )
    if guest_session_id:
        # Opaque session id (lookup) or legacy user_id:hmac (backward compat)
        validated_user_id = await validate_session_token_async(db, guest_session_id)
        logger.debug(
            "guest_session_id validation: token=%s, validated_user_id=%s",
            guest_session_id[:20] + "..." if len(guest_session_id) > 20 else guest_session_id,
            validated_user_id,
        )
        if validated_user_id:
            # Optional: serve from cache
            async with _user_cache_lock:
                entry = _user_cache.get(validated_user_id)
                if entry and (time.monotonic() - entry[0]) < settings.USER_CACHE_TTL_SECONDS:
                    cached = entry[1]
                    if cached.get("type") == "guest":
                        logger.debug(
                            "[deps] get_current_user cache hit (guest) user_id=%s",
                            validated_user_id,
                        )
                        logger.info(
                            "[deps] get_current_user done (guest_session cached) user_id=%s",
                            validated_user_id,
                        )
                        return {**cached, "_restore_guest": True}

            # Try to restore guest user from validated session token
            try:
                user_id = UUID(validated_user_id)
                user = await get_user_by_id(db, user_id)
                logger.debug(
                    "Guest user lookup: user_id=%s, found=%s, email=%s",
                    user_id,
                    user is not None,
                    user.email if user else None,
                )
                # Verify it's actually a guest user (check both type field and email pattern for safety)
                is_guest = user is not None and (
                    (hasattr(user, "type") and user.type == "guest")
                    or (
                        user.email
                        and user.email.startswith("guest-")
                        and user.email.endswith("@anonymous.local")
                    )
                )

                if is_guest:
                    user_type = user.type if hasattr(user, "type") and user.type else "guest"
                    user_dict = {"id": str(user.id), "type": user_type}
                    async with _user_cache_lock:
                        _user_cache[validated_user_id] = (time.monotonic(), user_dict)
                    logger.info("[deps] get_current_user done (guest_session) user_id=%s", user.id)
                    return {**user_dict, "_restore_guest": True}
                else:
                    # User doesn't exist or is not a guest user
                    if user is None:
                        logger.warning(
                            "guest_session_id points to user that doesn't exist: user_id=%s (user may have been deleted or database was reset)",
                            user_id,
                        )
                    else:
                        logger.warning(
                            "guest_session_id points to non-guest user: user_id=%s, email=%s",
                            user_id,
                            user.email if user else None,
                        )
            except (ValueError, TypeError) as e:
                # Invalid UUID format - ignore
                logger.warning("Invalid UUID format from guest_session_id: %s", e)
                pass

    user_session_id = request.cookies.get("user_session_id")
    logger.debug(
        "Checking user_session_id cookie: present=%s",
        user_session_id is not None,
    )
    if user_session_id:
        # Opaque session id (lookup) or legacy user_id:hmac (backward compat)
        validated_user_id = await validate_session_token_async(db, user_session_id)
        logger.debug(
            "user_session_id validation: token=%s, validated_user_id=%s",
            user_session_id[:20] + "..." if len(user_session_id) > 20 else user_session_id,
            validated_user_id,
        )
        if validated_user_id:
            # Optional: serve from cache
            async with _user_cache_lock:
                entry = _user_cache.get(validated_user_id)
                if entry and (time.monotonic() - entry[0]) < settings.USER_CACHE_TTL_SECONDS:
                    cached = entry[1]
                    if cached.get("type") == "regular":
                        logger.debug(
                            "[deps] get_current_user cache hit (user_session) user_id=%s",
                            validated_user_id,
                        )
                        logger.info(
                            "[deps] get_current_user done (user_session cached) user_id=%s",
                            validated_user_id,
                        )
                        return {**cached, "_restore_user": True}

            # Try to restore regular user from validated session token
            try:
                user_id = UUID(validated_user_id)
                user = await get_user_by_id(db, user_id)
                logger.info(
                    "Regular user lookup: user_id=%s, found=%s, email=%s",
                    user_id,
                    user is not None,
                    user.email if user else None,
                )
                # Verify it's a regular user (check both type field and email pattern for safety)
                is_regular = (hasattr(user, "type") and user.type == "regular") or (
                    user
                    and user.email
                    and not (
                        user.email.startswith("guest-") and user.email.endswith("@anonymous.local")
                    )
                )

                if is_regular:
                    user_type = user.type if hasattr(user, "type") and user.type else "regular"
                    user_dict = {"id": str(user.id), "type": user_type}
                    async with _user_cache_lock:
                        _user_cache[validated_user_id] = (time.monotonic(), user_dict)
                    logger.info("[deps] get_current_user done (user_session) user_id=%s", user.id)
                    return {**user_dict, "_restore_user": True}
                else:
                    logger.warning(
                        "user_session_id points to guest user: user_id=%s, email=%s",
                        user_id,
                        user.email if user else None,
                    )
            except (ValueError, TypeError) as e:
                # Invalid UUID format - ignore
                logger.warning("Invalid UUID format from user_session_id: %s", e)
                pass
        else:
            # Validation failed - might be an old raw UUID cookie (backward compatibility)
            # Try to parse it as a UUID directly
            logger.debug(
                "user_session_id validation failed, trying as raw UUID (backward compatibility)"
            )
            try:
                user_id = UUID(user_session_id)
                uid_str = str(user_id)
                async with _user_cache_lock:
                    entry = _user_cache.get(uid_str)
                    if entry and (time.monotonic() - entry[0]) < settings.USER_CACHE_TTL_SECONDS:
                        cached = entry[1]
                        if cached.get("type") == "regular":
                            logger.debug(
                                "[deps] get_current_user cache hit (user_session raw) user_id=%s",
                                uid_str,
                            )
                            return {**cached, "_restore_user": True}

                user = await get_user_by_id(db, user_id)
                logger.debug(
                    "Regular user lookup (raw UUID fallback): user_id=%s, found=%s, email=%s",
                    user_id,
                    user is not None,
                    user.email if user else None,
                )
                # Verify it's NOT a guest user (regular user)
                if (
                    user
                    and user.email
                    and not (
                        user.email.startswith("guest-") and user.email.endswith("@anonymous.local")
                    )
                ):
                    user_dict = {"id": str(user.id), "type": "regular"}
                    async with _user_cache_lock:
                        _user_cache[uid_str] = (time.monotonic(), user_dict)
                    logger.info(
                        "[deps] get_current_user done (user_session raw) user_id=%s", user.id
                    )
                    return {**user_dict, "_restore_user": True}
                else:
                    logger.warning(
                        "user_session_id (raw UUID) points to guest user: user_id=%s, email=%s",
                        user_id,
                        user.email if user else None,
                    )
            except (ValueError, TypeError) as e:
                # Not a valid UUID either - cookie is completely invalid
                logger.warning("user_session_id is neither HMAC-signed token nor valid UUID: %s", e)
                pass

    # No valid token and no valid session cookies
    logger.info("[deps] get_current_user done (unauthorized)")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Optional authentication - returns None if no token provided.
    Still attempts to restore users from session cookies (guest_session_id, user_session_id).
    """
    try:
        user = await get_current_user(request, credentials, db)
        logger.debug(
            "get_optional_user: restored user=%s, type=%s",
            user.get("id") if user else None,
            user.get("type") if user else None,
        )
        return user
    except HTTPException as e:
        logger.debug(
            "get_optional_user: no valid authentication (status=%s, detail=%s)",
            e.status_code,
            e.detail,
        )
        return None


async def require_feedback_reviewer(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Require authenticated user whose email is in FEEDBACK_REVIEWER_EMAILS.
    Use for feedback review/list endpoints. Raises 403 if not allowed.
    """
    allowed_raw = getattr(settings, "FEEDBACK_REVIEWER_EMAILS", "") or ""
    allowed = [e.strip().lower() for e in allowed_raw.split(",") if e.strip()]
    if not allowed:
        logger.warning("require_feedback_reviewer: FEEDBACK_REVIEWER_EMAILS is empty")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Feedback review is not configured or access is disabled",
        )
    user_id_str = current_user.get("id")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID not found",
        )
    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user ID",
        )
    user = await get_user_by_id(db, user_uuid)
    if not user or not getattr(user, "email", None):
        logger.warning(
            "require_feedback_reviewer: user not found or no email, user_id=%s", user_id_str
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view feedback",
        )
    if user.email.strip().lower() not in allowed:
        logger.info(
            "require_feedback_reviewer: email not in allowlist, user_id=%s",
            user_id_str,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view feedback",
        )
    return current_user
