from app import db
from app.models import Entity
import anthropic
import os

class EntityService:

    @staticmethod
    def get_all():
        return [e.to_dict() for e in Entity.query.all()]

    @staticmethod
    def get_by_id(entity_id):
        entity = Entity.query.get_or_404(entity_id)
        return entity.to_dict()

    @staticmethod
    def create(data):
        entity = Entity(
            title=data["title"],
            body=data["body"]
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
        print('Generating description for ', entity_type, ':', prompt, '(', genre, ')...')
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

        engineered_prompt = EntityService._build_prompt(
            entity_type, prompt, genre, prompt_associations or [], hint
        )

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": engineered_prompt}]
        )

        from app.services.usage_service import UsageService
        UsageService.record(message.usage)

        import json
        content = message.content[0].text
        print(content)
        return json.loads(content)
