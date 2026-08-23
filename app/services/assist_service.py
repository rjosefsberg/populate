import anthropic
import os
import logging

logger = logging.getLogger(__name__)


class AssistService:

    @staticmethod
    def _build_system_prompt(entity_type, genre):
        return (
            "You are a creative writing assistant embedded in a fantasy content generator app. "
            f"The user is drafting a {entity_type} for a {genre} setting and is writing the entity's "
            "description themselves in a rich-text editor. Help them brainstorm: suggest ideas, offer "
            "phrasing, answer questions about tone or lore. Reply in plain prose — you are not writing "
            "the final entity body for them, just talking with them about it. Keep replies concise, a "
            "few sentences unless they ask for more."
        )

    @staticmethod
    def chat(entity_type, genre, messages):
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        system_prompt = AssistService._build_system_prompt(entity_type, genre)

        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=system_prompt,
                messages=messages,
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

        return message.content[0].text
