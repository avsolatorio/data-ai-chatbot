"""Chat visibility helpers for the share-via-link (public chat) feature flag."""

from app.config import get_settings


def effective_visibility(stored: str) -> str:
    """
    When sharing is disabled, stored ``public`` is treated as ``private`` for ACL
    and API responses. The database value is unchanged.
    """
    if not get_settings().ENABLE_SHARE_CONVERSATION and stored == "public":
        return "private"
    return stored
