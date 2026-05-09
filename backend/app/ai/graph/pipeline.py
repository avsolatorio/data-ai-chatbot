"""LangGraph StateGraph construction for the chat pipeline.

Graph topology (8 nodes):
    START → summarizer → router
    router QUICK_ANSWER → quick_answer → narrator → followup → END
    router RESEARCH     → research    → narrator → followup → END
    router EXPLAIN      → explain     → narrator → followup → END
    router CLARIFY      → clarifier                         → END
    router OUT_OF_SCOPE → suggester                         → END
    router DIRECT       → direct                            → END

The former transformer / scout / planner / recovery nodes have been
consolidated into the adaptive research_node (see nodes/research.py).
"""

import logging

from langgraph.graph import END, START, StateGraph

from .nodes.clarifier import clarifier_node
from .nodes.direct import direct_node
from .nodes.explain import explain_node
from .nodes.followup import followup_node
from .nodes.narrator import narrator_node
from .nodes.quick_answer import quick_answer_node
from .nodes.research import research_node
from .nodes.router import router_node
from .nodes.suggester import suggester_node
from .nodes.summarizer import summarizer_node
from .state import ChatPipelineState

logger = logging.getLogger(__name__)


def _route_after_router(state: ChatPipelineState) -> str:
    """Map router intent to the next node."""
    intent: str = state.get("intent", "DIRECT")
    logger.debug("[pipeline] routing intent=%s", intent)
    return {
        "QUICK_ANSWER": "quick_answer",
        "RESEARCH": "research",
        "EXPLAIN": "explain",
        "CLARIFY": "clarifier",
        "OUT_OF_SCOPE": "suggester",
        "DIRECT": "direct",
    }.get(intent, "direct")


def build_chat_graph():
    """Construct and compile the chat pipeline StateGraph."""
    g = StateGraph(ChatPipelineState)

    # ── Nodes ──────────────────────────────────────────────────────────────────
    g.add_node("summarizer", summarizer_node)
    g.add_node("router", router_node)
    g.add_node("quick_answer", quick_answer_node)
    g.add_node("research", research_node)
    g.add_node("explain", explain_node)
    g.add_node("narrator", narrator_node)
    g.add_node("followup", followup_node)
    g.add_node("direct", direct_node)
    g.add_node("clarifier", clarifier_node)
    g.add_node("suggester", suggester_node)

    # ── Edges ──────────────────────────────────────────────────────────────────
    g.add_edge(START, "summarizer")
    g.add_edge("summarizer", "router")

    g.add_conditional_edges(
        "router",
        _route_after_router,
        {
            "quick_answer": "quick_answer",
            "research": "research",
            "explain": "explain",
            "clarifier": "clarifier",
            "suggester": "suggester",
            "direct": "direct",
        },
    )

    # quick_answer, research, and explain all feed narrator
    g.add_edge("quick_answer", "narrator")
    g.add_edge("research", "narrator")
    g.add_edge("explain", "narrator")

    # Narrator → followup → END
    g.add_edge("narrator", "followup")
    g.add_edge("followup", END)

    # Terminal nodes
    g.add_edge("direct", END)
    g.add_edge("clarifier", END)
    g.add_edge("suggester", END)

    compiled = g.compile()
    logger.info("[pipeline] chat_graph compiled successfully (8 nodes)")
    return compiled


# Module-level singleton — built once at import time.
chat_graph = build_chat_graph()
