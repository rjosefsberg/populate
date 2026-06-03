import pytest
from app.services.usage_service import UsageService


@pytest.fixture(autouse=True)
def reset_counters():
    """Reset class-level counters before each test."""
    UsageService._input_tokens = 0
    UsageService._output_tokens = 0
    UsageService._request_count = 0
    yield
    UsageService._input_tokens = 0
    UsageService._output_tokens = 0
    UsageService._request_count = 0


class FakeUsage:
    def __init__(self, input_tokens, output_tokens):
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens


def test_record_increments_input_tokens():
    UsageService.record(FakeUsage(100, 50))
    assert UsageService._input_tokens == 100


def test_record_increments_output_tokens():
    UsageService.record(FakeUsage(100, 50))
    assert UsageService._output_tokens == 50


def test_record_increments_request_count():
    UsageService.record(FakeUsage(10, 5))
    assert UsageService._request_count == 1


def test_get_stats_returns_correct_totals():
    UsageService.record(FakeUsage(200, 80))
    stats = UsageService.get_stats()
    assert stats["input_tokens"] == 200
    assert stats["output_tokens"] == 80
    assert stats["total_tokens"] == 280
    assert stats["request_count"] == 1


def test_multiple_records_accumulate():
    UsageService.record(FakeUsage(100, 40))
    UsageService.record(FakeUsage(200, 60))
    stats = UsageService.get_stats()
    assert stats["input_tokens"] == 300
    assert stats["output_tokens"] == 100
    assert stats["total_tokens"] == 400
    assert stats["request_count"] == 2


def test_initial_stats_are_zero():
    stats = UsageService.get_stats()
    assert stats["input_tokens"] == 0
    assert stats["output_tokens"] == 0
    assert stats["total_tokens"] == 0
    assert stats["request_count"] == 0
