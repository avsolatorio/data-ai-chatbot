"""Router node: classifies intent into RESEARCH, DIRECT, CLARIFY, OUT_OF_SCOPE, or EXPLAIN.

Wraps check_intent() from app.ai.routing so that routing logic is a first-class
LangGraph node.  check_intent() now uses a ChatLiteLLM instance so the LLM call
participates in LangChain's callback system.  LangGraph automatically tags the
on_chat_model_end event with langgraph_node="router", meaning token usage is
accumulated by the SSE bridge through the standard path — no manual router_usage
state key or _model embedding hack required.

The @wdr override and forced_intent fast-paths are also handled here.
"""

import logging

from app.ai.routing import check_intent
from app.config import IntentType

from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

# All valid intent values — used for forced_intent validation
_VALID_INTENTS = frozenset(i.value for i in IntentType)


async def router_node(state: ChatPipelineState) -> dict:
    """Classify intent and return routing state updates.

    Fast-path: if the user query contains ``@wdr``, forces RESEARCH without
    an LLM call.  Otherwise delegates to check_intent() which calls the
    routing model via LangChain/LiteLLM so usage is tracked automatically.

    Returns state updates for ``intent``, ``routing_reasoning``,
    ``missing_slots``, and ``detected_language``.
    """
    query_text: str = state.get("query_text", "")

    # ── @wdr force-research override ─────────────────────────────────────────
    if "@wdr" in query_text.lower():
        logger.info("[router_node] @wdr token detected — forcing RESEARCH path")
        return {
            "intent": IntentType.RESEARCH.value,
            "routing_reasoning": "WDR research triggered by @wdr.",
            "missing_slots": [],
        }

    forced = state.get("forced_intent")
    if forced in _VALID_INTENTS:
        logger.info("[router_node] forced_intent=%s (skipping check_intent)", forced)
        return {
            "intent": forced,
            "routing_reasoning": f"Stream API: forced {forced.lower()} path (no router LLM).",
            "missing_slots": [],
        }

    # ── LLM-based intent classification ─────────────────────────────────────
    openai_messages: list[dict] = state.get("openai_messages", [])
    session_summary: str = state.get("session_summary", "") or ""
    logger.info("[router_node] calling check_intent messages_count=%d", len(openai_messages))

    intent, reasoning, missing_slots, detected_language = await check_intent(
        openai_messages,
        session_summary=session_summary,
    )

    logger.info(
        "[router_node] intent=%s missing_slots=%s language=%s reasoning_len=%d",
        intent,
        missing_slots,
        detected_language,
        len(reasoning),
    )
    return {
        "intent": intent.value,
        "routing_reasoning": reasoning,
        "missing_slots": missing_slots,
        "detected_language": detected_language,
    }
