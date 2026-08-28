import io
import os
from app.services.entity_service import EntityService
from app.services.attachment_service import AttachmentService


def test_upload_download_delete_round_trip(client, db, project):
    """Integration: the full attachment lifecycle through the real routes."""
    entity = client.post("/api/entities", json={
        "title": "Gandalf", "body": "A wizard.", "entity_type": "person", "project_id": project.id,
    }).get_json()

    upload = client.post(
        f"/api/entities/{entity['id']}/attachments",
        data={"file": (io.BytesIO(b"hello world"), "notes.txt")},
        content_type="multipart/form-data",
    )
    assert upload.status_code == 201
    attachment = upload.get_json()
    assert attachment["filename"] == "notes.txt"
    assert attachment["size_bytes"] == len(b"hello world")

    download = client.get(f"/api/attachments/{attachment['id']}/download")
    assert download.status_code == 200
    assert download.data == b"hello world"

    delete = client.delete(f"/api/attachments/{attachment['id']}")
    assert delete.status_code == 200
    assert client.get(f"/api/attachments/{attachment['id']}/download").status_code == 404


def test_deleting_entity_removes_attachment_files_from_disk(app, db, project):
    """Unit: the DB cascade removes attachment rows, but the service must also clean up files on disk."""
    with app.app_context():
        entity_dict = EntityService.create({
            "title": "Frodo", "body": "A hobbit.", "entity_type": "person", "project_id": project.id,
        })

        class FakeFile:
            filename = "map.png"
            content_type = "image/png"
            def save(self, path):
                with open(path, "wb") as f:
                    f.write(b"fake image data")

        attachment = AttachmentService.save(entity_dict["id"], FakeFile())
        stored_path = AttachmentService.get_by_id(attachment["id"]).stored_path
        assert stored_path and os.path.exists(stored_path)

        EntityService.delete(entity_dict["id"])

        assert not os.path.exists(stored_path)
