from app import db
from app.models import Project


class ProjectService:

    @staticmethod
    def get_all():
        return [p.to_dict() for p in Project.query.order_by(Project.created_at).all()]

    @staticmethod
    def get_by_id(project_id):
        project = Project.query.get_or_404(project_id)
        return project.to_dict()

    @staticmethod
    def create(data):
        project = Project(name=data["name"])
        db.session.add(project)
        db.session.commit()
        return project.to_dict()

    @staticmethod
    def update(project_id, data):
        project = Project.query.get_or_404(project_id)
        project.name = data.get("name", project.name)
        db.session.commit()
        return project.to_dict()

    @staticmethod
    def delete(project_id):
        project = Project.query.get_or_404(project_id)
        db.session.delete(project)
        db.session.commit()
