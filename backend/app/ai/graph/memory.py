"""Per-node token-budget message trimming for the LangGraph pipeline.

Uses langchain_core.messages.trim_messages() with a "last" strategy so that
each node receives the most recent messages up to its token budget.  Older
messages are dropped (not summarised) to keep the implementation simple and
predictable.

Token budgets are intentionally conservative — they leave room for the system
prompt, tool definitions injected by bind_tools(), and the model's output.
Adjust via settings or the TOKEN_BUDGETS dict as model context windows change.
"""

import logging
from typing import Any

from langchain_core.messages import BaseMessage, trim_messages

logger = logging.getLogger(__name__)

# ── Per-node token budgets (input tokens only, excluding system + output) ──────
TOKEN_BUDGETS: dict[str, int] = {
    "router": 4_000,  # routing just needs recent context
    "research": 32_000,  # planner benefits from long history for data continuity
    "narrator": 16_000,  # writer needs research packet + enough recent history
    "direct": 8_000,  # direct chat covers typical conversational context
}
_DEFAULT_BUDGET = 16_000


def trim_for_node(
    messages: list[BaseMessage],
    node: str,
    token_counter: Any = len,  # replaced with tiktoken in production if available
) -> list[BaseMessage]:
    """Trim a list of LangChain messages to the token budget for *node*.

    Args:
        messages:       LangChain message list (may include SystemMessage).
        node:           Graph node name — used to look up TOKEN_BUDGETS.
        token_counter:  Callable that counts tokens for a list of messages.
                        Defaults to ``len`` (character count as rough proxy).
                        Pass a tiktoken-based counter for accurate budgeting.

    Returns:
        Trimmed list of messages, always keeping the most recent ones.
    """
    budget = TOKEN_BUDGETS.get(node, _DEFAULT_BUDGET)
    try:
        trimmed = trim_messages(
            messages,
            max_tokens=budget,
            token_counter=token_counter,
            strategy="last",  # keep most-recent messages
            include_system=True,  # always preserve the system prompt
            allow_partial=False,  # never cut a message in half
        )
        original_count = len(messages)
        trimmed_count = len(trimmed)
        if trimmed_count < original_count:
            logger.info(
                "[memory] node=%s trimmed %d → %d messages (budget=%d)",
                node,
                original_count,
                trimmed_count,
                budget,
            )
        return trimmed
    except Exception as exc:
        logger.warning(
            "[memory] trim_messages failed for node=%s: %s — returning full history",
            node,
            exc,
        )
        return messages
