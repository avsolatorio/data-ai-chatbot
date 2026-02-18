"""
User database queries.
"""

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

logger = logging.getLogger(__name__)


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get a user by ID."""
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email address."""
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_azure_oid(session: AsyncSession, azure_oid: str) -> Optional[User]:
    """Get a user by Azure AD object id (oid claim)."""
    result = await session.execute(select(User).where(User.azure_oid == azure_oid))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, email: str, hashed_password: str) -> User:
    """
    Create a new user with email and hashed password.
    Sets password_changed_at to track when password was set (for session invalidation).
    Raises IntegrityError if email already exists.
    """
    new_user = User(
        email=email,
        password=hashed_password,
        type="regular",
        password_changed_at=datetime.utcnow(),  # Track initial password creation
    )
    session.add(new_user)
    try:
        await session.commit()
        await session.refresh(new_user)
        return new_user
    except IntegrityError:
        await session.rollback()
        raise


async def create_guest_user(session: AsyncSession) -> User:
    """
    Create a guest user with a generated email.
    Email format: guest-{timestamp}@anonymous.local
    """
    import time

    email = f"guest-{int(time.time() * 1000)}@anonymous.local"
    # Generate a random password hash (guest users don't need to login)
    from uuid import uuid4

    from app.core.auth import get_password_hash

    hashed_password = get_password_hash(str(uuid4()))
    new_user = User(email=email, password=hashed_password, type="guest")
    session.add(new_user)

    try:
        await session.commit()
        await session.refresh(new_user)
        return new_user
    except IntegrityError:
        # Race condition: try again with different timestamp
        await session.rollback()
        email = f"guest-{int(time.time() * 1000)}-{uuid4()}@anonymous.local"
        new_user = User(email=email, password=hashed_password, type="guest")
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        return new_user


async def get_or_create_user_for_session(session: AsyncSession, user_id: UUID) -> User:
    """
    Get or create a user for a session ID (when auth is disabled).
    Creates a user with a generated email if it doesn't exist.
    Handles race conditions where multiple requests might try to create the same user.
    """
    # Try to get existing user
    user = await get_user_by_id(session, user_id)
    if user:
        return user

    # Create new user with generated email
    # Email must be unique, so we use the UUID as part of the email
    email = f"session-{user_id}@anonymous.local"
    new_user = User(id=user_id, email=email, password=None)
    session.add(new_user)

    try:
        await session.commit()
        await session.refresh(new_user)
        return new_user
    except IntegrityError:
        # Race condition: user was created by another request
        # Rollback and try to fetch the existing user
        await session.rollback()
        logger.info("User creation race condition detected, fetching existing user: %s", user_id)
        user = await get_user_by_id(session, user_id)
        if user:
            return user
        # If still not found, re-raise the error
        raise


async def get_or_create_user_from_azure_claims(
    session: AsyncSession,
    azure_oid: str,
    email: str,
    name: Optional[str] = None,
) -> User:
    """
    Find or create a user from Azure AD token claims (MSAL).
    Looks up by azure_oid first, then by email. Creates with password=None, type=regular.
    """
    user = await get_user_by_azure_oid(session, azure_oid)
    if user:
        # Optionally update name if it changed in Azure AD
        if name is not None and (user.name or "") != (name or ""):
            user.name = name or None
            await session.commit()
            await session.refresh(user)
        return user

    user = await get_user_by_email(session, email)
    if user:
        # Link existing user to Azure (e.g. first time signing in with MSAL)
        user.azure_oid = azure_oid
        if name is not None:
            user.name = name or None
        await session.commit()
        await session.refresh(user)
        return user

    # Create new user (no password; MSAL-only)
    new_user = User(
        email=email,
        password=None,
        type="regular",
        azure_oid=azure_oid,
        name=name or None,
    )
    session.add(new_user)
    try:
        await session.commit()
        await session.refresh(new_user)
        return new_user
    except IntegrityError:
        await session.rollback()
        # Race: another request created the user; fetch by azure_oid or email
        user = await get_user_by_azure_oid(session, azure_oid)
        if user:
            return user
        user = await get_user_by_email(session, email)
        if user:
            return user
        raise
