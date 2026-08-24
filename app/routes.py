from flask import jsonify, request, send_file
from app.utils.sanitize import (
    require_json, validate_entity_type, validate_genre,
    clean_text, clean_prompt_text, clean_html_body, clean_chat_messages, clean_context_entities,
    LIMITS, MAX_ATTACHMENT_SIZE,
)
from app.auth import require_auth


def register_routes(app):
    @app.route("/api/projects", methods=["GET"])
    @require_auth
    def get_projects():
        from app.services.project_service import ProjectService
        return jsonify(ProjectService.get_all())

    @app.route("/api/projects", methods=["POST"])
    @require_auth
    def create_project():
        from app.services.project_service import ProjectService
        data = request.get_json()
        if (err := require_json(data)):
            return err
        if not data.get("name", "").strip():
            return jsonify({"error": "name is required"}), 400
        project = ProjectService.create({"name": clean_text(data["name"], LIMITS["title"])})
        return jsonify(project), 201

    @app.route("/api/projects/<int:project_id>", methods=["PUT"])
    @require_auth
    def update_project(project_id):
        from app.services.project_service import ProjectService
        data = request.get_json()
        if (err := require_json(data)):
            return err
        cleaned = {}
        if "name" in data:
            if not data["name"].strip():
                return jsonify({"error": "name is required"}), 400
            cleaned["name"] = clean_text(data["name"], LIMITS["title"])
        project = ProjectService.update(project_id, cleaned)
        return jsonify(project), 200

    @app.route("/api/projects/<int:project_id>", methods=["DELETE"])
    @require_auth
    def delete_project(project_id):
        from app.services.project_service import ProjectService
        ProjectService.delete(project_id)
        return jsonify({"message": "Project deleted"}), 200

    @app.route("/api/entities", methods=["GET"])
    @require_auth
    def get_entities():
        from app.services.entity_service import EntityService
        project_id = request.args.get("project_id", type=int)
        return jsonify(EntityService.get_all(project_id))

    @app.route("/api/assist/chat", methods=["POST"])
    @require_auth
    def assist_chat():
        from app.services.assist_service import AssistService
        data = request.get_json()
        if (err := require_json(data)):
            return err

        entity_type = clean_text(data.get("entity_type", ""), 50)
        if (err := validate_entity_type(entity_type)):
            return err

        genre = clean_text(data.get("genre", "fantasy"), 50)
        if (err := validate_genre(genre)):
            return err

        messages, err = clean_chat_messages(data.get("messages"))
        if err:
            return err

        context_entities, err = clean_context_entities(data.get("context_entities"))
        if err:
            return err

        try:
            reply = AssistService.chat(entity_type, genre, messages, context_entities)
        except Exception:
            return jsonify({"error": "Assistant is unavailable right now"}), 502
        return jsonify({"reply": reply}), 200

    @app.route("/api/entities/<int:entity_id>", methods=["GET"])
    @require_auth
    def get_entity(entity_id):
        from app.services.entity_service import EntityService
        return jsonify(EntityService.get_by_id(entity_id))

    @app.route("/api/entities", methods=["POST"])
    @require_auth
    def create_entity():
        from app.services.entity_service import EntityService
        data = request.get_json()
        if (err := require_json(data)):
            return err
        if not data.get("title", "").strip():
            return jsonify({"error": "title is required"}), 400
        if not data.get("body", "").strip():
            return jsonify({"error": "body is required"}), 400
        try:
            project_id = int(data["project_id"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "project_id is required"}), 400

        entity_type = clean_text(data.get("entity_type", ""), 50)
        if (err := validate_entity_type(entity_type)):
            return err

        entity = EntityService.create({
            "title": clean_text(data["title"], LIMITS["title"]),
            "body":  clean_html_body(data["body"], LIMITS["body"]),
            "entity_type": entity_type,
            "project_id": project_id,
        })
        return jsonify(entity), 201

    @app.route("/api/entities/<int:entity_id>", methods=["PUT"])
    @require_auth
    def update_entity(entity_id):
        from app.services.entity_service import EntityService
        data = request.get_json()
        if (err := require_json(data)):
            return err

        cleaned = {}
        if "title" in data:
            cleaned["title"] = clean_text(data["title"], LIMITS["title"])
        if "body" in data:
            cleaned["body"] = clean_html_body(data["body"], LIMITS["body"])
        if "entity_type" in data:
            entity_type = clean_text(data["entity_type"], 50)
            if (err := validate_entity_type(entity_type)):
                return err
            cleaned["entity_type"] = entity_type

        entity = EntityService.update(entity_id, cleaned)
        return jsonify(entity), 200

    @app.route("/api/entities/<int:entity_id>", methods=["DELETE"])
    @require_auth
    def delete_entity(entity_id):
        from app.services.entity_service import EntityService
        EntityService.delete(entity_id)
        return jsonify({"message": "Entity deleted"}), 200

    @app.route("/api/entities/<int:entity_id>/attachments", methods=["POST"])
    @require_auth
    def upload_attachment(entity_id):
        from app.services.attachment_service import AttachmentService
        file_storage = request.files.get("file")
        if not file_storage or not file_storage.filename:
            return jsonify({"error": "file is required"}), 400

        # Flask's MAX_CONTENT_LENGTH already rejects an oversized request body (413) before
        # this runs; this covers requests that don't declare Content-Length up front.
        file_storage.stream.seek(0, 2)
        size = file_storage.stream.tell()
        file_storage.stream.seek(0)
        if size > MAX_ATTACHMENT_SIZE:
            return jsonify({"error": f"file exceeds the {MAX_ATTACHMENT_SIZE // (1024 * 1024)}MB limit"}), 400

        attachment = AttachmentService.save(entity_id, file_storage)
        return jsonify(attachment), 201

    @app.route("/api/attachments/<int:attachment_id>/download", methods=["GET"])
    @require_auth
    def download_attachment(attachment_id):
        import io
        from app.services.attachment_service import AttachmentService
        attachment = AttachmentService.get_by_id(attachment_id)
        # Read into memory rather than streaming the path directly — send_file can leave the
        # file handle open past the response on Windows, blocking a subsequent delete.
        with open(attachment.stored_path, "rb") as f:
            data = f.read()
        return send_file(
            io.BytesIO(data),
            mimetype=attachment.content_type or "application/octet-stream",
            as_attachment=True,
            download_name=attachment.filename,
        )

    @app.route("/api/attachments/<int:attachment_id>", methods=["DELETE"])
    @require_auth
    def delete_attachment(attachment_id):
        from app.services.attachment_service import AttachmentService
        AttachmentService.delete(attachment_id)
        return jsonify({"message": "Attachment deleted"}), 200

    @app.route("/api/entities/<int:entity_id>/associations", methods=["GET"])
    @require_auth
    def get_associations(entity_id):
        from app.services.association_service import AssociationService
        return jsonify(AssociationService.get_for_entity(entity_id))

    @app.route("/api/associations", methods=["POST"])
    @require_auth
    def create_association():
        from app.services.association_service import AssociationService
        data = request.get_json()
        if (err := require_json(data)):
            return err

        try:
            entity_id_1 = int(data["entity_id_1"])
            entity_id_2 = int(data["entity_id_2"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "entity_id_1 and entity_id_2 must be integers"}), 400

        if entity_id_1 == entity_id_2:
            return jsonify({"error": "entity_id_1 and entity_id_2 must be different"}), 400

        assoc = AssociationService.create({
            "entity_id_1":  entity_id_1,
            "entity_id_2":  entity_id_2,
            "description":  clean_text(data.get("description", ""), LIMITS["description"]),
        })
        return jsonify(assoc), 201

    @app.route("/api/associations/<int:association_id>", methods=["DELETE"])
    @require_auth
    def delete_association(association_id):
        from app.services.association_service import AssociationService
        AssociationService.delete(association_id)
        return jsonify({"message": "Association deleted"}), 200

    @app.route("/api/settings", methods=["GET"])
    @require_auth
    def get_settings():
        from app.services.settings_service import SettingsService
        return jsonify(SettingsService.get_all())

    @app.route("/api/settings/<key>", methods=["PUT"])
    @require_auth
    def update_setting(key):
        from app.services.settings_service import SettingsService
        data = request.get_json()
        if (err := require_json(data)):
            return err
        value = clean_text(data.get("value", ""), LIMITS["setting_value"])
        result, err = SettingsService.update(key, value)
        if err:
            return jsonify({"error": err}), 400
        return jsonify(result), 200

    @app.route("/api/settings/check-key", methods=["POST"])
    @require_auth
    def check_settings_key():
        from app.services.settings_service import SettingsService
        return jsonify(SettingsService.check_key()), 200

    @app.route("/api/usage", methods=["GET"])
    @require_auth
    def get_usage():
        import logging
        log = logging.getLogger(__name__)
        from app.services.usage_service import UsageService
        from app.services.settings_service import SettingsService
        import anthropic
        api_key = SettingsService.get_anthropic_api_key()

        key_active = False
        credits_remaining = None

        try:
            client = anthropic.Anthropic(api_key=api_key)
            client.models.list(limit=1)
            key_active = True
        except Exception:
            log.exception("Key validation failed")

        try:
            import urllib.request, json as _json
            req = urllib.request.Request(
                "https://api.anthropic.com/v1/organizations/billing/credit_grants",
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                grants = _json.loads(resp.read()).get("data", [])
                credits_remaining = sum(
                    g.get("remaining_amount", 0) for g in grants
                    if g.get("status") == "active"
                )
        except Exception:
            log.debug("Credits endpoint unavailable (expected for most account types)")

        return jsonify({
            "key_active": key_active,
            "credits_remaining": credits_remaining,
            **UsageService.get_stats(),
        })
