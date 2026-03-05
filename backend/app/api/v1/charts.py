from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_user
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chart_queries import get_chart_by_id, save_chart
from app.utils.user_id import get_user_id_uuid

router = APIRouter()


class ChartStoreRequest(BaseModel):
    """Vega-Lite chart spec. Must include 'title' and full spec (stored as-is)."""

    title: str

    # Vega-Lite-ish top-level fields, but flexible
    config: dict[str, Any] | None = None
    data: dict[str, Any] | None = None
    mark: str | dict[str, Any] | None = None
    encoding: dict[str, Any] | None = None
    params: list[dict[str, Any]] | None = None
    datasets: dict[str, Any] | None = None

    model_config = ConfigDict(extra="allow")

    def to_spec(self) -> dict[str, Any]:
        """Full spec as stored in DB (all fields including extra)."""
        return self.model_dump(exclude_none=True)


@router.post("")
async def store_chart(
    request: ChartStoreRequest,
    current_user: dict | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Store a Vega-Lite chart specification.
    The other app can POST the full spec here; title is required, rest is stored as JSON.
    """
    user_id = get_user_id_uuid(current_user["id"]) if current_user else None
    spec = request.to_spec()
    chart = await save_chart(
        db,
        title=request.title,
        spec=spec,
        user_id=user_id,
    )
    return {
        "id": str(chart.id),
        "title": chart.title,
        "createdAt": chart.created_at.isoformat(),
        "spec": chart.spec,
    }


@router.get("/{chart_id}")
async def get_chart(
    chart_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a stored chart by ID. Returns the full Vega-Lite spec.
    Intentionally world-readable by ID (shareable/embed). If charts become private,
    add get_current_user and enforce chart.user_id == current_user.
    """
    chart = await get_chart_by_id(db, chart_id)
    if not chart:
        raise ChatSDKError("not_found:chart", status_code=status.HTTP_404_NOT_FOUND)
    return {
        "id": str(chart.id),
        "title": chart.title,
        "createdAt": chart.created_at.isoformat(),
        "spec": chart.spec,
    }
