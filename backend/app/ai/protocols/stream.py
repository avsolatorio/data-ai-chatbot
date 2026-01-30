from __future__ import annotations

from typing import Annotated, Any, Literal, Optional, Union

from pydantic import BaseModel, Field, TypeAdapter, model_validator

# =========================
# Base
# =========================

# Prevent ruff from complaining about the protocol's naming conventions
# ruff: noqa: N815


class StreamPart(BaseModel):
    type: str

    def to_sse(self) -> str:
        return f"data: {self.model_dump_json(exclude_none=True)}\n\n"


class DoneMarker(BaseModel):
    def to_sse(self) -> str:
        return "data: [DONE]\n\n"


# =========================
# Message lifecycle
# =========================


class MessageStartPart(StreamPart):
    type: Literal["start"] = "start"
    messageId: str


class FinishMessagePart(StreamPart):
    type: Literal["finish"] = "finish"
    messageMetadata: Optional[dict[str, Any]] = None


class AbortPart(StreamPart):
    type: Literal["abort"] = "abort"
    reason: str


class ErrorPart(StreamPart):
    type: Literal["error"] = "error"
    errorText: str


# =========================
# Text
# =========================


class TextStartPart(StreamPart):
    type: Literal["text-start"] = "text-start"
    id: str


class TextDeltaPart(StreamPart):
    type: Literal["text-delta"] = "text-delta"
    id: str
    delta: str


class TextEndPart(StreamPart):
    type: Literal["text-end"] = "text-end"
    id: str


# =========================
# Reasoning
# =========================


class ReasoningStartPart(StreamPart):
    type: Literal["reasoning-start"] = "reasoning-start"
    id: str


class ReasoningDeltaPart(StreamPart):
    type: Literal["reasoning-delta"] = "reasoning-delta"
    id: str
    delta: str


class ReasoningEndPart(StreamPart):
    type: Literal["reasoning-end"] = "reasoning-end"
    id: str


# =========================
# Sources
# =========================


class SourceUrlPart(StreamPart):
    type: Literal["source-url"] = "source-url"
    sourceId: str
    url: str


class SourceDocumentPart(StreamPart):
    type: Literal["source-document"] = "source-document"
    sourceId: str
    mediaType: str
    title: str


# =========================
# Files
# =========================


class FilePart(StreamPart):
    type: Literal["file"] = "file"
    url: str
    mediaType: str


# =========================
# Tools
# =========================


class ToolInputStartPart(StreamPart):
    type: Literal["tool-input-start"] = "tool-input-start"
    toolCallId: str
    toolName: str


class ToolInputDeltaPart(StreamPart):
    type: Literal["tool-input-delta"] = "tool-input-delta"
    toolCallId: str
    inputTextDelta: str


class ToolInputAvailablePart(StreamPart):
    type: Literal["tool-input-available"] = "tool-input-available"
    toolCallId: str
    toolName: str
    input: Any


class ToolOutputAvailablePart(StreamPart):
    type: Literal["tool-output-available"] = "tool-output-available"
    toolCallId: str
    output: Any


class ToolInputErrorPart(StreamPart):
    type: Literal["tool-input-error"] = "tool-input-error"
    toolCallId: str
    toolName: str
    input: Any = None
    errorText: str


class ToolOutputErrorPart(StreamPart):
    type: Literal["tool-output-error"] = "tool-output-error"
    toolCallId: str
    toolName: Optional[str] = None
    errorText: str


# =========================
# Steps
# =========================


class StartStepPart(StreamPart):
    type: Literal["start-step"] = "start-step"


class FinishStepPart(StreamPart):
    type: Literal["finish-step"] = "finish-step"


# =========================
# Usage / finish metadata
# =========================


class UsagePart(StreamPart):
    type: Literal["usage"] = "usage"
    usage: Any


# =========================
# Custom data (data-*)
# =========================


class DataThinkingPart(StreamPart):
    """SSE envelope for thinking stream: type=data-thinking, id, data."""

    type: Literal["data-thinking"] = "data-thinking"
    id: str
    data: Any


class DataPart(StreamPart):
    type: str
    data: Any

    @model_validator(mode="after")
    def _validate_type(self):
        if not self.type.startswith("data-"):
            raise ValueError("DataPart.type must start with 'data-'")
        return self

    @property
    def data_kind(self) -> str:
        return self.type[len("data-") :]


# =========================
# Discriminated union
# =========================

KnownPart = Annotated[
    Union[
        MessageStartPart,
        FinishMessagePart,
        AbortPart,
        ErrorPart,
        TextStartPart,
        TextDeltaPart,
        TextEndPart,
        ReasoningStartPart,
        ReasoningDeltaPart,
        ReasoningEndPart,
        SourceUrlPart,
        SourceDocumentPart,
        FilePart,
        ToolInputStartPart,
        ToolInputDeltaPart,
        ToolInputAvailablePart,
        ToolOutputAvailablePart,
        ToolInputErrorPart,
        ToolOutputErrorPart,
        StartStepPart,
        FinishStepPart,
        UsagePart,
    ],
    Field(discriminator="type"),
]


StreamPartUnion = Union[KnownPart, DataPart]


# =========================
# Parser / dispatcher
# =========================

_known_part_adapter: TypeAdapter[KnownPart] = TypeAdapter(KnownPart)


def parse_stream_part(obj: dict) -> StreamPartUnion:
    t = obj.get("type")
    if isinstance(t, str) and t.startswith("data-"):
        return DataPart.model_validate(obj)
    return _known_part_adapter.validate_python(obj)


# =========================
# SSE emission helper
# =========================


def part_to_sse(
    part: StreamPart,
    mode: Literal["thinking", "chat"] = "chat",
    thinking_id: Optional[str] = None,
) -> str:
    """
    Serialize a stream part to SSE. In thinking mode, wrap in DataThinkingPart.
    """
    if mode == "thinking":
        envelope = DataThinkingPart(id=thinking_id or "", data=part.model_dump(exclude_none=True))
        return envelope.to_sse()
    return part.to_sse()
