import re
import bleach
from flask import jsonify

VALID_ENTITY_TYPES = {"person", "place", "thing"}
VALID_GENRES = {"fantasy", "sci-fi", "horror", "western", "historical", "noir", "post-apocalyptic"}
VALID_CHAT_ROLES = {"user", "assistant"}

LIMITS = {
    "title":       200,
    "body":        10_000,
    "description": 2_000,
    "prompt":      200,
    "hint":        500,
    "chat_message": 4_000,
    "chat_history": 40,
    "context_entities": 10,
    "context_body": 2_000,
}

# Tags/attributes allowed in a WYSIWYG-edited entity body. Anything else is stripped.
ALLOWED_BODY_TAGS = [
    "p", "br", "strong", "em", "b", "i", "u", "s", "strike",
    "ul", "ol", "li", "h1", "h2", "h3", "blockquote", "code", "pre", "a",
]
ALLOWED_BODY_ATTRS = {"a": ["href", "target", "rel"]}

_TAGS_RE = re.compile(r"<[^>]+>")
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def strip_html(value: str) -> str:
    return _TAGS_RE.sub("", value)


def clean_html_body(value, max_len: int) -> str:
    """Sanitize WYSIWYG-editor HTML down to an allowlist of formatting tags."""
    value = str(value).strip()
    value = strip_control_chars(value)
    value = bleach.clean(value, tags=ALLOWED_BODY_TAGS, attributes=ALLOWED_BODY_ATTRS, strip=True)
    return value[:max_len]


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


def clean_chat_messages(raw_messages):
    """Validate and clean a chat history. Returns (messages, error_response)."""
    if not isinstance(raw_messages, list) or not raw_messages:
        return None, (jsonify({"error": "messages must be a non-empty list"}), 400)
    if len(raw_messages) > LIMITS["chat_history"]:
        return None, (jsonify({"error": f"messages cannot exceed {LIMITS['chat_history']} entries"}), 400)

    cleaned = []
    for m in raw_messages:
        if not isinstance(m, dict) or m.get("role") not in VALID_CHAT_ROLES:
            return None, (jsonify({"error": "each message needs a role of 'user' or 'assistant'"}), 400)
        content = clean_prompt_text(m.get("content", ""), LIMITS["chat_message"])
        if not content:
            return None, (jsonify({"error": "message content cannot be empty"}), 400)
        cleaned.append({"role": m["role"], "content": content})

    if cleaned[-1]["role"] != "user":
        return None, (jsonify({"error": "the last message must be from the user"}), 400)

    return cleaned, None


def clean_context_entities(raw_entities):
    """Validate and clean the list of existing entities included as chat context. Returns (entities, error_response)."""
    if raw_entities is None:
        return [], None
    if not isinstance(raw_entities, list):
        return None, (jsonify({"error": "context_entities must be a list"}), 400)
    if len(raw_entities) > LIMITS["context_entities"]:
        return None, (jsonify({"error": f"context_entities cannot exceed {LIMITS['context_entities']} entries"}), 400)

    cleaned = []
    for e in raw_entities:
        if not isinstance(e, dict):
            return None, (jsonify({"error": "each context entity must be an object"}), 400)
        title = clean_prompt_text(e.get("title", ""), LIMITS["title"])
        if not title:
            return None, (jsonify({"error": "each context entity needs a title"}), 400)
        body = clean_prompt_text(strip_html(e.get("body", "")), LIMITS["context_body"])
        cleaned.append({"title": title, "body": body})

    return cleaned, None
