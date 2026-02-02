"""API endpoint for listing available chat models."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import ModelType, settings

router = APIRouter()


class ChatModelInfo(BaseModel):
    """Display info for a chat model: ModelType id and configured model name from ModelSettings."""

    id: str  # ModelType value (e.g. "chat-model", "chat-model-reasoning")
    name: str  # Configured model name from settings (e.g. "gpt-4o-mini", "o1-mini")
    description: str  # Human-readable label (model type)


# Only these chat model types are exposed in the model selector.
EXPOSED_CHAT_MODEL_TYPES: tuple[ModelType, ...] = (
    ModelType.CHAT_MODEL,
    ModelType.CHAT_MODEL_REASONING,
)


def get_available_chat_models() -> list[ChatModelInfo]:
    """Return chat models from config: ModelType and ModelSettings (configured model name)."""
    return [
        ChatModelInfo(
            id=model_type.value,
            name=getattr(settings.models, model_type.name),
            description=model_type.value,
        )
        for model_type in EXPOSED_CHAT_MODEL_TYPES
    ]


@router.get("", response_model=list[ChatModelInfo])
async def list_models():
    """
    List available chat models.

    Returns the chat models configured in the backend (id, name, description).
    The frontend uses this to populate the model selector and filters by
    user entitlements.
    """
    return get_available_chat_models()
