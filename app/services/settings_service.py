import json
import os
from pathlib import Path
from flask import current_app

# Schema of user-configurable settings. Add more entries here as new settings are needed —
# the settings table/UI and the GET/PUT routes are all driven off this list.
SETTINGS_SCHEMA = [
    {"key": "anthropic_api_key", "label": "Anthropic API Key", "editable": True, "secret": True},
]

_DEFAULTS = {
    "anthropic_api_key": "",
    "key_works": False,
}


class SettingsService:

    @staticmethod
    def _path() -> Path:
        return Path(current_app.instance_path) / "settings.json"

    @staticmethod
    def _load() -> dict:
        path = SettingsService._path()
        if not path.exists():
            return dict(_DEFAULTS)
        try:
            data = json.loads(path.read_text())
        except (json.JSONDecodeError, OSError):
            return dict(_DEFAULTS)
        return {**_DEFAULTS, **data}

    @staticmethod
    def _save(data: dict) -> None:
        path = SettingsService._path()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data))

    @staticmethod
    def _mask(value: str) -> str:
        if not value:
            return ""
        if len(value) <= 4:
            return "•" * len(value)
        return "•" * (len(value) - 4) + value[-4:]

    @staticmethod
    def get_anthropic_api_key():
        """The key other services should use for Claude calls — a UI-configured value wins,
        falling back to the ANTHROPIC_API_KEY environment variable."""
        value = SettingsService._load().get("anthropic_api_key")
        return value or os.environ.get("ANTHROPIC_API_KEY")

    @staticmethod
    def get_all() -> dict:
        data = SettingsService._load()
        rows = []
        for field in SETTINGS_SCHEMA:
            value = data.get(field["key"], "")
            rows.append({
                "key": field["key"],
                "label": field["label"],
                "value": SettingsService._mask(value) if field.get("secret") else value,
                "editable": field["editable"],
            })
        rows.append({
            "key": "key_works",
            "label": "Key Verified",
            "value": bool(data.get("key_works")),
            "editable": False,
        })
        return {
            "settings": rows,
            "api_key_populated": bool(data.get("anthropic_api_key")),
            "key_works": bool(data.get("key_works")),
        }

    @staticmethod
    def update(key: str, value: str):
        """Update an editable setting. Returns (result, error)."""
        field = next((f for f in SETTINGS_SCHEMA if f["key"] == key), None)
        if not field:
            return None, f"unknown setting: {key}"
        if not field["editable"]:
            return None, f"{key} is not editable"

        data = SettingsService._load()
        data[key] = value
        if key == "anthropic_api_key":
            data["key_works"] = False  # reset verification whenever the key changes
        SettingsService._save(data)
        return SettingsService.get_all(), None

    @staticmethod
    def check_key() -> dict:
        """Validate the configured Anthropic API key against the real API and persist the result."""
        data = SettingsService._load()
        api_key = data.get("anthropic_api_key") or os.environ.get("ANTHROPIC_API_KEY")

        works = False
        if api_key:
            import anthropic
            try:
                client = anthropic.Anthropic(api_key=api_key)
                client.models.list(limit=1)
                works = True
            except Exception:
                works = False

        data["key_works"] = works
        SettingsService._save(data)
        return SettingsService.get_all()
