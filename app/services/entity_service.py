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
    def generate(entity_type, prompt, genre="fantasy", hint=None):
        print('Generating description for ', entity_type, ':', prompt, '(', genre, ')...')
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

        hint_line = f"\n    Additional instruction: {hint}" if hint else ""

        engineered_prompt = f"""You are a creative writer specializing in the {genre} genre.

    You will be given an element type and a name. Your job is to write a concise three sentence description for that element that fits naturally into a {genre} setting.

    Genre: {genre}
    Element type: {entity_type}
    Element name: {prompt}{hint_line}

    Rules:
    - Write exactly three sentences
    - Stay true to the {genre} genre's tone, tropes, and conventions
    - Stay consistent with the element type
    - Be descriptive but concise
    - Do not include the name or type as a label in your response
    - Return only valid JSON, no preamble, no markdown, no code blocks

    Return this exact JSON structure:
    {{"description": "<your three sentence description here>"}}"""

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": engineered_prompt}
            ]
        )

        import json
        content = message.content[0].text
        print(content)
        return json.loads(content)
