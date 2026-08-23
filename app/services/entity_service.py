from app import db
from app.models import Entity
import anthropic
import os
import json
import logging

logger = logging.getLogger(__name__)


class EntityService:

    @staticmethod
    def get_all(project_id=None):
        query = Entity.query
        if project_id is not None:
            query = query.filter_by(project_id=project_id)
        return [e.to_dict() for e in query.all()]

    @staticmethod
    def get_by_id(entity_id):
        entity = Entity.query.get_or_404(entity_id)
        return entity.to_dict()

    @staticmethod
    def create(data):
        entity = Entity(
            title=data["title"],
            body=data["body"],
            project_id=data["project_id"],
        )
        db.session.add(entity)
        db.session.commit()
        return entity.to_dict()

    @staticmethod
    def delete(entity_id):
        entity = Entity.query.get_or_404(entity_id)
        db.session.delete(entity)
        db.session.commit()

    @staticmethod
    def update(entity_id, data):
        entity = Entity.query.get_or_404(entity_id)
        entity.title = data.get("title", entity.title)
        entity.body = data.get("body", entity.body)
        db.session.commit()
        return entity.to_dict()

    @staticmethod
    def _build_prompt(entity_type, name, genre, prompt_associations, hint):
        parts = []

        parts.append(
            f"You are a creative writer specializing in the {genre} genre.\n"
            f"Write a concise three-sentence description for the {entity_type} named \"{name}\" "
            f"that fits naturally into a {genre} setting."
        )

        if prompt_associations:
            lines = "\n".join(
                f"- {a['title']}: {a['description']}" if a.get('description') else f"- {a['title']}"
                for a in prompt_associations
            )
            parts.append(
                f"This entity has the following relationships — weave them naturally into the description:\n{lines}"
            )

        if hint:
            parts.append(f"Additional instruction: {hint}")

        parts.append(
            "Rules:\n"
            "- Write exactly three sentences\n"
            f"- Stay true to the {genre} genre's tone, tropes, and conventions\n"
            "- Be descriptive but concise\n"
            "- Do not include the entity's name or type as a label in your response\n"
            "- Return only valid JSON, no preamble, no markdown, no code blocks\n\n"
            'Return this exact JSON structure:\n{"description": "<your three sentence description here>"}'
        )

        return "\n\n".join(parts)

    @staticmethod
    def generate(entity_type, prompt, genre="fantasy", hint=None, prompt_associations=None):
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

        engineered_prompt = EntityService._build_prompt(
            entity_type, prompt, genre, prompt_associations or [], hint
        )

        logger.debug("=== PROMPT ===\n%s\n==============", engineered_prompt)

        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[{"role": "user", "content": engineered_prompt}]
            )
        except anthropic.APIError as e:
            logger.error(
                "Anthropic API error — status=%s body=%s",
                getattr(e, 'status_code', '?'),
                getattr(e, 'body', str(e)),
                exc_info=True,
            )
            raise

        from app.services.usage_service import UsageService
        UsageService.record(message.usage)

        logger.debug(
            "=== RESPONSE === stop_reason=%s usage=in:%d out:%d\n%s\n================",
            message.stop_reason,
            message.usage.input_tokens,
            message.usage.output_tokens,
            message.content[0].text,
        )

        content = message.content[0].text
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            logger.error(
                "JSON parse failed — full response content below:\n%s", content
            )
            raise
