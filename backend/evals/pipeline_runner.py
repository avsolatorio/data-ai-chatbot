"""
Non-streaming eval runner for the chatbot pipeline.

Mirrors the chatbot's planner loop (routing -> LLM with tools -> tool execution -> loop)
but in non-streaming mode, capturing tool calls and final output for metric evaluation.

Usage:
    from evals.pipeline_runner import run_eval_pipeline

    result = await run_eval_pipeline("What is the GDP of Kenya?")
    print(result.tool_calls)
    print(result.final_output)
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Preserve MCP_SERVER_URL set via command line before app imports
# (app/ai/client.py runs load_dotenv(override=True) which clobbers env vars)
_MCP_URL_OVERRIDE = os.environ.get("MCP_SERVER_URL")


def _restore_mcp_env():
    """Re-apply MCP_SERVER_URL if it was set before app imports."""
    if _MCP_URL_OVERRIDE:
        os.environ["MCP_SERVER_URL"] = _MCP_URL_OVERRIDE
        # Clear the @cache on get_mcp_client so it picks up the new URL
        from app.ai.mcp_tools._client import get_mcp_client

        get_mcp_client.cache_clear()


_TOOLS_CACHE = Path(__file__).parent / ".cache" / "tool_definitions.json"


def _load_tool_definitions() -> list[dict[str, Any]]:
    """Load tool definitions from cache file.

    Requires running `python -m evals.cache_tools` first.
    """
    if not _TOOLS_CACHE.exists():
        raise FileNotFoundError(
            f"No cached tool definitions at {_TOOLS_CACHE}. "
            "Run: MCP_SERVER_URL=http://localhost:8021/mcp "
            "PYTHONPATH=. .venv/bin/python -m evals.cache_tools"
        )
    return json.loads(_TOOLS_CACHE.read_text())


@dataclass
class PipelineResult:
    """Result from a single eval pipeline run."""

    input_text: str
    routing_intent: str = ""
    routing_reasoning: str = ""
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    final_output: str = ""  # Writer output (Phase 2, after ^ANSWER^)
    planner_output: str = ""  # Planner output (Phase 1, before ^ANSWER^)
    model: str = ""
    turns_used: int = 0
    error: str | None = None


async def run_eval_pipeline(
    input_text: str,
    model: str | None = None,
    skip_routing: bool = False,
    max_tool_turns: int = 5,
    conversation_history: list[dict[str, str]] | None = None,
) -> PipelineResult:
    """
    Run a user prompt through the chatbot pipeline and capture results.

    Args:
        input_text: The user's message.
        model: LLM model name (defaults to settings.models.CHAT_MODEL).
        skip_routing: If True, skip routing and force RESEARCH path.
        max_tool_turns: Max number of tool call iterations.
        conversation_history: Optional prior messages for multi-turn eval.

    Returns:
        PipelineResult with routing intent, tool calls, and final output.
    """
    from app.ai.client import get_async_ai_client, get_model_name
    from app.ai.mcp_tools.data360_mcp import call_mcp_tool
    from app.ai.prompts import get_combined_system_prompt, get_direct_system_prompt
    from app.ai.routing import check_intent
    from app.config import ModelType

    # Restore MCP_SERVER_URL AFTER imports (load_dotenv(override=True) clobbers it)
    _restore_mcp_env()

    result = PipelineResult(input_text=input_text)

    try:
        if model is None:
            model = get_model_name(ModelType.CHAT_MODEL)
        result.model = model

        messages: list[dict[str, Any]] = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": input_text})

        # Step 1: Routing
        if skip_routing:
            result.routing_intent = "RESEARCH"
            result.routing_reasoning = "Routing skipped (forced RESEARCH)"
        else:
            intent, reasoning = await check_intent(messages)
            result.routing_intent = intent.value
            result.routing_reasoning = reasoning
            logger.info("Routing: %s (%s)", result.routing_intent, reasoning[:100])

        # Step 2: Select prompt and tools
        if result.routing_intent == "RESEARCH":
            system_prompt = get_combined_system_prompt(ModelType.CHAT_MODEL)
            tool_definitions = _load_tool_definitions()
        else:
            system_prompt = get_direct_system_prompt()
            tool_definitions = None

        # Step 3: Build conversation
        conversation: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
        ]
        if conversation_history:
            conversation.extend(conversation_history)
        conversation.append({"role": "user", "content": input_text})

        # Step 4: Multi-turn tool calling loop (non-streaming)
        client = get_async_ai_client()

        for turn in range(max_tool_turns):
            result.turns_used = turn + 1
            logger.info("Turn %d/%d", turn + 1, max_tool_turns)

            chat_kwargs: dict[str, Any] = {
                "model": model,
                "messages": conversation,
                "stream": False,
                "temperature": 0,
            }
            if tool_definitions:
                chat_kwargs["tools"] = tool_definitions

            response = await client.chat.completions.create(**chat_kwargs)
            choice = response.choices[0]
            message = choice.message

            if (
                choice.finish_reason == "tool_calls"
                and hasattr(message, "tool_calls")
                and message.tool_calls
            ):
                assistant_msg: dict[str, Any] = {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in message.tool_calls
                    ],
                }
                conversation.append(assistant_msg)

                for tc in message.tool_calls:
                    tool_name = tc.function.name
                    try:
                        arguments = (
                            json.loads(tc.function.arguments) if tc.function.arguments else {}
                        )
                    except json.JSONDecodeError:
                        arguments = {}

                    logger.info(
                        "Tool call: %s(%s)",
                        tool_name,
                        json.dumps(arguments)[:200],
                    )

                    try:
                        tool_result = await call_mcp_tool(tool_name, arguments)
                    except Exception as e:
                        tool_result = {"error": str(e)}
                        logger.warning("Tool error: %s: %s", tool_name, e)

                    result.tool_calls.append(
                        {
                            "tool": tool_name,
                            "arguments": arguments,
                            "result": tool_result,
                        }
                    )

                    tool_result_str = (
                        json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
                    )
                    conversation.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": tool_result_str,
                        }
                    )

                continue
            else:
                content = getattr(message, "content", "") or ""
                # Split on ^ANSWER^ token to separate Planner (Phase 1) from Writer (Phase 2)
                from app.ai.prompts import THINKING_TO_ANSWER_TOKEN

                if THINKING_TO_ANSWER_TOKEN in content:
                    parts = content.split(THINKING_TO_ANSWER_TOKEN, 1)
                    result.planner_output = parts[0].strip()
                    result.final_output = parts[1].strip()
                else:
                    result.final_output = content
                logger.info(
                    "Final output (%d chars, %d tool calls)",
                    len(result.final_output),
                    len(result.tool_calls),
                )
                break

    except Exception as e:
        result.error = str(e)
        logger.error("Pipeline error: %s", e, exc_info=True)

    return result


async def run_eval_batch(
    test_cases: list[dict[str, Any]],
    model: str | None = None,
    skip_routing: bool = False,
) -> list[PipelineResult]:
    """Run multiple test cases through the pipeline."""
    results = []
    for i, tc in enumerate(test_cases):
        logger.info(
            "Running test case %d/%d: %s",
            i + 1,
            len(test_cases),
            tc.get("id", "?"),
        )
        r = await run_eval_pipeline(
            input_text=tc["input"],
            model=model,
            skip_routing=skip_routing,
            conversation_history=tc.get("conversation_history"),
        )
        results.append(r)
    return results
