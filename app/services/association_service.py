from app import db
from app.models import Association, Entity

class AssociationService:

    @staticmethod
    def get_for_entity(entity_id):
        rows = Association.query.filter(
            (Association.entity_id_1 == entity_id) | (Association.entity_id_2 == entity_id)
        ).all()
        return [r.to_dict() for r in rows]

    @staticmethod
    def get_for_project(project_id):
        project_entity_ids = db.session.query(Entity.id).filter_by(project_id=project_id)
        rows = Association.query.filter(
            Association.entity_id_1.in_(project_entity_ids),
            Association.entity_id_2.in_(project_entity_ids),
        ).all()
        return [r.to_dict() for r in rows]

    @staticmethod
    def create(data):
        assoc = Association(
            entity_id_1=data["entity_id_1"],
            entity_id_2=data["entity_id_2"],
            description=data["description"]
        )
        db.session.add(assoc)
        db.session.commit()
        return assoc.to_dict()

    @staticmethod
    def delete(association_id):
        assoc = Association.query.get_or_404(association_id)
        db.session.delete(assoc)
        db.session.commit()
