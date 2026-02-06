import json
import logging
import re
from typing import Any, Dict, List
from urllib.parse import urljoin, urlparse

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.utils.file_handler import extract_file_id_from_url, get_file_base64

logger = logging.getLogger(__name__)

# Strip [ref:messageId] from "Ask about this" messages so the model doesn't see it.
# Stored messages keep the ref so the frontend can scroll to/highlight the source.
REF_STRIP_PATTERN = re.compile(r"\n\n\[ref:[^\]]+\]\n\n")


def strip_ref_from_regarding_text(text: str) -> str:
    return REF_STRIP_PATTERN.sub("\n\n", text)


async def convert_messages_to_openai_format(
    messages: List[Dict[str, Any]], db: AsyncSession
) -> List[Dict[str, Any]]:
    """
    Convert messages from database format to OpenAI format.
    Handles both text and file parts, and expands multi-part assistant messages
    (which may contain tool calls and results) into sequential OpenAI turns.
    """
    openai_messages = []

    for msg in messages:
        role = msg["role"]
        parts = msg.get("parts", [])

        if role == "user":
            content = []
            for part in parts:
                if part.get("type") == "text":
                    raw_text = part.get("text", "")
                    text_for_model = strip_ref_from_regarding_text(raw_text)
                    content.append({"type": "text", "text": text_for_model})
                elif part.get("type") == "file":
                    file_url = part.get("url", "")
                    file_name = part.get("name", "file")
                    media_type = part.get("mediaType") or part.get(
                        "contentType", "application/octet-stream"
                    )
                    is_image = media_type.startswith("image/")
                    is_pdf = media_type == "application/pdf"
                    file_id = extract_file_id_from_url(file_url)

                    if file_id:
                        base64_data = await get_file_base64(file_id, db)
                        if base64_data:
                            if is_pdf:
                                content.append(
                                    {
                                        "type": "file",
                                        "file": {"filename": file_name, "file_data": base64_data},
                                    }
                                )
                            elif is_image:
                                content.append(
                                    {"type": "image_url", "image_url": {"url": base64_data}}
                                )
                            else:
                                content.append(
                                    {
                                        "type": "file",
                                        "file": {"filename": file_name, "file_data": base64_data},
                                    }
                                )
                        else:
                            parsed = urlparse(file_url)
                            if not (parsed.scheme and parsed.netloc):
                                file_url = urljoin(settings.NEXTJS_URL.rstrip("/"), file_url)
                            if is_image:
                                content.append(
                                    {"type": "image_url", "image_url": {"url": file_url}}
                                )
                    else:
                        parsed = urlparse(file_url)
                        if not (parsed.scheme and parsed.netloc):
                            file_url = urljoin(settings.NEXTJS_URL.rstrip("/"), file_url)
                        if is_image:
                            content.append({"type": "image_url", "image_url": {"url": file_url}})

            if content:
                openai_messages.append({"role": "user", "content": content})

        elif role == "assistant":
            # Assistant messages can be complex, containing thinking text, tool calls, and final responses.
            # We expand them into: [Assistant(tool_calls), Tool(result), Assistant(text), ...]

            pending_tool_calls = []
            pending_tool_results = []
            current_text_content = []

            for part in parts:
                part_type = part.get("type")

                if part_type == "text":
                    # If we have tool calls pending, we MUST flush them before text
                    if pending_tool_calls:
                        openai_messages.append(
                            {
                                "role": "assistant",
                                "content": current_text_content if current_text_content else None,
                                "tool_calls": pending_tool_calls,
                            }
                        )
                        pending_tool_calls = []
                        current_text_content = []
                        # Flush tool results immediately after assistant call
                        for res in pending_tool_results:
                            openai_messages.append(res)
                        pending_tool_results = []

                    text = part.get("text", "")
                    if text:
                        current_text_content.append({"type": "text", "text": text})

                elif part_type == "data-thinking":
                    data = part.get("data", {})
                    # Check for tool call in data-thinking part
                    if "toolCallId" in data:
                        tool_call_id = data["toolCallId"]
                        tool_name = data.get("type", "").replace("tool-", "")
                        tool_input = data.get("input", {})

                        pending_tool_calls.append(
                            {
                                "id": tool_call_id,
                                "type": "function",
                                "function": {
                                    "name": tool_name,
                                    "arguments": json.dumps(tool_input),
                                },
                            }
                        )

                        # Add any available output as a pending tool result
                        if "output" in data:
                            pending_tool_results.append(
                                {
                                    "role": "tool",
                                    "tool_call_id": tool_call_id,
                                    "content": json.dumps(data["output"]),
                                }
                            )

                    # Also extract thinking text if present
                    elif data.get("type") == "text":
                        text = data.get("text", "")
                        if text:
                            current_text_content.append({"type": "text", "text": text})

            # Final flush of tool calls if any
            if pending_tool_calls:
                openai_messages.append(
                    {
                        "role": "assistant",
                        "content": current_text_content if current_text_content else None,
                        "tool_calls": pending_tool_calls,
                    }
                )
                # Flush tool results
                for res in pending_tool_results:
                    openai_messages.append(res)
                # Reset
                current_text_content = []

            # Final assistant text part
            if current_text_content:
                openai_messages.append({"role": "assistant", "content": current_text_content})

        elif role == "tool":
            # Although the DB merges them into assistant messages, we should still handle
            # explicit tool messages if they ever appear.
            tool_call_id = msg.get("tool_call_id")
            tool_content = msg.get("content", "")
            if not tool_content:
                for part in parts:
                    if part.get("type") == "text":
                        tool_content += part.get("text", "")
                    elif part.get("type") == "tool-result":
                        tool_content = json.dumps(part.get("result", {}))

            openai_messages.append(
                {"role": "tool", "tool_call_id": tool_call_id, "content": tool_content}
            )

    logger.info("Converted %d messages to OpenAI format", len(openai_messages))
    # Log a simplified version for debugging
    for i, m in enumerate(openai_messages):
        content_preview = str(m.get("content"))[:200] + "..." if m.get("content") else "No content"
        logger.debug(
            "Msg %d: role=%s, content=%s, tool_calls=%s",
            i,
            m["role"],
            content_preview,
            "Yes" if m.get("tool_calls") else "No",
        )

    return openai_messages
