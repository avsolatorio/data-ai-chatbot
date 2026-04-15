"""Router node: classifies intent into RESEARCH, DIRECT, CLARIFY, OUT_OF_SCOPE, or EXPLAIN.

Wraps the existing check_intent() function from app.ai.routing so that
routing logic is a first-class LangGraph node without duplicating code.
The @wdr override is also handled here (fast-path, no LLM call).
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
    routing model via LiteLLM.

    Returns state updates for ``intent``, ``routing_reasoning``,
    ``missing_slots``, and ``routing_confidence``.
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
    logger.info("[router_node] calling check_intent messages_count=%d", len(openai_messages))

    intent, reasoning, router_usage, missing_slots, detected_language = await check_intent(
        openai_messages
    )

    logger.info(
        "[router_node] intent=%s missing_slots=%s language=%s reasoning_len=%d",
        intent,
        missing_slots,
        detected_language,
        len(reasoning),
    )
    out: dict = {
        "intent": intent.value,
        "routing_reasoning": reasoning,
        "missing_slots": missing_slots,
        "detected_language": detected_language,
    }
    if router_usage:
        out["router_usage"] = router_usage
    return out
