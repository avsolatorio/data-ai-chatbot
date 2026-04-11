"""Stream event processing for chat streaming.

Usage tracking: Token usage is not emitted to the frontend as a "data-usage" event
or message part. The processor only sets final_usage from finish/data-usage events;
the API then updates chat.lastContext (byMessageId) in a background task. The frontend
relies on lastContext for per-message and full-chat usage (with stream usage for the
current response until refetch).
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID, uuid4

from app.ai.protocols.stream import (
    TEXT_STATE_DONE,
    TOOL_STATE_INPUT_AVAILABLE,
    TOOL_STATE_OUTPUT_AVAILABLE,
)

StreamProcessorMode = Literal["thinking", "chat", "unified"]

logger = logging.getLogger(__name__)


class StreamEventProcessor:
    """Processes stream events and builds assistant messages."""

    def __init__(self, chat_id: UUID, mode: StreamProcessorMode):
        self.chat_id = chat_id
        self.mode = mode
        self.current_part: Dict[str, Any] = {}  # current text part only
        self.current_tool_parts: Dict[
            str, Dict[str, Any]
        ] = {}  # toolCallId -> part (multiple interleaved tools)
        self.message_parts_buffer: List[Dict[str, Any]] = []
        self.assistant_messages: List[Dict[str, Any]] = []
        self.final_usage: Optional[Dict[str, Any]] = None
        self.current_message_id = str(uuid4())
        # For mode "unified": True while processing a data-thinking envelope
        self._current_event_is_thinking: bool = False

    def _append_to_message_parts_buffer(self, part: Dict[str, Any]) -> None:
        """Append a part to the message parts buffer.

        In "thinking" mode (or "unified" when the event was data-thinking), the part
        is wrapped as "data-thinking". In "chat" or plain "unified" events, append as-is.
        """
        wrap = (
            self._current_event_is_thinking if self.mode == "unified" else (self.mode == "thinking")
        )
        if wrap:
            part = {"type": "data-thinking", "id": self.current_message_id, "data": part}
        self.message_parts_buffer.append(part)

    def _handle_start_event(self, data: Dict[str, Any]) -> None:
        """Handle 'start' event - initialize new message."""
        self.current_message_id = str(uuid4())
        self.current_tool_parts.clear()

    def _handle_start_step_event(self, data: Dict[str, Any]) -> None:
        """Handle 'start-step' event."""
        self._append_to_message_parts_buffer({"type": "step-start"})

    def _handle_text_start_event(self, data: Dict[str, Any]) -> None:
        """Handle 'text-start' event - initialize text part."""
        self.current_part = {
            "type": "text",
            "text": "",
            "state": "",
            "providerMetadata": {"openai": {"itemId": data.get("id")}},
        }

    def _handle_text_delta_event(self, data: Dict[str, Any]) -> None:
        """Handle 'text-delta' event - accumulate text."""
        self.current_part["text"] += data.get("delta", "")

    def _handle_text_end_event(self, data: Dict[str, Any]) -> None:
        """Handle 'text-end' event - finalize text part."""
        if self.current_part and self.current_message_id:
            self.current_part["state"] = TEXT_STATE_DONE
            self._append_to_message_parts_buffer(self.current_part)
            self.current_part = {}

    def _finalize_pending_text_part(self) -> None:
        """Finalize any pending text part before starting a new part type."""
        if (
            self.current_part
            and self.current_part.get("type") == "text"
            and self.current_message_id
            and self.current_part.get("text", "")
        ):
            # Text part exists but hasn't been finalized - finalize it now
            self.current_part["state"] = TEXT_STATE_DONE
            self._append_to_message_parts_buffer(self.current_part)
            self.current_part = {}

    def _handle_tool_input_start_event(self, data: Dict[str, Any]) -> None:
        """Handle 'tool-input-start' event - initialize tool part (by toolCallId for interleaved calls)."""
        self._finalize_pending_text_part()

        tool_call_id = data.get("toolCallId")
        if not tool_call_id:
            return
        self.current_tool_parts[tool_call_id] = {
            "type": "tool-" + data.get("toolName", ""),
            "toolCallId": tool_call_id,
            "state": "",
            "input": {},
            "output": {},
            "callProviderMetadata": {"openai": {"itemId": tool_call_id}},
        }

    def _handle_tool_input_error_event(self, data: Dict[str, Any]) -> None:
        """Handle 'tool-input-error' event."""
        tool_call_id = data.get("toolCallId")
        if not tool_call_id:
            return
        part = self.current_tool_parts.get(tool_call_id)
        if not part:
            part = {
                "type": "tool-" + data.get("toolName", "unknown"),
                "toolCallId": tool_call_id,
                "state": TOOL_STATE_INPUT_AVAILABLE,
                "input": {"error": data.get("errorText", "Unknown error")},
                "output": {},
                "callProviderMetadata": {"openai": {"itemId": tool_call_id}},
            }
        else:
            part["state"] = TOOL_STATE_INPUT_AVAILABLE
            part["input"]["error"] = data.get("errorText", "Unknown error")
        self._append_to_message_parts_buffer(part)
        self.current_tool_parts.pop(tool_call_id, None)

    def _handle_tool_input_available_event(self, data: Dict[str, Any]) -> None:
        """Handle 'tool-input-available' event."""
        tool_call_id = data.get("toolCallId")
        if not tool_call_id:
            return
        part = self.current_tool_parts.get(tool_call_id)
        if part:
            part["input"] = data.get("input", {})
            part["state"] = TOOL_STATE_INPUT_AVAILABLE

    def _handle_tool_output_error_event(self, data: Dict[str, Any]) -> None:
        """Handle 'tool-output-error' event."""
        tool_call_id = data.get("toolCallId")
        if not tool_call_id:
            return
        part = self.current_tool_parts.get(tool_call_id)
        if part:
            part["state"] = TOOL_STATE_OUTPUT_AVAILABLE
            part["output"]["error"] = data.get("errorText", "Unknown error")
            self._append_to_message_parts_buffer(part)
            self.current_tool_parts.pop(tool_call_id, None)

    def _handle_tool_output_available_event(self, data: Dict[str, Any]) -> None:
        """Handle 'tool-output-available' event."""
        tool_call_id = data.get("toolCallId")
        if not tool_call_id:
            return
        part = self.current_tool_parts.get(tool_call_id)
        if part:
            part["output"] = data.get("output", {})
            part["state"] = TOOL_STATE_OUTPUT_AVAILABLE
            self._append_to_message_parts_buffer(part)
            self.current_tool_parts.pop(tool_call_id, None)

    def _handle_data_usage_event(self, data: Dict[str, Any]) -> None:
        """Handle 'data-usage' event. Usage is stored in final_usage for lastContext only (not emitted as a message part)."""
        # Payload may be full envelope {"type": "data-usage", "data": {...}} or just {...}
        inner = data.get("data") if isinstance(data.get("data"), dict) else None
        usage_data = inner if inner is not None else data
        if usage_data:
            self.final_usage = usage_data

    def _handle_finish_event(self, data: Dict[str, Any]) -> None:
        """Handle 'finish' event - finalize message and track usage for lastContext (not emitted as a message part)."""
        # Finalize any pending text part before saving the message
        # This handles cases where text-end event wasn't emitted (e.g., when finish_reason is tool_calls)
        self._finalize_pending_text_part()

        # Extract usage from finish messageMetadata for lastContext only (see module docstring).
        metadata = data.get("messageMetadata", {})
        usage = metadata.get("usage")
        if usage:
            usage_data = usage.get("data") if isinstance(usage.get("data"), dict) else usage
            self.final_usage = usage_data

        if self.message_parts_buffer and self.current_message_id:
            self.assistant_messages.append(
                {
                    "id": self.current_message_id,
                    "role": "assistant",
                    "parts": self.message_parts_buffer,
                    "createdAt": datetime.utcnow(),
                    "attachments": [],
                    "chatId": str(self.chat_id),
                }
            )

    def _process_event_data(self, data: Dict[str, Any]) -> None:
        """Process a parsed event data dictionary."""
        event_type = data.get("type")

        if self.mode == "unified" and event_type == "data-thinking":
            self._current_event_is_thinking = True
            try:
                data = data.get("data", {}) or {}
                event_type = data.get("type", "")
                self._dispatch_event(event_type, data)
            finally:
                self._current_event_is_thinking = False
            return

        if self.mode == "thinking":
            # Inner stream events use {"type": "data-thinking", "data": {...}}; lifecycle
            # events may also arrive top-level (finish, data-usage) like chat mode.
            if event_type in ("finish", "data-usage"):
                self._dispatch_event(event_type, data)
                return
            event_type = data.get("data", {}).get("type", "")
            data = data.get("data", {})

        self._dispatch_event(event_type, data)

    def _dispatch_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Dispatch to the handler for the given event type."""
        event_handlers = {
            "start": self._handle_start_event,
            "start-step": self._handle_start_step_event,
            "text-start": self._handle_text_start_event,
            "text-delta": self._handle_text_delta_event,
            "text-end": self._handle_text_end_event,
            "tool-input-start": self._handle_tool_input_start_event,
            "tool-input-error": self._handle_tool_input_error_event,
            "tool-input-available": self._handle_tool_input_available_event,
            "tool-output-error": self._handle_tool_output_error_event,
            "tool-output-available": self._handle_tool_output_available_event,
            "data-usage": self._handle_data_usage_event,
            "finish": self._handle_finish_event,
        }

        handler = event_handlers.get(event_type)
        if handler:
            handler(data)
