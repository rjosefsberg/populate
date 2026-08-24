import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import current_app
from app import db
from app.models import Attachment, Entity
from app.utils.sanitize import clean_text, LIMITS


class AttachmentService:

    @staticmethod
    def _upload_dir(entity_id) -> Path:
        return Path(current_app.instance_path) / "uploads" / str(entity_id)

    @staticmethod
    def save(entity_id, file_storage):
        """Write an uploaded werkzeug FileStorage to disk and record it. Returns the dict."""
        Entity.query.get_or_404(entity_id)  # 404s if the entity doesn't exist

        original_name = clean_text(file_storage.filename or "file", LIMITS["filename"]) or "file"
        safe_name = secure_filename(original_name) or "file"
        stored_name = f"{uuid.uuid4().hex}_{safe_name}"

        upload_dir = AttachmentService._upload_dir(entity_id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        stored_path = upload_dir / stored_name
        file_storage.save(stored_path)
        size_bytes = stored_path.stat().st_size

        attachment = Attachment(
            entity_id=entity_id,
            filename=original_name,
            stored_path=str(stored_path),
            content_type=file_storage.content_type,
            size_bytes=size_bytes,
        )
        db.session.add(attachment)
        db.session.commit()
        return attachment.to_dict()

    @staticmethod
    def get_by_id(attachment_id):
        return Attachment.query.get_or_404(attachment_id)

    @staticmethod
    def delete(attachment_id):
        attachment = Attachment.query.get_or_404(attachment_id)
        Path(attachment.stored_path).unlink(missing_ok=True)
        db.session.delete(attachment)
        db.session.commit()
