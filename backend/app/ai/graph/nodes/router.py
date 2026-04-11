"""Router node: classifies intent as RESEARCH or DIRECT.

Wraps the existing check_intent() function from app.ai.routing so that
routing logic is a first-class LangGraph node without duplicating code.
The @wdr override is also handled here (fast-path, no LLM call).
"""

import logging

from app.ai.routing import check_intent
from app.config import IntentType

from ..state import ChatPipelineState

logger = logging.getLogger(__name__)


async def router_node(state: ChatPipelineState) -> dict:
    """Determine RESEARCH vs DIRECT intent and return routing state updates.

    Fast-path: if the user query contains ``@wdr``, forces RESEARCH without
    an LLM call.  Otherwise delegates to the existing check_intent() which
    calls the routing model via LiteLLM.

    Returns state updates for ``intent`` and ``routing_reasoning``.
    """
    query_text: str = state.get("query_text", "")

    # ── @wdr force-research override ─────────────────────────────────────────
    if "@wdr" in query_text.lower():
        logger.info("[router_node] @wdr token detected — forcing RESEARCH path")
        return {
            "intent": IntentType.RESEARCH.value,
            "routing_reasoning": "WDR research triggered by @wdr.",
        }

    forced = state.get("forced_intent")
    if forced in (IntentType.RESEARCH.value, IntentType.DIRECT.value):
        logger.info("[router_node] forced_intent=%s (skipping check_intent)", forced)
        label = "research" if forced == IntentType.RESEARCH.value else "direct"
        return {
            "intent": forced,
            "routing_reasoning": f"Stream API: {label} path (no router LLM).",
        }

    # ── LLM-based intent classification ─────────────────────────────────────
    openai_messages: list[dict] = state.get("openai_messages", [])
    logger.info("[router_node] calling check_intent messages_count=%d", len(openai_messages))

    intent, reasoning, router_usage = await check_intent(openai_messages)

    logger.info("[router_node] intent=%s reasoning_len=%d", intent, len(reasoning))
    out: dict = {
        "intent": intent.value,
        "routing_reasoning": reasoning,
    }
    if router_usage:
        out["router_usage"] = router_usage
    return out
