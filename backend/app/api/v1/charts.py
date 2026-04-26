from hmac import compare_digest
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_user
from app.config import settings
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.db.queries.chart_queries import get_chart_by_id, save_chart
from app.utils.user_id import get_user_id_uuid

router = APIRouter()


class ChartStoreRequest(BaseModel):
    """Vega-Lite chart spec. Must include 'title' and full spec (stored as-is)."""

    # Vega-Lite supports both string and object forms for title.
    title: str | dict[str, Any]

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

    def normalized_title(self) -> str:
        """Return a plain title string for DB/indexing.

        Keeps Vega-Lite title object in the stored spec, while deriving a stable
        string value for the `Chart.title` column.
        """
        if isinstance(self.title, str):
            title = self.title.strip()
            return title or "Generated Visualization"

        title_value = self.title.get("text")
        if isinstance(title_value, str):
            title = title_value.strip()
            return title or "Generated Visualization"
        if isinstance(title_value, list):
            lines = [part.strip() for part in title_value if isinstance(part, str)]
            if lines:
                return " ".join(lines)[:512]

        return "Generated Visualization"


@router.post("")
async def store_chart(
    request: ChartStoreRequest,
    authorization: str | None = Header(default=None),
    current_user: dict | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Store a Vega-Lite chart specification.
    The other app can POST the full spec here; title is required, rest is stored as JSON.
    """
    expected_token = settings.CHARTS_API_WRITE_TOKEN.strip()
    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chart ingestion token is not configured",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )
    provided_token = authorization.removeprefix("Bearer ").strip()
    if not compare_digest(provided_token, expected_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid bearer token",
        )

    user_id = get_user_id_uuid(current_user["id"]) if current_user else None
    spec = request.to_spec()
    chart = await save_chart(
        db,
        title=request.normalized_title()[:512],
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
