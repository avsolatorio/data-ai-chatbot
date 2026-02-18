from agents import Agent
from pydantic import BaseModel

from app.ai.tools.weather import get_weather


class ThinkingPart(BaseModel):
    type: str
    content: str
    tool_name: str
    tool_input: str
    tool_output: str
    tool_error: str
    tool_error_type: str
    tool_error_message: str
    tool_error_traceback: str


class ThinkingEvent(BaseModel):
    name: str
    description: str
    parts: list[ThinkingPart]


thinking_agent = Agent(
    name="Thinking agent",
    instructions="Plan the steps necessary to complete the user's request in a reflective manner.",
    output_type=ThinkingEvent,
)

thinking_agent.add_tool(get_weather)
