from app import db
from datetime import datetime

class Association(db.Model):
    __tablename__ = "associations"

    id = db.Column(db.Integer, primary_key=True)
    entity_id_1 = db.Column(db.Integer, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    entity_id_2 = db.Column(db.Integer, db.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    entity_1 = db.relationship("Entity", foreign_keys=[entity_id_1], back_populates="associations_as_1")
    entity_2 = db.relationship("Entity", foreign_keys=[entity_id_2], back_populates="associations_as_2")

    def to_dict(self):
        return {
            "id": self.id,
            "entity_id_1": self.entity_id_1,
            "entity_id_2": self.entity_id_2,
            "entity_1_title": self.entity_1.title,
            "entity_2_title": self.entity_2.title,
            "description": self.description,
            "created_at": self.created_at.isoformat()
        }
