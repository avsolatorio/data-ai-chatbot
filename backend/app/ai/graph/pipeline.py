"""LangGraph StateGraph construction for the chat pipeline.

Graph topology:
    START → router → RESEARCH? → research → narrator → END
                   → DIRECT?  → direct              → END

The compiled graph is a module-level singleton (``chat_graph``) so it is
built once at startup and reused across all requests.
"""

import logging

from langgraph.graph import END, START, StateGraph

from .nodes.direct import direct_node
from .nodes.narrator import narrator_node
from .nodes.research import research_node
from .nodes.router import router_node
from .state import ChatPipelineState

logger = logging.getLogger(__name__)


def _route_after_router(state: ChatPipelineState) -> str:
    """Conditional edge: decide which path to take after routing."""
    intent: str = state.get("intent", "DIRECT")
    logger.debug("[pipeline] routing intent=%s", intent)
    return "research" if intent == "RESEARCH" else "direct"


def build_chat_graph():
    """Construct and compile the chat pipeline StateGraph."""
    g = StateGraph(ChatPipelineState)

    # ── Nodes ──────────────────────────────────────────────────────────────────
    g.add_node("router", router_node)
    g.add_node("research", research_node)
    g.add_node("narrator", narrator_node)
    g.add_node("direct", direct_node)

    # ── Edges ──────────────────────────────────────────────────────────────────
    g.add_edge(START, "router")
    g.add_conditional_edges(
        "router", _route_after_router, {"research": "research", "direct": "direct"}
    )
    g.add_edge("research", "narrator")
    g.add_edge("narrator", END)
    g.add_edge("direct", END)

    compiled = g.compile()
    logger.info("[pipeline] chat_graph compiled successfully")
    return compiled


# Module-level singleton — built once at import time.
chat_graph = build_chat_graph()
