"""Follow-up node: generates 2-3 targeted follow-up questions after the main answer.

Non-streaming (streaming=False).  Appends to assistant_parts with a special
separator so the questions appear naturally after the narrator's answer.

Returns ``{"followup_questions": list, "assistant_parts": updated_list}``.
"""

import logging
import re

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.observability.token_usage import append_llm_usage_fallback
from app.ai.prompts import get_followup_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..llm_invoke import (
    LLM_POLICY_BLOCKED_TEXT,
    LLM_STEP_FAILED_TEXT,
    assistant_text_part,
    safe_llm_ainvoke,
)
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain, plain_text_from_ai_message_content
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

# How many recent messages to pass to the follow-up LLM (keeps it lightweight)
_RECENT_HISTORY_LIMIT = 6


def _extract_questions(text: str) -> list[str]:
    """Extract numbered list items from the follow-up response for telemetry.

    Matches lines starting with a number followed by . or ) and optional whitespace.
    """
    lines = text.splitlines()
    questions: list[str] = []
    for line in lines:
        stripped = line.strip()
        if re.match(r"^\d+[.)]\s+.+", stripped):
            question = re.sub(r"^\d+[.)\s]+", "", stripped).strip()
            if question:
                questions.append(question)
    return questions


def _normalize_markdown_newlines(text: str) -> str:
    """Convert accidentally escaped newlines to real line breaks."""
    if r"\n" not in text:
        return text
    return text.replace(r"\n", "\n")


async def followup_node(state: ChatPipelineState) -> dict:
    """Generate 2-3 follow-up questions and append them to assistant_parts.

    Uses only the most recent conversation turns (last 6 messages) plus the
    research_packet (truncated to 1 000 chars) to keep the call cheap.

    ``streaming=False`` — this node does not emit token-level SSE events.

    Returns state updates for ``followup_questions``, ``assistant_parts``, and
    ``final_usage``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    language: str = state.get("detected_language", "") or ""

    llm = get_chat_llm(model_type, streaming=False)
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

    logger.info("[followup_node] generating follow-up questions")
    response, outcome = await safe_llm_ainvoke(llm, messages, context="followup")
    existing_parts: list[dict] = state.get("assistant_parts", [])

    if outcome == "policy":
        return {
            "followup_questions": [],
            "assistant_parts": existing_parts + [assistant_text_part(LLM_POLICY_BLOCKED_TEXT)],
            "final_usage": None,
            "content_policy_blocked": True,
        }

    if outcome != "ok":
        return {
            "followup_questions": [],
            "assistant_parts": existing_parts + [assistant_text_part(LLM_STEP_FAILED_TEXT)],
            "final_usage": None,
        }

    assert response is not None
    append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response, node="followup")

    final_content: str = plain_text_from_ai_message_content(getattr(response, "content", None))
    final_content = _normalize_markdown_newlines(final_content)
    final_usage: dict | None = None
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        final_usage = dict(response.usage_metadata)

    questions = _extract_questions(final_content)
    logger.info(
        "[followup_node] response length=%d questions_count=%d",
        len(final_content),
        len(questions),
    )

    assistant_part = {"type": "text", "text": final_content, "state": "done"}
    existing_parts: list[dict] = state.get("assistant_parts", [])

    return {
        "followup_questions": questions,
        "assistant_parts": existing_parts + [assistant_part],
        "final_usage": final_usage,
    }
