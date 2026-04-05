"""
Regression tests for stream_text (mocked LLM stream).

Covers ^ANSWER^ delimiter switching, no-token fallback, holdback flush, and
tool-call boundaries — see plan: stream test suite.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Sequence
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.ai.prompts import THINKING_TO_ANSWER_TOKEN
from app.utils.stream import stream_text


class _Delta:
    __slots__ = ("content", "tool_calls")

    def __init__(
        self,
        content: str | None = None,
        tool_calls: Sequence[object] | None = None,
    ) -> None:
        self.content = content
        self.tool_calls = tool_calls


class _Choice:
    __slots__ = ("delta", "finish_reason")

    def __init__(
        self,
        delta: _Delta | None = None,
        finish_reason: str | None = None,
    ) -> None:
        self.delta = delta or _Delta()
        self.finish_reason = finish_reason


class _Chunk:
    __slots__ = ("id", "choices", "usage")

    def __init__(
        self,
        id: str = "chunk-1",
        choices: Sequence[_Choice] | None = None,
        usage: object | None = None,
    ) -> None:
        self.id = id
        self.choices = list(choices) if choices else []
        self.usage = usage


class _ToolCallDelta:
    __slots__ = ("index", "id", "function")

    def __init__(self, index: int, id: str, function: object) -> None:
        self.index = index
        self.id = id
        self.function = function


class _Function:
    __slots__ = ("name", "arguments")

    def __init__(self, name: str | None, arguments: str | None) -> None:
        self.name = name
        self.arguments = arguments


def _make_client(streams: list[list[_Chunk]]) -> MagicMock:
    """Return a mock OpenAI client; each create() consumes the next chunk list."""
    idx = [0]

    async def create(**_kwargs: object) -> AsyncIterator[_Chunk]:
        if idx[0] >= len(streams):
            raise AssertionError("client.chat.completions.create called too many times")

        chunks = streams[idx[0]]
        idx[0] += 1

        async def gen() -> AsyncIterator[_Chunk]:
            for c in chunks:
                yield c

        return gen()

    client = MagicMock()
    client.chat.completions.create = AsyncMock(side_effect=create)
    return client


async def _collect_sse(gen: AsyncIterator[str]) -> str:
    parts: list[str] = []
    async for item in gen:
        parts.append(item if isinstance(item, str) else item.decode("utf-8"))
    return "".join(parts)


@pytest.mark.asyncio
async def test_thinking_to_answer_token_switches_to_chat_and_strips_token() -> None:
    token = THINKING_TO_ANSWER_TOKEN
    text = f"before{token}after"
    client = _make_client(
        [
            [
                _Chunk(
                    choices=[
                        _Choice(
                            _Delta(content=text),
                            finish_reason="stop",
                        ),
                    ],
                ),
            ],
        ],
    )

    sse = await _collect_sse(
        stream_text(
            client=client,
            model="openai:gpt-4o",
            messages=[{"role": "user", "content": "hi"}],
            mode="thinking",
            tools={},
            tool_definitions=[],
            thinking_to_answer_token=token,
            stream_yield_delay=0,
        ),
    )

    assert token not in sse
    assert "before" in sse
    assert "after" in sse
    # Post-token narrative uses chat-mode emission (plain data lines, not data-thinking)
    assert sse.count('"type":"text-delta"') >= 2


@pytest.mark.asyncio
async def test_no_token_terminal_finish_emits_generating_fallback(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level("WARNING")
    client = _make_client(
        [
            [
                _Chunk(
                    choices=[
                        _Choice(
                            _Delta(content="hello"),
                            finish_reason="stop",
                        ),
                    ],
                ),
            ],
        ],
    )

    sse = await _collect_sse(
        stream_text(
            client=client,
            model="openai:gpt-4o",
            messages=[{"role": "user", "content": "hi"}],
            mode="thinking",
            tools={},
            tool_definitions=[],
            thinking_to_answer_token=THINKING_TO_ANSWER_TOKEN,
            stream_yield_delay=0,
        ),
    )

    assert "Stream ended without" in caplog.text
    assert "generating" in sse
    assert "hello" in sse


@pytest.mark.asyncio
async def test_holdback_prefix_flushes_full_thinking_without_truncation() -> None:
    """Stream ends while buffer is a strict prefix of the delimiter — flush must not drop chars."""
    token = THINKING_TO_ANSWER_TOKEN
    prefix = token[:-1]
    client = _make_client(
        [
            [
                _Chunk(choices=[_Choice(_Delta(content=prefix), finish_reason=None)]),
                _Chunk(choices=[_Choice(_Delta(content=None), finish_reason="stop")]),
            ],
        ],
    )

    sse = await _collect_sse(
        stream_text(
            client=client,
            model="openai:gpt-4o",
            messages=[{"role": "user", "content": "hi"}],
            mode="thinking",
            tools={},
            tool_definitions=[],
            thinking_to_answer_token=token,
            stream_yield_delay=0,
        ),
    )

    assert token not in sse
    assert prefix in sse


@pytest.mark.asyncio
async def test_tool_calls_text_end_before_tool_input_available(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_execute(*_args: object, **_kwargs: object):
        yield ("result", {"ok": True})

    monkeypatch.setattr("app.utils.stream.execute_tool_with_streaming", fake_execute)

    tool_definitions = [
        {
            "type": "function",
            "function": {
                "name": "lookup",
                "description": "test",
                "parameters": {"type": "object", "properties": {}},
            },
        },
    ]

    async def lookup_fn(**_kwargs: object) -> dict[str, bool]:
        return {"ok": True}

    tools = {
        "lookup": {"type": "tool", "function": lookup_fn},
    }

    client = _make_client(
        [
            [
                _Chunk(
                    id="tid",
                    choices=[_Choice(_Delta(content="plan "), finish_reason=None)],
                ),
                _Chunk(
                    id="tid",
                    choices=[
                        _Choice(
                            _Delta(
                                content=None,
                                tool_calls=[
                                    _ToolCallDelta(
                                        0,
                                        "call-1",
                                        _Function(name="lookup", arguments="{}"),
                                    ),
                                ],
                            ),
                            finish_reason="tool_calls",
                        ),
                    ],
                ),
            ],
            [
                _Chunk(
                    choices=[
                        _Choice(_Delta(content="Done."), finish_reason="stop"),
                    ],
                ),
            ],
        ],
    )

    sse = await _collect_sse(
        stream_text(
            client=client,
            model="openai:gpt-4o",
            messages=[{"role": "user", "content": "hi"}],
            mode="thinking",
            tools=tools,
            tool_definitions=tool_definitions,
            stream_yield_delay=0,
        ),
    )

    end = sse.find('"type":"text-end"')
    avail = sse.find('"type":"tool-input-available"')
    out = sse.find('"type":"tool-output-available"')
    assert end != -1 and avail != -1 and out != -1
    assert end < avail < out
