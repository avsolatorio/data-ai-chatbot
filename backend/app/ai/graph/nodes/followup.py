"""Follow-up node: emits data360_interactive_choices so follow-ups appear as native ChoiceCard.

Non-streaming (streaming=False).  The tool call part is pushed to the client via the
SSE bridge inside run_tool_loop — no text parsing required on the frontend.

Returns ``{"followup_questions": [], "assistant_parts": updated_list, "final_usage": ...}``.
"""

import logging

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_followup_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..node_utils import run_tool_loop
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

# How many recent messages to pass to the follow-up LLM (keeps it lightweight)
_RECENT_HISTORY_LIMIT = 6


async def followup_node(state: ChatPipelineState) -> dict:
    """Generate follow-up choices via data360_interactive_choices tool call.

    The SSE bridge pushes the tool-call part to the client; the frontend renders it
    as a native ChoiceCard. No text output or regex parsing needed.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    language: str = state.get("detected_language", "") or ""

    choices_tools: list = (
        state.get("tool_set", {}).get("mcp_choices", {}).get("langchain_tools", [])
    )

    if not choices_tools:
        logger.warning("[followup_node] data360_interactive_choices not available — skipping")
        return {
            "followup_questions": [],
            "assistant_parts": state.get("assistant_parts", []),
            "final_usage": None,
        }

    system_prompt: str = get_followup_system_prompt(language=language)

    # Use only the last few messages to keep context small and focused
    openai_messages: list[dict] = state.get("openai_messages", [])
    recent = openai_messages[-_RECENT_HISTORY_LIMIT:]
    history = openai_to_langchain(recent)

    # Optionally inject a truncated research packet for topic grounding
    research_packet: str = state.get("research_packet", "") or ""
    if research_packet:
        history = history + [
            HumanMessage(content="[RESEARCH FINDINGS SUMMARY]\n" + research_packet[:1000])
        ]

    # Inject quick-answer card context so suggestions are tailored to the card type.
    quick_answer_card: dict | None = state.get("quick_answer_card")
    if quick_answer_card:
        card_type = quick_answer_card.get("card_type", "")
        indicator = quick_answer_card.get("indicator_name", "")
        country = quick_answer_card.get("country_name", "")
        earliest_year = quick_answer_card.get("earliest_year", "")
        latest_year = quick_answer_card.get("latest_year", "")
        year = quick_answer_card.get("year", "")
        card_hint_parts = [f"[QUICK ANSWER CARD CONTEXT]\ncardType={card_type}"]
        if indicator:
            card_hint_parts.append(f"indicator={indicator}")
        if country:
            card_hint_parts.append(f"country={country}")
        if card_type == "trend" and earliest_year and latest_year:
            card_hint_parts.append(f"timeRange={earliest_year}–{latest_year}")
        elif year:
            card_hint_parts.append(f"year={year}")
        history = history + [HumanMessage(content="\n".join(card_hint_parts))]

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="followup",
    )

    llm = get_chat_llm(model_type, streaming=False).bind_tools(choices_tools)
    tool_map = {t.name: t for t in choices_tools}

    logger.info("[followup_node] generating follow-up choices via tool call")
    _final_content, final_usage, _tool_results = await run_tool_loop(
        llm=llm,
        messages=messages,
        tool_map=tool_map,
        max_iterations=2,
        state=state,
        graph_node="followup",
        collect_tool_results=False,
    )

    return {
        # Kept for state schema compatibility; no longer populated from text.
        "followup_questions": [],
        # Tool parts are emitted to the client via the SSE bridge inside run_tool_loop.
        "assistant_parts": state.get("assistant_parts", []),
        "final_usage": final_usage,
    }
