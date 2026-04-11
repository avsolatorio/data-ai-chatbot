import logging
import traceback

import json5

from ._client import get_mcp_client

logger = logging.getLogger(__name__)

# NOTE: Implement outputSchema for MCP tools. https://github.com/modelcontextprotocol/modelcontextprotocol/pull/371


def _normalize_mcp_tool_arguments(arguments: dict) -> dict:
    """Coerce LangChain / LLM tool-call payloads to shapes FastMCP validates on the server.

    - ``disaggregation_filters`` is often emitted as a JSON string; the MCP schema expects ``dict``.
    - ``start_year``, ``end_year``, ``limit``, ``offset`` may arrive as numeric strings.
    """
    out = {k: v for k, v in arguments.items() if v is not None}
    df_key = "disaggregation_filters"
    if df_key in out:
        df_val = out[df_key]
        if isinstance(df_val, str):
            stripped = df_val.strip()
            if not stripped:
                del out[df_key]
            else:
                try:
                    parsed = json5.loads(stripped)
                except Exception as e:
                    raise ValueError(
                        f"{df_key} must be JSON object or dict; could not parse: {df_val!r}"
                    ) from e
                if not isinstance(parsed, dict):
                    raise ValueError(
                        f"{df_key} must decode to a JSON object, got {type(parsed).__name__}"
                    )
                out[df_key] = parsed
    for ik in ("start_year", "end_year", "limit", "offset"):
        if ik not in out:
            continue
        val = out[ik]
        if isinstance(val, str):
            s = val.strip()
            if not s:
                del out[ik]
                continue
            try:
                out[ik] = int(s)
            except ValueError:
                pass
    return out


async def main():
    client = get_mcp_client()
    async with client:
        # Basic server interaction
        await client.ping()

        # List available operations
        tools = await client.list_tools()
        # resources = await client.list_resources()
        # prompts = await client.list_prompts()

        print(tools)
        # print(resources)
        # print(prompts)

        # Execute operations
        result = await client.call_tool(
            "ai4data_ai4data_mcpsearch_relevant_indicators", {"query": "malnutrition"}
        )
        print(result)

        return tools


async def get_mcp_tools():
    # {'name': 'ai4data_ai4data_mcpsearch_relevant_indicators',
    #  'title': None,
    #  'description': "Search for a shortlist of relevant indicators from the World Development Indicators (WDI) Data360 API given the query. This tool is optimized for English language queries, so try to use English for your query. If the user's query is not in English, you may need to translate it to English first. This tool is used to find indicators and does not consider any geography or time period, so you should not include any in your query. The search ranking may not be optimal, so the LLM may use this as shortlist and pick the most relevant from the list (if any). You, as an LLM, must always get at least `top_k=20` for better recall.",
    #  'inputSchema': {'type': 'object',
    #   'properties': {'query': {'type': 'string',
    #     'description': "The search query by the user or one formulated by an LLM based on the user's prompt. This query should be in English. If the user's query is not in English, you may need to translate it to English first. This tool is used to find indicators and does not consider any geography or time period, so you should not include any in your query."},
    #    'top_k': {'type': 'number',
    #     'description': 'The number of shortlisted indicators that will be returned that are semantically related to the query. IMPORTANT: You, as an LLM, must ALWAYS set this argument to at least 20.'}}},
    #  'outputSchema': None,
    #  'icons': None,
    #  'annotations': None,
    #  'meta': None}

    from app.config import get_mcp_settings

    mcp_url = get_mcp_settings().server_url
    logger.info("[mcp] get_mcp_tools start url=%s", mcp_url)
    client = get_mcp_client()
    async with client:
        logger.info("[mcp] client connected, list_tools start")
        tools = await client.list_tools()
        logger.info("[mcp] list_tools done count=%d", len(tools))

        tool_definitions = []

        for tool in tools:
            _tool = tool.model_dump()

            _tool["parameters"] = _tool.pop("inputSchema")

            tool_definitions.append(
                {
                    "type": "function",
                    "function": _tool,
                    "strict": True,
                }
            )

        return tool_definitions


async def call_mcp_tool(tool_name: str, arguments: dict, as_jsonable: bool = True):
    try:
        normalized = _normalize_mcp_tool_arguments(dict(arguments))
        client = get_mcp_client()
        async with client:
            result = await client.call_tool(tool_name, normalized)
            if as_jsonable:
                try:
                    return json5.loads(
                        result.content[0]
                        .text.lstrip("root=")
                        .replace(": None", ": null")
                        .replace(": True", ": true")
                        .replace(": False", ": false")
                        .strip()
                    )
                except Exception:
                    return result.content[0].model_dump()
            else:
                return result
    except Exception as e:
        tbck = traceback.format_exc()

        raise Exception(
            f"Error calling MCP tool {tool_name}, with arguments {arguments!r}: {str(e)}\n{tbck}"
        )
