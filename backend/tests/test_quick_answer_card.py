from app.ai.graph.nodes.quick_answer import _synthesize_card


def test_synthesize_card_point_lookup():
    # GIVEN data360_get_data output with end_year=2023 but no start_year
    tool_results = [
        {
            "tool_name": "data360_get_data",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
                "country_code": "QAT",
                "end_year": 2023,
            },
            "output": {
                "data": [
                    {
                        "OBS_VALUE": "81816.97",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "26dadb75",
                        "REF_AREA_NAME": "Qatar",
                    },
                    {
                        "OBS_VALUE": "88701.46",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2022",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "488bed5f",
                        "REF_AREA_NAME": "Qatar",
                    },
                ],
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is not None
    assert card["card_type"] == "single_fact"
    assert card["value"] == "81816.97"
    assert card["year"] == "2023"
    assert card["country_name"] == "Qatar"


def test_synthesize_card_trend_lookup():
    # GIVEN data360_get_data output with start_year=2022 and end_year=2023
    tool_results = [
        {
            "tool_name": "data360_get_data",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
                "country_code": "QAT",
                "start_year": 2022,
                "end_year": 2023,
            },
            "output": {
                "data": [
                    {
                        "OBS_VALUE": "81816.97",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "26dadb75",
                        "REF_AREA_NAME": "Qatar",
                    },
                    {
                        "OBS_VALUE": "88701.46",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2022",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "488bed5f",
                        "REF_AREA_NAME": "Qatar",
                    },
                ],
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is not None
    assert card["card_type"] == "trend"
    assert card["latest_value"] == "81816.97"
    assert card["earliest_value"] == "88701.46"
    assert card["latest_year"] == "2023"
    assert card["earliest_year"] == "2022"


def test_synthesize_card_same_start_end_year():
    # GIVEN data360_get_data output with start_year=2023 and end_year=2023 (single year point query)
    tool_results = [
        {
            "tool_name": "data360_get_data",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
                "country_code": "QAT",
                "start_year": 2023,
                "end_year": 2023,
            },
            "output": {
                "data": [
                    {
                        "OBS_VALUE": "81816.97",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "26dadb75",
                        "REF_AREA_NAME": "Qatar",
                    }
                ],
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is not None
    assert card["card_type"] == "single_fact"
    assert card["value"] == "81816.97"
    assert card["year"] == "2023"


def test_synthesize_card_only_start_year():
    # GIVEN data360_get_data output with start_year=2020 but no end_year (trend since 2020)
    tool_results = [
        {
            "tool_name": "data360_get_data",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
                "country_code": "QAT",
                "start_year": 2020,
            },
            "output": {
                "data": [
                    {
                        "OBS_VALUE": "81816.97",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "26dadb75",
                        "REF_AREA_NAME": "Qatar",
                    },
                    {
                        "OBS_VALUE": "66841.36",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2020",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "a7ffe257",
                        "REF_AREA_NAME": "Qatar",
                    },
                ],
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is not None
    assert card["card_type"] == "trend"
    assert card["latest_value"] == "81816.97"
    assert card["earliest_value"] == "66841.36"
    assert card["latest_year"] == "2023"
    assert card["earliest_year"] == "2020"


def test_synthesize_card_no_years():
    # GIVEN data360_get_data output with no start_year and no end_year (latest value lookup)
    tool_results = [
        {
            "tool_name": "data360_get_data",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
                "country_code": "QAT",
            },
            "output": {
                "data": [
                    {
                        "OBS_VALUE": "81816.97",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "26dadb75",
                        "REF_AREA_NAME": "Qatar",
                    },
                    {
                        "OBS_VALUE": "88701.46",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2022",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "488bed5f",
                        "REF_AREA_NAME": "Qatar",
                    },
                ],
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is not None
    assert card["card_type"] == "single_fact"
    assert card["value"] == "81816.97"
    assert card["year"] == "2023"


def test_synthesize_card_rank_countries_single():
    # GIVEN data360_rank_countries output with multiple countries
    tool_results = [
        {
            "tool_name": "data360_rank_countries",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_SP_POP_TOTL",
                "top_n": 10,
            },
            "output": {
                "year": "2023",
                "order": "desc",
                "rankings": [
                    {
                        "rank": 1,
                        "code": "IND",
                        "country": "India",
                        "value": 1428627663.0,
                        "claim_id": "claim_ind",
                    },
                    {
                        "rank": 2,
                        "code": "CHN",
                        "country": "China",
                        "value": 1409670000.0,
                        "claim_id": "claim_chn",
                    },
                    {
                        "rank": 3,
                        "code": "USA",
                        "country": "United States",
                        "value": 334914895.0,
                        "claim_id": "claim_usa",
                    },
                ],
                "metadata": {
                    "name": "Population, total",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is not None
    assert card["card_type"] == "single_fact"
    assert card["value"] == 1428627663.0
    assert card["year"] == "2023"
    assert card["country_name"] == "India"
    assert card["claim_id"] == "claim_ind"


def test_synthesize_card_rank_countries_comparison():
    # GIVEN data360_rank_countries output with exactly 2 countries
    tool_results = [
        {
            "tool_name": "data360_rank_countries",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_SP_POP_TOTL",
                "top_n": 2,
            },
            "output": {
                "year": "2023",
                "order": "desc",
                "rankings": [
                    {
                        "rank": 1,
                        "code": "IND",
                        "country": "India",
                        "value": 1428627663.0,
                        "claim_id": "claim_ind",
                    },
                    {
                        "rank": 2,
                        "code": "CHN",
                        "country": "China",
                        "value": 1409670000.0,
                        "claim_id": "claim_chn",
                    },
                ],
                "metadata": {
                    "name": "Population, total",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is not None
    assert card["card_type"] == "comparison"
    assert card["year"] == "2023"
    assert len(card["entries"]) == 2
    assert card["entries"][0]["country_name"] == "India"
    assert card["entries"][1]["country_name"] == "China"
    assert card["delta"] == 1428627663.0 - 1409670000.0


def test_research_node_does_not_synthesize_card(monkeypatch):
    """research_node must NOT synthesize a quick_answer_card.

    Card synthesis is the exclusive responsibility of quick_answer_node.
    Emitting a card from the research path caused a fact card to appear
    alongside the narrator's visualization (double-render bug).
    """
    from unittest.mock import Mock

    import app.ai.graph.nodes.research as research_mod
    from app.ai.graph.nodes.research import research_node
    from app.ai.graph.state import ChatPipelineState

    # Mock tool loop returns
    monkeypatch.setattr(research_mod, "get_chat_llm", lambda *args, **kwargs: Mock())
    monkeypatch.setattr(research_mod, "openai_to_langchain", lambda *args, **kwargs: [])
    monkeypatch.setattr(research_mod, "trim_for_node", lambda *args, **kwargs: [])

    tool_results = [
        {
            "tool_name": "data360_get_data",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
                "country_code": "QAT",
                "end_year": 2023,
            },
            "output": {
                "data": [
                    {
                        "OBS_VALUE": "81816.97",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "26dadb75",
                        "REF_AREA_NAME": "Qatar",
                    }
                ],
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    async def mock_run_tool_loop(*args, **kwargs):
        return "final content", {}, tool_results

    monkeypatch.setattr(research_mod, "run_tool_loop", mock_run_tool_loop)

    mock_tool = Mock()
    mock_tool.name = "mock_tool"
    state: ChatPipelineState = {
        "query_text": "GDP of Qatar",
        "openai_messages": [],
        "session_summary": "",
        "model_type": "chat",
        "tool_set": {"mcp_data": {"langchain_tools": [mock_tool]}},
    }

    # Run node
    import pytest

    res = pytest.mark.anyio(research_node)(state)
    import asyncio

    loop = asyncio.get_event_loop()
    out = loop.run_until_complete(res)

    assert out is not None
    assert out["research_packet"] == "final content"
    assert out["research_tool_results"] == tool_results
    # Card synthesis must NOT happen in research_node — only in quick_answer_node.
    assert "quick_answer_card" not in out, (
        "research_node must not emit quick_answer_card; card synthesis is "
        "exclusive to quick_answer_node to prevent fact-card + visualization double-render."
    )


def test_synthesize_card_get_data_multi_country_skips():
    # GIVEN data360_get_data output with 3 countries
    tool_results = [
        {
            "tool_name": "data360_get_data",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
            },
            "output": {
                "data": [
                    {
                        "OBS_VALUE": "81816.97",
                        "REF_AREA": "QAT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "c1",
                        "REF_AREA_NAME": "Qatar",
                    },
                    {
                        "OBS_VALUE": "65000.0",
                        "REF_AREA": "ARE",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "c2",
                        "REF_AREA_NAME": "UAE",
                    },
                    {
                        "OBS_VALUE": "55000.0",
                        "REF_AREA": "KWT",
                        "TIME_PERIOD": "2023",
                        "UNIT_MEASURE": "USD",
                        "claim_id": "c3",
                        "REF_AREA_NAME": "Kuwait",
                    },
                ],
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    card = _synthesize_card(tool_results)
    assert card is None


def test_synthesize_card_compare_countries_anchor():
    # GIVEN data360_compare_countries output for Mexico, Argentina, Brazil
    tool_results = [
        {
            "tool_name": "data360_compare_countries",
            "tool_args": {
                "database_id": "WB_WDI",
                "indicator_id": "WB_WDI_NY_GDP_PCAP_CD",
            },
            "output": {
                "snapshot": {
                    "year": 2024,
                    "rankings": [
                        {
                            "code": "MEX",
                            "country": "Mexico",
                            "value": 13988.04,
                            "claim_id": "c_mex",
                        },
                        {
                            "code": "ARG",
                            "country": "Argentina",
                            "value": 13969.78,
                            "claim_id": "c_arg",
                        },
                        {
                            "code": "BRA",
                            "country": "Brazil",
                            "value": 10310.55,
                            "claim_id": "c_bra",
                        },
                    ],
                },
                "metadata": {
                    "name": "GDP per capita (current US$)",
                    "database_id": "WB_WDI",
                    "database_name": "World Development Indicators (WDI)",
                },
            },
        }
    ]

    # CASE 1: Query anchors on Brazil
    card = _synthesize_card(
        tool_results, query_text="Compare GDP per capita in Brazil with Argentina and Mexico"
    )
    assert card is not None
    assert card["card_type"] == "comparison"
    assert len(card["entries"]) == 3
    assert card["entries"][0]["country_name"] == "Brazil"  # anchor should be first!
    assert card["entries"][1]["country_name"] == "Mexico"  # the next one in descending order
    assert card["entries"][2]["country_name"] == "Argentina"
    assert card["delta"] == 10310.55 - 13988.04  # Brazil (10310.55) - Mexico (13988.04) = -3677.49

    # CASE 2: Query anchors on Argentina
    card = _synthesize_card(tool_results, query_text="Argentina compared to others")
    assert card is not None
    assert card["entries"][0]["country_name"] == "Argentina"
    assert card["entries"][1]["country_name"] == "Mexico"
    assert card["entries"][2]["country_name"] == "Brazil"
    assert card["delta"] == 13969.78 - 13988.04  # Argentina (13969.78) - Mexico (13988.04) = -18.26

    # CASE 3: No anchor (should default to descending order)
    card = _synthesize_card(tool_results, query_text="Compare these three countries")
    assert card is not None
    assert card["entries"][0]["country_name"] == "Mexico"
    assert card["entries"][1]["country_name"] == "Argentina"
    assert card["entries"][2]["country_name"] == "Brazil"
    assert card["delta"] == 13988.04 - 13969.78  # Max (Mexico) - Second (Argentina)
