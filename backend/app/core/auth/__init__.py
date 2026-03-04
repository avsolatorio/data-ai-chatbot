"""
Auth package: token validation/issuance and credential handling.

- jwt: own JWT access tokens (create/decode)
- password: bcrypt hashing/verification
- azure: Azure AD (MSAL) token validation and claims
- session_token: HMAC session tokens (fallback auth)
"""

from app.core.auth.azure import (
    get_azure_claims_for_user,
    validate_azure_access_token_async,
)
from app.core.auth.jwt import create_access_token, decode_access_token
from app.core.auth.password import get_password_hash, verify_password
from app.core.auth.session_token import (
    generate_session_token,
    validate_session_token,
    validate_session_token_async,
)

__all__ = [
    "create_access_token",
    "decode_access_token",
    "get_azure_claims_for_user",
    "get_password_hash",
    "generate_session_token",
    "validate_azure_access_token_async",
    "validate_session_token",
    "validate_session_token_async",
    "verify_password",
]
