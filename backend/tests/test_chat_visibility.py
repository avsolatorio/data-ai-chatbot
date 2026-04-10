"""Unit tests for chat visibility feature flag helpers."""

from unittest.mock import patch

from app.utils.chat_visibility import effective_visibility


def test_effective_visibility_disabled_maps_public_to_private():
    with patch("app.utils.chat_visibility.get_settings") as mock_gs:
        mock_gs.return_value.ENABLE_SHARE_CONVERSATION = False
        assert effective_visibility("public") == "private"
        assert effective_visibility("private") == "private"


def test_effective_visibility_enabled_preserves_public():
    with patch("app.utils.chat_visibility.get_settings") as mock_gs:
        mock_gs.return_value.ENABLE_SHARE_CONVERSATION = True
        assert effective_visibility("public") == "public"
        assert effective_visibility("private") == "private"
