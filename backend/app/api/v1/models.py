"""API endpoint for listing available chat models."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import ModelType

router = APIRouter()


class ChatModelInfo(BaseModel):
    """Display info for a chat model (id, name, description)."""

    id: str
    name: str
    description: str


# Descriptions for chat models (user-facing). Name is aligned with ModelType value.
# Only CHAT_MODEL and CHAT_MODEL_REASONING are exposed in the model selector.
CHAT_MODEL_DESCRIPTIONS: dict[ModelType, str] = {
    ModelType.CHAT_MODEL: "Advanced multimodal model with vision and text capabilities",
    # ModelType.CHAT_MODEL_REASONING: "Uses advanced chain-of-thought reasoning for complex problems",
}


def get_available_chat_models() -> list[ChatModelInfo]:
    """Return the list of chat models available in the backend."""
    return [
        ChatModelInfo(
            id=model_type.value,
            name=model_type.value,
            description=CHAT_MODEL_DESCRIPTIONS[model_type],
        )
        for model_type in CHAT_MODEL_DESCRIPTIONS
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
