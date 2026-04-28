"""Transformer node: decides if an EXPLAIN query can be answered with data.

For analytical/diagnostic questions (e.g. "What are Ghana's main economic challenges?")
the transformer converts them into 2-5 concrete data research queries so that the
research pipeline can produce an evidence-based answer instead of a generic narrative.

For truly definitional questions (e.g. "What is the Gini coefficient?") it short-
circuits directly to the explain node (pure metadata path).

The decision is captured as ``translated_queries`` in state:
  - non-empty list  → route to scout (data research pipeline)
  - empty list      → route to explain (metadata / definition path)

Non-streaming, no tools — a single fast LLM call with a small token budget.
"""

import json
import logging
import re

from langchain_core.messages import BaseMessage, SystemMessage

from app.ai.observability.token_usage import append_llm_usage_fallback
from app.ai.prompts import get_transformer_system_prompt
from app.config import ModelType

from ..llm_factory import get_chat_llm
from ..memory import trim_for_node
from ..message_utils import openai_to_langchain, plain_text_from_ai_message_content
from ..state import ChatPipelineState

logger = logging.getLogger(__name__)

# Regex to extract the first ```json ... ``` block from the LLM response
_JSON_BLOCK_RE = re.compile(r"```json\s*(.*?)\s*```", re.DOTALL)


def _parse_transformer_response(text: str) -> dict:
    """Extract the JSON decision block from the transformer's response.

    Returns a dict with at minimum ``decision`` and ``translated_queries`` keys.
    Falls back to DEFINITIONAL on any parse error so the flow is never broken.
    """
    match = _JSON_BLOCK_RE.search(text)
    if match:
        try:
            data = json.loads(match.group(1))
            if isinstance(data, dict) and "decision" in data:
                return data
        except (json.JSONDecodeError, ValueError):
            pass
    # Try raw JSON (no code fence)
    try:
        data = json.loads(text.strip())
        if isinstance(data, dict) and "decision" in data:
            return data
    except (json.JSONDecodeError, ValueError):
        pass
    logger.warning("[transformer_node] could not parse JSON response — defaulting to DEFINITIONAL")
    return {"decision": "DEFINITIONAL", "translated_queries": [], "framing": ""}


async def transformer_node(state: ChatPipelineState) -> dict:
    """Classify an EXPLAIN query as DATA_GROUNDABLE or DEFINITIONAL.

    DATA_GROUNDABLE  → writes ``translated_queries`` (non-empty list) to state;
                       the routing function will forward to scout.
    DEFINITIONAL     → writes ``translated_queries`` as [] to state;
                       the routing function will forward to explain.

    Returns state updates for ``translated_queries``.
    """
    model_type: str = state.get("model_type", ModelType.CHAT_MODEL.value)
    query_text: str = state.get("query_text", "")

    llm = get_chat_llm(model_type, streaming=False)
    system_prompt: str = get_transformer_system_prompt()

    history = openai_to_langchain(state.get("openai_messages", []))
    messages: list[BaseMessage] = trim_for_node(
        [SystemMessage(content=system_prompt)] + history,
        node="transformer",
    )

    logger.info("[transformer_node] classifying query=%r", query_text[:120])
    response = await llm.ainvoke(messages)
    append_llm_usage_fallback(state.get("_usage_fallback_bucket"), response)

    content_text = plain_text_from_ai_message_content(getattr(response, "content", None))
    result = _parse_transformer_response(content_text)
    decision: str = result.get("decision", "DEFINITIONAL")
    translated_queries: list[str] = result.get("translated_queries") or []

    # Ensure list of strings
    if not isinstance(translated_queries, list):
        translated_queries = []
    translated_queries = [str(q) for q in translated_queries if q]

    logger.info(
        "[transformer_node] decision=%s translated_queries=%d",
        decision,
        len(translated_queries),
    )

    existing_trace: list = state.get("agent_trace_parts") or []
    return {
        "translated_queries": translated_queries,
        "agent_trace_parts": existing_trace
        + [
            {
                "type": "agent-trace",
                "node": "transformer",
                "data": {"decision": decision, "translated_queries": translated_queries},
                "state": "done",
            }
        ],
    }
