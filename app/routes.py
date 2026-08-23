from flask import jsonify, request
from app.utils.sanitize import (
    require_json, validate_entity_type, validate_genre,
    clean_text, clean_prompt_text, clean_html_body, clean_chat_messages, LIMITS,
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

    @app.route("/api/entities/generate", methods=["POST"])
    @require_auth
    def generate_entity():
        from app.services.entity_service import EntityService
        data = request.get_json()
        if (err := require_json(data)):
            return err

        entity_type = clean_text(data.get("entity_type", ""), 50)
        if (err := validate_entity_type(entity_type)):
            return err

        genre = clean_text(data.get("genre", "fantasy"), 50)
        if (err := validate_genre(genre)):
            return err

        if not data.get("prompt", "").strip():
            return jsonify({"error": "prompt is required"}), 400

        prompt = clean_prompt_text(data["prompt"], LIMITS["prompt"])
        hint = clean_prompt_text(data["hint"], LIMITS["hint"]) if data.get("hint") else None

        raw_assocs = data.get("prompt_associations", [])
        if not isinstance(raw_assocs, list):
            return jsonify({"error": "prompt_associations must be a list"}), 400
        prompt_associations = [
            {
                "title": clean_prompt_text(a.get("title", ""), LIMITS["title"]),
                "description": clean_prompt_text(a.get("description", ""), LIMITS["description"]),
            }
            for a in raw_assocs if isinstance(a, dict)
        ]

        try:
            result = EntityService.generate(entity_type, prompt, genre, hint, prompt_associations)
        except ValueError as e:
            return jsonify({"error": str(e)}), 502
        return jsonify(result), 200

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

        try:
            reply = AssistService.chat(entity_type, genre, messages)
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

        entity = EntityService.create({
            "title": clean_text(data["title"], LIMITS["title"]),
            "body":  clean_html_body(data["body"], LIMITS["body"]),
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

        entity = EntityService.update(entity_id, cleaned)
        return jsonify(entity), 200

    @app.route("/api/entities/<int:entity_id>", methods=["DELETE"])
    @require_auth
    def delete_entity(entity_id):
        from app.services.entity_service import EntityService
        EntityService.delete(entity_id)
        return jsonify({"message": "Entity deleted"}), 200

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

    @app.route("/api/usage", methods=["GET"])
    @require_auth
    def get_usage():
        import logging
        log = logging.getLogger(__name__)
        from app.services.usage_service import UsageService
        import anthropic, os
        api_key = os.environ.get("ANTHROPIC_API_KEY")

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
