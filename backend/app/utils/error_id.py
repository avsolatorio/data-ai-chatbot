"""Unique error IDs for safe user-facing references and server-side correlation."""

from uuid import uuid4

ERROR_ID_PREFIX = "err_"
USER_MESSAGE_GENERIC = "An error occurred. Please try again."


def new_error_id() -> str:
    """Return a short, URL-safe unique id for error correlation (e.g. err_a1b2c3d4e5f6)."""
    return f"{ERROR_ID_PREFIX}{uuid4().hex[:12]}"
