import json
import logging
from typing import Any, Dict, List, Tuple

from app.ai.client import get_async_ai_client
from app.ai.prompts import get_routing_system_prompt
from app.config import IntentType, settings

logger = logging.getLogger(__name__)


async def check_intent(messages: List[Dict[str, Any]]) -> Tuple[IntentType, str]:
    """
    Analyzes the user's latest message and conversation context to determine
    if it requires the Research Planner (Data360 tools) or can be handled
    via Direct Chat (Fast-Path).

    Returns:
        (intent, reasoning): intent and a brief explanation for the frontend.
    """

    # We use gpt-4o-mini for fast routing
    client = get_async_ai_client()

    system_prompt = get_routing_system_prompt()

    try:
        # We only need the last few messages for intent
        limit = settings.ROUTING_HISTORY_LIMIT
        if len(messages) > limit:
            recent_history = messages[-limit:]
        else:
            recent_history = messages

        response = await client.chat.completions.create(
            model=settings.ROUTING_MODEL,
            messages=[{"role": "system", "content": system_prompt}, *recent_history],
            response_format={"type": "json_object"},
            temperature=0,
            max_tokens=50,
            stream=False,
        )

        result = json.loads(response.choices[0].message.content)
        intent = IntentType(result.get("intent", IntentType.RESEARCH))
        reasoning = result.get("reasoning", "").strip()

        logger.info("Intent Routing: %s (Reason: %s)", intent, reasoning)
        return (intent, reasoning)

    except Exception as e:
        logger.error("Error in intent routing: %s. Defaulting to RESEARCH.", str(e))
        return (IntentType.RESEARCH, "")
