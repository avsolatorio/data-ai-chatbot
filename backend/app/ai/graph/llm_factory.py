"""LangChain LLM factory for the graph pipeline.

Uses ChatLiteLLM from langchain-litellm so that the existing LiteLLM
configuration (MODEL_PROVIDER prefix, model names, Azure AD refresh, etc.)
is reused without modification.  All providers — OpenAI, Azure, Anthropic/Claude,
Google, etc. — are supported transparently through LiteLLM.
"""

from typing import Any

from langchain_litellm import ChatLiteLLM

from app.ai.client import get_model_name
from app.config import ModelType, settings


def _streaming_usage_model_kwargs(streaming: bool) -> dict[str, Any]:
    """Extra kwargs so streamed completions include token usage on the final chunk.

    OpenAI-compatible APIs require ``stream_options.include_usage``; LiteLLM forwards
    ``model_kwargs`` into the provider request. Unsupported providers ignore keys.
    """
    if not streaming:
        return {}
    return {"stream_options": {"include_usage": True}}


def get_routing_llm() -> ChatLiteLLM:
    """Return a ChatLiteLLM instance for the intent router.

    The routing model is configured independently from the main chat model via
    ``settings.ROUTING_MODEL``.  Fixed at temperature=0 (deterministic JSON
    classification), no streaming (we need a complete response before routing),
    and JSON response format so the output is always parseable.

    Because this LLM is called inside the ``router_node`` LangGraph node,
    LangGraph automatically tags the resulting ``on_chat_model_end`` event with
    ``langgraph_node="router"``.  The SSE bridge then accumulates usage via the
    standard path — no manual ``router_usage`` plumbing needed.
    """
    full_model = f"{settings.models.MODEL_PROVIDER}{settings.ROUTING_MODEL}"
    return ChatLiteLLM(
        model=full_model,
        temperature=0,
        streaming=False,
        max_tokens=300,
        model_kwargs={"response_format": {"type": "json_object"}},
    )


def get_chat_llm(
    model_type: ModelType | str,
    temperature: float = 0.7,
    *,
    streaming: bool = False,
    **kwargs,
) -> ChatLiteLLM:
    """Return a ChatLiteLLM instance for the given model type.

    Applies the MODEL_PROVIDER prefix (e.g. "azure/", "anthropic/", "openai/")
    the same way the existing LiteLLMClient does, so no config changes are needed.

    When ``streaming=True``, sets ``model_kwargs`` so usage can appear on the last
    stream chunk where the provider supports it.

    Examples:
        MODEL_PROVIDER="anthropic/" + CHAT_MODEL="claude-3-5-sonnet-20241022"
            → full_model = "anthropic/claude-3-5-sonnet-20241022"

        MODEL_PROVIDER="azure/"    + CHAT_MODEL="gpt-4o"
            → full_model = "azure/gpt-4o"
    """
    mk = dict(kwargs.pop("model_kwargs", {}) or {})
    mk.update(_streaming_usage_model_kwargs(streaming))

    if isinstance(model_type, str):
        try:
            model_type = ModelType(model_type)
        except ValueError:
            # Fallback: treat as raw model name without prefix lookup
            full_model = f"{settings.models.MODEL_PROVIDER}{model_type}"
            return ChatLiteLLM(
                model=full_model,
                temperature=temperature,
                streaming=streaming,
                model_kwargs=mk,
                **kwargs,
            )

    model_name = get_model_name(model_type)
    full_model = f"{settings.models.MODEL_PROVIDER}{model_name}"
    return ChatLiteLLM(
        model=full_model,
        temperature=temperature,
        streaming=streaming,
        model_kwargs=mk,
        **kwargs,
    )
