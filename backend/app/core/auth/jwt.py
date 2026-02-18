"""
JWT access token creation and decoding (own app tokens).
Supports key rotation via JWT_SECRET_KEY_OLD.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt

from app.config import settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    # Add iat (issued at) claim for session invalidation
    # Add jti (JWT ID) claim for token revocation
    jti = str(uuid.uuid4())
    to_encode.update({"exp": expire, "iat": now, "jti": jti})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """
    Decode JWT token with key rotation support.
    Tries current key first, then old key (if configured) for backward compatibility.
    """
    # Try current key first
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        pass

    # If current key fails and old key is configured, try old key (key rotation)
    if settings.JWT_SECRET_KEY_OLD:
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY_OLD, algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            pass

    return None
