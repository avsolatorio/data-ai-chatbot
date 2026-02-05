import json
import logging
from typing import Any, Dict, List, Literal

from app.ai.client import get_async_ai_client

logger = logging.getLogger(__name__)


async def check_intent(messages: List[Dict[str, Any]]) -> Literal["RESEARCH", "DIRECT"]:
    """
    Analyzes the user's latest message and conversation context to determine
    if it requires the Research Planner (Data360 tools) or can be handled
    via Direct Chat (Fast-Path).
    """

    # We use gpt-4o-mini for fast routing
    client = get_async_ai_client()

    system_prompt = """You are a high-speed intent router for a World Bank data assistant.
Your job is to determine if the user's latest message requires specialized Data360 research or is just general conversation.

CATEGORIES:
1. RESEARCH: Choose this if the user asks for:
   - Specific data, statistics, or indicators (GDP, population, spending, etc.)
   - Comparisons between countries or regions.
   - Charts, visualizations, or "last X years" of data.
   - Anything requiring the World Bank / Data360 database.

2. DIRECT: Choose this if the user is:
   - Greeting you (Hello, Hi, Hey).
   - Asking "How are you?" or other small talk.
   - Asking a general follow-up that DOES NOT need new data (e.g. "Explain that last point," "What do you mean by X?").
   - Complimenting or thanking you.

OUTPUT FORMAT:
Return ONLY a JSON object:
{"intent": "RESEARCH" | "DIRECT", "reasoning": "brief explanation"}
"""

    try:
        # We only need the last few messages for intent
        recent_history = messages[-3:] if len(messages) > 3 else messages

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, *recent_history],
            response_format={"type": "json_object"},
            temperature=0,
            max_tokens=50,
            stream=False,
        )

        result = json.loads(response.choices[0].message.content)
        intent = result.get("intent", "RESEARCH")
        reasoning = result.get("reasoning", "")

        logger.info("Intent Routing: %s (Reason: %s)", intent, reasoning)
        return intent

    except Exception as e:
        logger.error("Error in intent routing: %s. Defaulting to RESEARCH.", str(e))
        return "RESEARCH"
