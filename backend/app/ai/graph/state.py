"""LangGraph state schema for the chat pipeline."""

from typing import Any, TypedDict


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
    intent: str  # "RESEARCH" | "DIRECT"
    routing_reasoning: str  # brief explanation for the SSE thinking panel

    # ── Research node output ───────────────────────────────────────────────────
    research_packet: str  # Planner's notes / data summary for the Writer

    # ── Final output (consumed by chat.py for DB save) ────────────────────────
    assistant_parts: list[dict]  # assembled message parts (thinking + chat)
    final_usage: dict | None  # token usage counts
