"""LangChain LLM factory for the graph pipeline.

Uses ChatLiteLLM from langchain-community so that the existing LiteLLM
configuration (MODEL_PROVIDER prefix, model names, Azure AD refresh, etc.)
is reused without modification.  All providers — OpenAI, Azure, Anthropic/Claude,
Google, etc. — are supported transparently through LiteLLM.
"""

from langchain_community.chat_models import ChatLiteLLM

from app.ai.client import get_model_name
from app.config import ModelType, settings


def get_chat_llm(
    model_type: ModelType | str,
    temperature: float = 0.7,
    **kwargs,
) -> ChatLiteLLM:
    """Return a ChatLiteLLM instance for the given model type.

    Applies the MODEL_PROVIDER prefix (e.g. "azure/", "anthropic/", "openai/")
    the same way the existing LiteLLMClient does, so no config changes are needed.

    Examples:
        MODEL_PROVIDER="anthropic/" + CHAT_MODEL="claude-3-5-sonnet-20241022"
            → full_model = "anthropic/claude-3-5-sonnet-20241022"

        MODEL_PROVIDER="azure/"    + CHAT_MODEL="gpt-4o"
            → full_model = "azure/gpt-4o"
    """
    if isinstance(model_type, str):
        try:
            model_type = ModelType(model_type)
        except ValueError:
            # Fallback: treat as raw model name without prefix lookup
            full_model = f"{settings.models.MODEL_PROVIDER}{model_type}"
            return ChatLiteLLM(model=full_model, temperature=temperature, **kwargs)

    model_name = get_model_name(model_type)
    full_model = f"{settings.models.MODEL_PROVIDER}{model_name}"
    return ChatLiteLLM(model=full_model, temperature=temperature, **kwargs)
