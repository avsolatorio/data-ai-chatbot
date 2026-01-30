"""Stream event processing for chat streaming."""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Literal, Optional
from uuid import UUID, uuid4

from app.ai.protocols.stream import (
    TEXT_STATE_DONE,
    TOOL_STATE_INPUT_AVAILABLE,
    TOOL_STATE_OUTPUT_AVAILABLE,
    DoneMarker,
    ErrorPart,
    FinishMessagePart,
)
from app.utils.stream import stream_text

logger = logging.getLogger(__name__)


class StreamEventProcessor:
    """Processes stream events and builds assistant messages."""

    def __init__(self, chat_id: UUID, mode: Literal["thinking", "chat"]):
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

    def _append_to_message_parts_buffer(self, part: Dict[str, Any]) -> None:
        """Append a part to the message parts buffer.

        If mode is "thinking", the part is converted to a "data-thinking" part, which reverses the conversion made in the `_process_event_data` method for the "data-thinking" event.
        """
        if self.mode == "thinking":
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
        """Handle 'data-usage' event."""
        self._append_to_message_parts_buffer(data)

    def _handle_finish_event(self, data: Dict[str, Any]) -> None:
        """Handle 'finish' event - finalize message and track usage."""
        # Finalize any pending text part before saving the message
        # This handles cases where text-end event wasn't emitted (e.g., when finish_reason is tool_calls)
        self._finalize_pending_text_part()

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

        # Track usage
        metadata = data.get("messageMetadata", {})
        usage = metadata.get("usage")
        if usage:
            self.final_usage = usage["data"]

    def _process_event_data(self, data: Dict[str, Any]) -> None:
        """Process a parsed event data dictionary."""
        event_type = data.get("type")

        if self.mode == "thinking":
            # Remove "thinking-" prefix from event type
            event_type = data.get("data", {}).get("type", "")
            data = data.get("data", {})

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

    async def process_stream(
        self,
        client: Any,
        model: str,
        messages: List[Dict[str, Any]],
        system: Optional[str],
        tools: Dict[str, Any],
        tool_definitions: List[Dict[str, Any]],
    ) -> AsyncIterator[bytes]:
        """
        Process stream events and yield bytes for StreamingResponse.
        Returns assistant messages and usage via instance attributes.
        """
        logger.info("=== STREAM GENERATOR STARTED ===")

        try:
            logger.info("Starting stream_text iteration...")
            async for event in stream_text(
                client=client,
                model=model,
                messages=messages,
                system=system,
                mode=self.mode,
                tools=tools,
                tool_definitions=tool_definitions,
                temperature=0.7,
                max_tool_turns=5,
            ):
                # Convert string to bytes for FastAPI StreamingResponse
                if isinstance(event, str):
                    event_bytes = event.encode("utf-8")
                else:
                    event_bytes = event

                # Parse SSE event to extract data (only if it's a string)
                if isinstance(event, str) and event.startswith("data: "):
                    data_str = event[6:].strip()
                    if data_str == "[DONE]":
                        logger.info(
                            "Stream: yielding [DONE], then closing (client should see status=ready)"
                        )
                        yield event_bytes
                        await asyncio.sleep(0)  # Give event loop a chance to flush
                        break

                    try:
                        data = json.loads(data_str)
                        self._process_event_data(data)
                        yield event_bytes
                        await asyncio.sleep(0)  # Give event loop a chance to flush
                    except json.JSONDecodeError:
                        # Not JSON, yield as-is
                        yield event_bytes
                        await asyncio.sleep(0)
                else:
                    yield event_bytes
                    await asyncio.sleep(0)

            logger.info(
                "=== STREAM GENERATOR ENDED with assistant messages: %d message(s) ===",
                len(self.assistant_messages),
            )
            logger.info("assistant messages to save: %s", self.assistant_messages)

        except GeneratorExit:
            # Generator is being closed by client, re-raise to allow cleanup
            raise
        except Exception as stream_error:
            # Log the error and send error event, then ensure stream closes properly
            import traceback

            stack_trace = traceback.format_exc()

            error_msg = f"Error in stream: {str(stream_error)}\n{stack_trace}"
            logger.error("Error in stream: %s", error_msg, exc_info=True)
            try:
                yield ErrorPart(errorText=error_msg).to_sse().encode("utf-8")
                yield FinishMessagePart().to_sse().encode("utf-8")
                yield DoneMarker().to_sse().encode("utf-8")
            except Exception:
                # If we can't yield, connection is likely closed
                pass
