from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chart import Chart


async def get_chart_by_id(session: AsyncSession, chart_id: UUID) -> Optional[Chart]:
    """Get a chart by ID."""
    result = await session.execute(select(Chart).where(Chart.id == chart_id))
    return result.scalar_one_or_none()


async def save_chart(
    session: AsyncSession,
    title: str,
    spec: dict[str, Any],
    user_id: Optional[UUID] = None,
) -> Chart:
    """Save a new chart (Vega-Lite spec). Returns the created chart."""
    chart = Chart(
        title=title,
        spec=spec,
        user_id=user_id,
    )
    session.add(chart)
    await session.commit()
    await session.refresh(chart)
    return chart
