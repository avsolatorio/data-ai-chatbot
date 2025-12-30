from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(
    settings.POSTGRES_URL, echo=settings.ENVIRONMENT == "development", future=True
)

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
