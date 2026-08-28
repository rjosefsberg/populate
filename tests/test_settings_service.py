from unittest.mock import patch, MagicMock
from app.services.settings_service import SettingsService


def test_update_masks_value_resets_key_works_and_persists(app, clean_settings):
    """Unit: core SettingsService logic — update, masking, key_works reset, and re-reading from disk."""
    with app.app_context():
        result, err = SettingsService.update("anthropic_api_key", "sk-ant-abcd1234")
        assert err is None
        api_key_row = next(r for r in result["settings"] if r["key"] == "anthropic_api_key")
        assert api_key_row["value"] == "••••1234"
        assert result["api_key_populated"] is True
        assert result["key_works"] is False  # reset on change

        # A fresh get_all() re-reads from disk rather than an in-memory cache.
        assert SettingsService.get_all()["api_key_populated"] is True

        # Editing a non-editable setting is rejected.
        result, err = SettingsService.update("key_works", "true")
        assert result is None and err is not None


def test_check_key_route_flips_key_works_and_persists(client, db, clean_settings):
    """Integration: PUT a key through the API, verify it via the route, confirm it sticks."""
    client.put("/api/settings/anthropic_api_key", json={"value": "sk-ant-good"})

    with patch("anthropic.Anthropic") as MockClient:
        MockClient.return_value.models.list.return_value = MagicMock()
        response = client.post("/api/settings/check-key")

    assert response.status_code == 200
    assert response.get_json()["key_works"] is True
    assert client.get("/api/settings").get_json()["key_works"] is True
