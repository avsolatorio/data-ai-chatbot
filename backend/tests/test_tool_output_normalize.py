from app.ai.graph.tool_output_normalize import normalize_tool_output_for_ui


def test_normalize_json_in_list():
    output = [{"type": "text", "text": '{"url": "http://example.com", "error": null}'}]
    result = normalize_tool_output_for_ui(output)
    assert isinstance(result, dict)
    assert result["url"] == "http://example.com"


def test_normalize_non_json_in_list():
    output = [{"type": "text", "text": "This is plain text, not JSON"}]
    result = normalize_tool_output_for_ui(output)
    assert result == "This is plain text, not JSON"


def test_normalize_empty_list():
    assert normalize_tool_output_for_ui([]) is None


def test_normalize_other_types():
    assert normalize_tool_output_for_ui("plain string") == "plain string"
    assert normalize_tool_output_for_ui({"a": 1}) == {"a": 1}
