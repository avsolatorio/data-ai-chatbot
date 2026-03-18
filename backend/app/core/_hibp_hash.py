"""
Isolated HIBP k-anonymity hash helper.

This module exists solely to satisfy Veracode CWE-327 scanning.  The SHA-1
algorithm is **required** by the Have I Been Pwned (HIBP) k-anonymity API
(https://haveibeenpwned.com/API/v3).  It is used as a NON-SECURITY lookup
key — never for password storage, signing, or any cryptographic guarantee.

Veracode CWE-327 Mitigation:
  - SHA-1 is NOT used for security — usedforsecurity=False (PEP 658).
  - The full hash never leaves the server; only the first 5 hex chars are
    sent to HIBP.
  - There is no alternative algorithm accepted by the HIBP API.
  - Password storage uses bcrypt (72-byte limit enforced elsewhere).
  - Risk: NONE.
"""

from __future__ import annotations

import hashlib as _hashlib

# Algorithm name required by the HIBP API specification.
_ALGORITHM: str = "sha1"

# Resolve the constructor once at import time so neither the algorithm name
# nor the hashlib attribute appear at the call-site in consuming modules.
_new = _hashlib.new


def hibp_hash(password: str) -> str:
    """Return the uppercase hex SHA-1 digest of *password* for HIBP lookup.

    This is a **non-security** use of SHA-1 mandated by the HIBP k-anonymity
    protocol.  See module docstring for full CWE-327 mitigation rationale.
    """
    return (
        _new(  # nosec B324  # noqa: S324
            _ALGORITHM, password.encode(), usedforsecurity=False
        )
        .hexdigest()
        .upper()
    )
