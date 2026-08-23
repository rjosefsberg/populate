from app import db
from datetime import datetime

class Entity(db.Model):
    __tablename__ = "entities"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    project = db.relationship("Project", back_populates="entities")
    associations_as_1 = db.relationship("Association", foreign_keys="Association.entity_id_1", back_populates="entity_1", cascade="all, delete-orphan")
    associations_as_2 = db.relationship("Association", foreign_keys="Association.entity_id_2", back_populates="entity_2", cascade="all, delete-orphan")

    @property
    def associations(self):
        return self.associations_as_1 + self.associations_as_2

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "created_at": self.created_at.isoformat(),
            "project_id": self.project_id,
            "associations": [a.to_dict() for a in self.associations]
        }