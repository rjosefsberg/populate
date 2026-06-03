import re
from flask import jsonify

VALID_ENTITY_TYPES = {"person", "place", "thing"}
VALID_GENRES = {"fantasy", "sci-fi", "horror", "western", "historical", "noir", "post-apocalyptic"}

LIMITS = {
    "title":       200,
    "body":        10_000,
    "description": 2_000,
    "prompt":      200,
    "hint":        500,
}

_TAGS_RE = re.compile(r"<[^>]+>")
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def strip_html(value: str) -> str:
    return _TAGS_RE.sub("", value)


def strip_control_chars(value: str) -> str:
    """Remove control characters while preserving normal whitespace (tab, newline, CR)."""
    return _CONTROL_RE.sub("", value)


def clean_text(value, max_len: int) -> str:
    value = str(value).strip()
    value = strip_html(value)
    value = strip_control_chars(value)
    return value[:max_len]


def clean_prompt_text(value, max_len: int) -> str:
    """Stricter cleaning for text that goes into the Claude prompt."""
    value = str(value).strip()
    value = strip_html(value)
    value = strip_control_chars(value)
    # Collapse internal newlines to spaces to prevent prompt structure injection
    value = re.sub(r"\s*\n\s*", " ", value)
    return value[:max_len]


def require_json(data):
    """Return an error response tuple if data is None, else None."""
    if data is None:
        return jsonify({"error": "Request body must be JSON"}), 400
    return None


def validate_entity_type(value):
    if value not in VALID_ENTITY_TYPES:
        return jsonify({"error": f"entity_type must be one of: {', '.join(sorted(VALID_ENTITY_TYPES))}"}), 400
    return None


def validate_genre(value):
    if value not in VALID_GENRES:
        return jsonify({"error": f"genre must be one of: {', '.join(sorted(VALID_GENRES))}"}), 400
    return None
