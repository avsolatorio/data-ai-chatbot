"""Planner node: decomposes complex queries into a structured execution plan.

Non-streaming, no tools.  Reads scout_findings injected as context and outputs
a JSON task list that the research node will use to guide its data retrieval.

Returns ``{"query_plan": list_of_tasks}``.
"""

import json
import logging
import re

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.ai.prompts import get_planner_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)


def _parse_plan_response(text: str) -> list[dict]:
    """Extract the JSON task list from the planner response.

    Looks for a ```json ... ``` fenced block containing a JSON array.
    Falls back to [] on any parse failure.
    """
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(1))
            if isinstance(parsed, list):
                return parsed
            logger.warning("[planner_node] JSON is not a list — got %s", type(parsed).__name__)
        except json.JSONDecodeError as exc:
            logger.warning("[planner_node] JSON parse failed: %s", exc)
    return []


async def planner_node(state: ChatPipelineState) -> dict:
    """Decompose the query into a structured execution plan.

    Injects scout_findings and (optionally) a session_summary as context, then
    calls the LLM once (non-streaming, no tools) to produce a JSON task list.

    ``streaming=False`` — this node does not emit token-level SSE events.

    Returns state updates for ``query_plan``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)

    llm = get_chat_llm(model_type, streaming=False)
    system_prompt: str = get_planner_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))

    # Prepend session summary if available
    session_summary: str = state.get("session_summary", "") or ""
    if session_summary:
        history = [HumanMessage(content=f"[SESSION SUMMARY]\n{session_summary}")] + history

    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="planner",
    )

    # Append scout findings as a HumanMessage so the planner can read them
    scout_findings: dict = state.get("scout_findings", {}) or {}
    if scout_findings:
        scout_msg = HumanMessage(
            content=("[SCOUT FINDINGS]\n```json\n" + json.dumps(scout_findings, indent=2) + "\n```")
        )
        messages = messages + [scout_msg]

    # If the transformer translated an analytical question into specific data queries,
    # inject them so the planner builds its task list around those queries exactly.
    translated_queries: list[str] = state.get("translated_queries") or []
    if translated_queries:
        tq_lines = "\n".join(f"  {i + 1}. {q}" for i, q in enumerate(translated_queries))
        messages = messages + [
            HumanMessage(
                content=(
                    "[TRANSLATED DATA QUERIES — from transformer]\n"
                    "The original question was analytical/diagnostic. These are the specific "
                    "data queries that will together answer it. Build your plan around these "
                    "queries exactly, one task per query:\n"
                    + tq_lines
                    + "\n\nFrame the final answer as evidence-based: "
                    "'The data shows X' rather than 'challenges tend to be Y'."
                )
            )
        ]

    response = await llm.ainvoke(messages)
    final_content: str = response.content or ""

    query_plan = _parse_plan_response(final_content)
    logger.info(
        "[planner_node] query_plan tasks=%d (translated_queries=%d)",
        len(query_plan),
        len(translated_queries),
    )

    return {"query_plan": query_plan}
