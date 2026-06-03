import json
import pytest
from unittest.mock import patch, MagicMock
from app.services.entity_service import EntityService


# --- _build_prompt tests (no DB needed) ---

def test_build_prompt_contains_genre():
    prompt = EntityService._build_prompt("person", "Aragorn", "fantasy", [], None)
    assert "fantasy" in prompt


def test_build_prompt_contains_entity_type_and_name():
    prompt = EntityService._build_prompt("place", "Rivendell", "fantasy", [], None)
    assert "place" in prompt
    assert "Rivendell" in prompt


def test_build_prompt_with_hint_includes_hint():
    prompt = EntityService._build_prompt("person", "Gandalf", "fantasy", [], "make him mysterious")
    assert "make him mysterious" in prompt


def test_build_prompt_without_hint_no_additional_instruction():
    prompt = EntityService._build_prompt("person", "Gandalf", "fantasy", [], None)
    assert "Additional instruction" not in prompt


def test_build_prompt_with_associations_includes_them():
    associations = [{"title": "Saruman", "description": "rival wizard"}]
    prompt = EntityService._build_prompt("person", "Gandalf", "fantasy", associations, None)
    assert "Saruman" in prompt
    assert "rival wizard" in prompt


def test_build_prompt_with_associations_without_description():
    associations = [{"title": "Saruman"}]
    prompt = EntityService._build_prompt("person", "Gandalf", "fantasy", associations, None)
    assert "Saruman" in prompt


def test_build_prompt_without_associations_no_relationships_section():
    prompt = EntityService._build_prompt("person", "Gandalf", "fantasy", [], None)
    assert "relationships" not in prompt


def test_build_prompt_scifi_genre():
    prompt = EntityService._build_prompt("person", "Ripley", "sci-fi", [], None)
    assert "sci-fi" in prompt


# --- generate tests (mocked Anthropic) ---

def test_generate_calls_anthropic_and_returns_parsed_json(app):
    fake_response_text = '{"description": "A wise old wizard with a long grey beard."}'
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=fake_response_text)]
    mock_message.usage.input_tokens = 50
    mock_message.usage.output_tokens = 20
    mock_message.stop_reason = "end_turn"

    with app.app_context():
        with patch("app.services.entity_service.anthropic.Anthropic") as MockClient:
            instance = MockClient.return_value
            instance.messages.create.return_value = mock_message

            result = EntityService.generate("person", "Gandalf", genre="fantasy")

    assert result == {"description": "A wise old wizard with a long grey beard."}


def test_generate_passes_hint_in_prompt(app):
    fake_response_text = '{"description": "A dark and brooding figure."}'
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=fake_response_text)]
    mock_message.usage.input_tokens = 60
    mock_message.usage.output_tokens = 15
    mock_message.stop_reason = "end_turn"

    with app.app_context():
        with patch("app.services.entity_service.anthropic.Anthropic") as MockClient:
            instance = MockClient.return_value
            instance.messages.create.return_value = mock_message

            result = EntityService.generate("person", "Gandalf", hint="make it dark")

    call_args = instance.messages.create.call_args
    prompt_content = call_args[1]["messages"][0]["content"]
    assert "make it dark" in prompt_content


def test_generate_records_usage(app):
    from app.services.usage_service import UsageService
    UsageService._input_tokens = 0
    UsageService._output_tokens = 0
    UsageService._request_count = 0

    fake_response_text = '{"description": "Test description."}'
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=fake_response_text)]
    mock_message.usage.input_tokens = 100
    mock_message.usage.output_tokens = 30
    mock_message.stop_reason = "end_turn"

    with app.app_context():
        with patch("app.services.entity_service.anthropic.Anthropic") as MockClient:
            instance = MockClient.return_value
            instance.messages.create.return_value = mock_message
            EntityService.generate("person", "Test")

    assert UsageService._request_count == 1
    UsageService._input_tokens = 0
    UsageService._output_tokens = 0
    UsageService._request_count = 0
