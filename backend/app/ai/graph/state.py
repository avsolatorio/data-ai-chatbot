"""LangGraph state schema for the chat pipeline."""

from typing import Any, NotRequired, TypedDict


class ChatPipelineState(TypedDict):
    # ── Inputs (set before graph runs) ────────────────────────────────────────
    openai_messages: list[dict]  # from convert_messages_to_openai_format()
    model_type: str  # ModelType enum value (e.g. "chat-model")
    query_text: str  # raw user query (for @wdr detection)
    message_id: str  # SSE part_message_id (e.g. "msg-<hex>")
    # tool_set is the dict from prepare_tools(), extended by tool_setup with:
    #   tool_set["mcp_data"]["langchain_tools"]  ← data-retrieval LangChain tools
    #   tool_set["mcp_viz"]["langchain_tools"]   ← viz LangChain tools
    #   tool_set["local"]["langchain_tools"]     ← local LangChain tools
    tool_set: dict[str, Any]

    # ── Router output ──────────────────────────────────────────────────────────
    intent: str  # "RESEARCH" | "DIRECT" | "CLARIFY" | "OUT_OF_SCOPE" | "EXPLAIN"
    routing_reasoning: str  # brief explanation for the SSE thinking panel
    # When set, router_node skips LLM classification (e.g. v1 chat stream).
    forced_intent: NotRequired[str | None]
    # Missing slots populated by router when intent == CLARIFY
    missing_slots: NotRequired[list[str]]
    # Confidence score from the routing LLM (0.0–1.0), for diagnostics/telemetry
    routing_confidence: NotRequired[float]
    # Detected language of the user's message (e.g. "French", "Spanish", "English")
    # Used to instruct all response nodes to reply in the same language.
    detected_language: NotRequired[str]

    # ── Research / Explain node output ────────────────────────────────────────
    research_packet: str  # Routing metadata packet from the Research Agent
    # Raw tool outputs from the research loop — injected into narrator directly
    # so numbers never have to be re-transcribed through an extra LLM pass.
    research_tool_results: NotRequired[list[dict]]

    # ── Quick answer node output ───────────────────────────────────────────────
    # Set to "quick" when the router classified the question as QUICK_ANSWER.
    # The narrator checks this flag and produces minimal prose instead of full
    # analytical prose — the visual weight is carried by the aggregation renderers.
    response_mode: NotRequired[str]  # "quick" | "full" (default "full")

    # ── Clarifier node output ─────────────────────────────────────────────────
    clarification_question: NotRequired[str]  # the single question emitted to the user

    # ── Suggester node output ─────────────────────────────────────────────────
    suggestions: NotRequired[list[str]]  # 3-5 bridging questions (for telemetry)

    # ── Final output (consumed by chat.py for DB save) ────────────────────────
    assistant_parts: list[dict]  # assembled message parts (thinking + chat)
    final_usage: dict | None  # token usage counts

    # ── Streaming only (set by chat.py; nodes push manual tool lifecycle) ────
    _tool_sse_queue: NotRequired[Any]  # asyncio.Queue of manual tool payloads
    # Same object as graph input; nodes append usage if stream events omit token counts
    _usage_fallback_bucket: NotRequired[Any]

    # ── Session memory ────────────────────────────────────────────────────────
    # Rolling summary of compressed older turns; injected as context by nodes
    session_summary: NotRequired[str]
    # How many openai_messages were captured in the current session_summary
    summarized_message_count: NotRequired[int]
    # Follow-up questions generated post-narrator
    followup_questions: NotRequired[list[str]]
    # Set when followup (or another node) surfaces LLM_POLICY_BLOCKED_TEXT under policy
    content_policy_blocked: NotRequired[bool]
    # Internal agent outputs for debugging/analytics
    agent_trace_parts: NotRequired[list[dict]]
