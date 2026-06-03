from flask import jsonify, request


def register_routes(app):
    @app.route("/api/entities", methods=["GET"])
    def get_entities():
        from app.services.entity_service import EntityService
        return jsonify(EntityService.get_all())

    @app.route("/api/entities/generate", methods=["POST"])
    def generate_entity():
        from app.services.entity_service import EntityService
        data = request.get_json()
        result = EntityService.generate(data["entity_type"], data["prompt"], data.get("genre", "fantasy"), data.get("hint"), data.get("prompt_associations", []))
        return jsonify(result), 200

    @app.route("/api/entities/<int:entity_id>", methods=["GET"])
    def get_entity(entity_id):
        from app.services.entity_service import EntityService
        return jsonify(EntityService.get_by_id(entity_id))

    @app.route("/api/entities", methods=["POST"])
    def create_entity():
        from app.services.entity_service import EntityService
        data = request.get_json()
        entity = EntityService.create(data)
        return jsonify(entity), 201

    @app.route("/api/entities/<int:entity_id>", methods=["PUT"])
    def update_entity(entity_id):
        from app.services.entity_service import EntityService
        data = request.get_json()
        entity = EntityService.update(entity_id, data)
        return jsonify(entity), 200

    @app.route("/api/entities/<int:entity_id>", methods=["DELETE"])
    def delete_entity(entity_id):
        from app.services.entity_service import EntityService
        EntityService.delete(entity_id)
        return jsonify({"message": "Entity deleted"}), 200

    @app.route("/api/entities/<int:entity_id>/associations", methods=["GET"])
    def get_associations(entity_id):
        from app.services.association_service import AssociationService
        return jsonify(AssociationService.get_for_entity(entity_id))

    @app.route("/api/associations", methods=["POST"])
    def create_association():
        from app.services.association_service import AssociationService
        data = request.get_json()
        assoc = AssociationService.create(data)
        return jsonify(assoc), 201

    @app.route("/api/associations/<int:association_id>", methods=["DELETE"])
    def delete_association(association_id):
        from app.services.association_service import AssociationService
        AssociationService.delete(association_id)
        return jsonify({"message": "Association deleted"}), 200

    @app.route("/api/usage", methods=["GET"])
    def get_usage():
        from app.services.usage_service import UsageService
        import anthropic, os, requests as http
        api_key = os.environ.get("ANTHROPIC_API_KEY")

        # Verify key is active
        try:
            client = anthropic.Anthropic(api_key=api_key)
            client.models.list(limit=1)
            key_active = True
        except Exception:
            key_active = False

        # Attempt to fetch remaining credits (available for some account types)
        credits_remaining = None
        try:
            resp = http.get(
                "https://api.anthropic.com/v1/organizations/billing/credit_grants",
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
                timeout=5,
            )
            if resp.ok:
                grants = resp.json().get("data", [])
                # Sum unexpired grants
                credits_remaining = sum(
                    g.get("remaining_amount", 0) for g in grants
                    if g.get("status") == "active"
                )
        except Exception:
            pass

        return jsonify({
            "key_active": key_active,
            "credits_remaining": credits_remaining,
            **UsageService.get_stats(),
        })
