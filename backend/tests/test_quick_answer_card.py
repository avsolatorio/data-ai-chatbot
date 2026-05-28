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
