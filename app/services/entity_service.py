from pathlib import Path
from app import db
from app.models import Entity


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
            entity_type=data["entity_type"],
            project_id=data["project_id"],
        )
        db.session.add(entity)
        db.session.commit()
        return entity.to_dict()

    @staticmethod
    def delete(entity_id):
        entity = Entity.query.get_or_404(entity_id)
        # The DB cascade removes attachment rows, but not the files themselves.
        for attachment in entity.attachments:
            Path(attachment.stored_path).unlink(missing_ok=True)
        db.session.delete(entity)
        db.session.commit()

    @staticmethod
    def update(entity_id, data):
        entity = Entity.query.get_or_404(entity_id)
        entity.title = data.get("title", entity.title)
        entity.body = data.get("body", entity.body)
        entity.entity_type = data.get("entity_type", entity.entity_type)
        db.session.commit()
        return entity.to_dict()
