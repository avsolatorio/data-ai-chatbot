"""
Password hashing and verification (bcrypt).
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # Bcrypt has a 72-byte limit. Validate before hashing to provide clear error.
    password_bytes = password.encode("utf-8")
    password_byte_length = len(password_bytes)

    if password_byte_length > 72:
        raise ValueError(
            f"Password cannot exceed 72 bytes (got {password_byte_length} bytes). "
            "Please use a shorter password or avoid special characters that use multiple bytes."
        )

    try:
        return pwd_context.hash(password)
    except ValueError as e:
        # Catch bcrypt's own 72-byte limit error and provide a clearer message
        error_msg = str(e)
        if "cannot be longer than 72 bytes" in error_msg:
            raise ValueError(
                f"Password cannot exceed 72 bytes (got {password_byte_length} bytes). "
                "Please use a shorter password or avoid special characters that use multiple bytes."
            ) from e
        # Re-raise other ValueError exceptions
        raise
