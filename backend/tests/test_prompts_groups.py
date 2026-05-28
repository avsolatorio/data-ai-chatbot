from app.ai.prompts import (
    get_research_agent_system_prompt,
    get_scout_system_prompt,
    get_system_prompt,
)
from app.ai.utils.geo_utils import REGION_TO_CODES
from app.config import ModelType


def test_asean_includes_tls():
    """Verify that Timor-Leste (TLS) is included in the ASEAN list in geo_utils."""
    assert "TLS" in REGION_TO_CODES["asean"]
    assert (
        REGION_TO_CODES["asean"].index("TLS") == len(REGION_TO_CODES["asean"]) - 2
    )  # Alphabetical ordering


def test_research_agent_prompt_injects_region_codes():
    """Verify that get_research_agent_system_prompt injects the dynamic codes."""
    prompt = get_research_agent_system_prompt()
    asean_str = ", ".join(REGION_TO_CODES["asean"])
    g7_str = ", ".join(REGION_TO_CODES["g7"])
    brics_str = ", ".join(REGION_TO_CODES["brics"])

    assert f"ASEAN: {asean_str}" in prompt
    assert f"G7: {g7_str}" in prompt
    assert f"BRICS: {brics_str}" in prompt
    assert "TLS" in prompt


def test_scout_prompt_injects_asean_codes():
    """Verify that get_scout_system_prompt injects the dynamic ASEAN codes."""
    prompt = get_scout_system_prompt()
    asean_str = ", ".join(REGION_TO_CODES["asean"])

    assert f"ASEAN: {asean_str}" in prompt
    assert "TLS" in prompt


def test_system_prompt_mismatch_rules():
    """Verify that get_system_prompt contains the expected year mismatch rules."""
    # Test full mode prompt
    full_prompt = get_system_prompt(selected_chat_model=ModelType.CHAT_MODEL, response_mode="full")
    assert (
        "If the user requested a specific year but the returned data omits that year" in full_prompt
    )

    # Test quick mode prompt
    quick_prompt = get_system_prompt(
        selected_chat_model=ModelType.CHAT_MODEL, response_mode="quick"
    )
    assert (
        "If the year returned in the data does not match the year requested by the user"
        in quick_prompt
    )
    assert "Example of a correct quick-mode response with year mismatch:" in quick_prompt
