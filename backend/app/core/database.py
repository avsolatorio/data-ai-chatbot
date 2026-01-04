from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

# Note: SQLAlchemy logging is configured in app/main.py before this module is imported
# Setting echo=False to prevent SQLAlchemy from logging SQL statements directly
# Use logger configuration instead for more control
engine = create_async_engine(settings.POSTGRES_URL, echo=False, future=True)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


class BaseModel(Base):
    __abstract__ = True

    def model_dump(self):
        # Simulate pydantic model_dump
        # Uses the inspection system to get column attributes
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
