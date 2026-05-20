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
        result = EntityService.generate(data["entity_type"], data["prompt"])
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
