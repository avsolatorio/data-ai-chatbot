"""
Password hashing and verification (bcrypt).
Uses the bcrypt package directly; hashes are compatible with passlib-generated hashes.
"""

import bcrypt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    # Bcrypt has a 72-byte limit. Validate before hashing to provide a clearer message.
    password_bytes = password.encode("utf-8")
    password_byte_length = len(password_bytes)

    if password_byte_length > 72:
        raise ValueError(
            f"Password cannot exceed 72 bytes (got {password_byte_length} bytes). "
            "Please use a shorter password or avoid special characters that use multiple bytes."
        )

    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode("utf-8")
    except ValueError as e:
        error_msg = str(e)
        if "cannot be longer than 72 bytes" in error_msg:
            raise ValueError(
                f"Password cannot exceed 72 bytes (got {password_byte_length} bytes). "
                "Please use a shorter password or avoid special characters that use multiple bytes."
            ) from e
        raise
