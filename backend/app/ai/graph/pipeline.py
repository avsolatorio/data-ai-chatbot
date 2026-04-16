"""LangGraph StateGraph construction for the chat pipeline.

Graph topology:
    START → summarizer → router
    router RESEARCH     → scout → planner → research → [conditional] → narrator → followup → END
                                                      ↓ (if failed)
                                                   recovery → narrator → followup → END
    router EXPLAIN      → transformer → [DATA_GROUNDABLE] → scout → planner → research → ...
                                      → [DEFINITIONAL]    → explain → narrator → followup → END
    router CLARIFY      → clarifier                                             → END
    router OUT_OF_SCOPE → suggester                                             → END
    router DIRECT       → direct                                                → END

``transformer`` intercepts EXPLAIN-routed queries and decides:
  - DATA_GROUNDABLE: analytical/diagnostic ("What are Ghana's challenges?") →
    translates to concrete data queries → full research pipeline
  - DEFINITIONAL: pure concept/methodology questions ("What is the Gini?") →
    metadata-only explain path

The compiled graph is a module-level singleton (``chat_graph``) so it is
built once at startup and reused across all requests.
"""

import logging

from langgraph.graph import END, START, StateGraph

from .nodes.clarifier import clarifier_node
from .nodes.direct import direct_node
from .nodes.explain import explain_node
from .nodes.followup import followup_node
from .nodes.narrator import narrator_node
from .nodes.planner import planner_node
from .nodes.recovery import recovery_node
from .nodes.research import research_node
from .nodes.router import router_node
from .nodes.scout import scout_node
from .nodes.suggester import suggester_node
from .nodes.summarizer import summarizer_node
from .nodes.transformer import transformer_node
from .state import ChatPipelineState

logger = logging.getLogger(__name__)

# Phrases in a research_packet that indicate the research found no usable data
FAILURE_SIGNALS = (
    "no data",
    "not available",
    "no results",
    "could not find",
    "failed to retrieve",
    "data unavailable",
)


def _is_research_failed(packet: str) -> bool:
    """Return True when research_packet indicates no data was retrieved.

    Failure = the research node produced nothing usable.
    NOT failure = research found the indicator but the exact year/country had no
    observation value (narrator can handle "not available" gracefully).
    """
    if not packet or len(packet.strip()) < 50:
        return True
    lower = packet.lower()
    # Explicit NO_DATA section means the search found nothing at all
    if "### no_data:" in lower:
        return True
    # Claim tags confirm real observation values were retrieved — definitive success
    if "<claim" in lower:
        return False
    # A structured packet (has DATA or EVIDENCE NOTES sections) means research ran
    # properly and identified the indicator, even if the specific year/country had
    # no observation. Don't trigger recovery — narrator handles "not available" fine.
    if "### data:" in lower or "### evidence notes:" in lower:
        return False
    # Unstructured response — fall back to keyword signals
    return any(sig in lower for sig in FAILURE_SIGNALS)


def _route_after_router(state: ChatPipelineState) -> str:
    """Conditional edge: decide which path to take after routing."""
    intent: str = state.get("intent", "DIRECT")
    logger.debug("[pipeline] routing intent=%s", intent)
    return {
        "RESEARCH": "scout",
        "EXPLAIN": "transformer",  # transformer decides: data-pipeline or pure explain
        "CLARIFY": "clarifier",
        "OUT_OF_SCOPE": "suggester",
        "DIRECT": "direct",
    }.get(intent, "direct")


def _route_after_transformer(state: ChatPipelineState) -> str:
    """After transformer: data pipeline if translated_queries present, else pure explain."""
    translated: list = state.get("translated_queries") or []
    if translated:
        logger.info(
            "[pipeline] transformer → DATA_GROUNDABLE (%d queries) → scout",
            len(translated),
        )
        return "scout"
    logger.info("[pipeline] transformer → DEFINITIONAL → explain")
    return "explain"


def _route_after_research(state: ChatPipelineState) -> str:
    """After research: go to recovery if packet is empty/failed, else narrator."""
    packet: str = state.get("research_packet", "")
    already_attempted: bool = state.get("recovery_attempted", False)
    if not already_attempted and _is_research_failed(packet):
        return "recovery"
    return "narrator"


def build_chat_graph():
    """Construct and compile the chat pipeline StateGraph."""
    g = StateGraph(ChatPipelineState)

    # ── Nodes ──────────────────────────────────────────────────────────────────
    g.add_node("summarizer", summarizer_node)
    g.add_node("router", router_node)
    g.add_node("transformer", transformer_node)
    g.add_node("scout", scout_node)
    g.add_node("planner", planner_node)
    g.add_node("research", research_node)
    g.add_node("recovery", recovery_node)
    g.add_node("explain", explain_node)
    g.add_node("narrator", narrator_node)
    g.add_node("followup", followup_node)
    g.add_node("direct", direct_node)
    g.add_node("clarifier", clarifier_node)
    g.add_node("suggester", suggester_node)

    # ── Edges ──────────────────────────────────────────────────────────────────
    # Summarizer runs first on every request, then hands off to router
    g.add_edge(START, "summarizer")
    g.add_edge("summarizer", "router")

    # Router fan-out: EXPLAIN goes to transformer; RESEARCH goes directly to scout
    g.add_conditional_edges(
        "router",
        _route_after_router,
        {
            "scout": "scout",
            "transformer": "transformer",
            "clarifier": "clarifier",
            "suggester": "suggester",
            "direct": "direct",
        },
    )

    # Transformer: DATA_GROUNDABLE → scout (joins the research pipeline)
    #              DEFINITIONAL    → explain (metadata-only path)
    g.add_conditional_edges(
        "transformer",
        _route_after_transformer,
        {
            "scout": "scout",
            "explain": "explain",
        },
    )

    # Research pipeline: scout → planner → research → [conditional] → narrator
    g.add_edge("scout", "planner")
    g.add_edge("planner", "research")
    g.add_conditional_edges(
        "research",
        _route_after_research,
        {
            "recovery": "recovery",
            "narrator": "narrator",
        },
    )

    # Recovery also feeds into narrator
    g.add_edge("recovery", "narrator")

    # Explain feeds narrator for consistent formatting
    g.add_edge("explain", "narrator")

    # Narrator → followup → END (for research and explain paths)
    g.add_edge("narrator", "followup")
    g.add_edge("followup", END)

    # Terminal nodes (no followup for these)
    g.add_edge("direct", END)
    g.add_edge("clarifier", END)
    g.add_edge("suggester", END)

    compiled = g.compile()
    logger.info("[pipeline] chat_graph compiled successfully")
    return compiled


# Module-level singleton — built once at import time.
chat_graph = build_chat_graph()
