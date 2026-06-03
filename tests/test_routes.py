import json
import pytest
from unittest.mock import patch, MagicMock
from app.models.entity import Entity
from app.models.association import Association
from app import db as _db


def make_entity(db, title="Test Entity", body="Test body"):
    entity = Entity(title=title, body=body)
    db.session.add(entity)
    db.session.commit()
    return entity


# --- Entity routes ---

def test_get_entities_returns_list(client, db):
    make_entity(db, "Gandalf")
    make_entity(db, "Frodo")
    response = client.get("/api/entities")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_entities_empty(client, db):
    response = client.get("/api/entities")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_entity_returns_201(client, db):
    response = client.post("/api/entities",
        data=json.dumps({"title": "Aragorn", "body": "A ranger from the north."}),
        content_type="application/json")
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Aragorn"
    assert data["body"] == "A ranger from the north."
    assert "id" in data


def test_get_entity_by_id(client, db):
    entity = make_entity(db, "Legolas", "An elf archer.")
    response = client.get(f"/api/entities/{entity.id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == "Legolas"
    assert data["body"] == "An elf archer."


def test_get_entity_not_found(client, db):
    response = client.get("/api/entities/9999")
    assert response.status_code == 404


def test_update_entity(client, db):
    entity = make_entity(db, "Legolas")
    response = client.put(f"/api/entities/{entity.id}",
        data=json.dumps({"title": "Legolas Greenleaf", "body": "Updated body."}),
        content_type="application/json")
    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == "Legolas Greenleaf"


def test_delete_entity_returns_200(client, db):
    entity = make_entity(db)
    response = client.delete(f"/api/entities/{entity.id}")
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data


def test_delete_entity_removes_it(client, db):
    entity = make_entity(db)
    client.delete(f"/api/entities/{entity.id}")
    response = client.get(f"/api/entities/{entity.id}")
    assert response.status_code == 404


# --- Association routes ---

def test_get_associations_for_entity(client, db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")
    assoc = Association(entity_id_1=e1.id, entity_id_2=e2.id, description="companions")
    db.session.add(assoc)
    db.session.commit()

    response = client.get(f"/api/entities/{e1.id}/associations")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["description"] == "companions"


def test_create_association(client, db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")
    response = client.post("/api/associations",
        data=json.dumps({"entity_id_1": e1.id, "entity_id_2": e2.id, "description": "mentor"}),
        content_type="application/json")
    assert response.status_code == 201
    data = response.get_json()
    assert data["description"] == "mentor"


def test_delete_association(client, db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")
    assoc = Association(entity_id_1=e1.id, entity_id_2=e2.id, description="companions")
    db.session.add(assoc)
    db.session.commit()

    response = client.delete(f"/api/associations/{assoc.id}")
    assert response.status_code == 200


# --- Usage route ---

def test_get_usage_returns_key_active_and_stats(client, db):
    with patch("anthropic.Anthropic") as MockClient:
        instance = MockClient.return_value
        instance.models.list.return_value = MagicMock()

        response = client.get("/api/usage")

    assert response.status_code == 200
    data = response.get_json()
    assert "key_active" in data
    assert "input_tokens" in data
    assert "output_tokens" in data
    assert "request_count" in data


def test_get_usage_key_inactive_on_exception(client, db):
    with patch("anthropic.Anthropic") as MockClient:
        instance = MockClient.return_value
        instance.models.list.side_effect = Exception("Connection refused")

        response = client.get("/api/usage")

    assert response.status_code == 200
    data = response.get_json()
    assert data["key_active"] is False


# --- Generate route ---

def test_generate_entity_calls_service_with_correct_args(client, db):
    with patch("app.services.entity_service.EntityService.generate") as mock_generate:
        mock_generate.return_value = {"description": "A brave hero."}

        response = client.post("/api/entities/generate",
            data=json.dumps({
                "entity_type": "person",
                "prompt": "Arthur",
                "genre": "fantasy",
                "hint": "make him noble",
                "prompt_associations": []
            }),
            content_type="application/json")

    assert response.status_code == 200
    mock_generate.assert_called_once_with("person", "Arthur", "fantasy", "make him noble", [])
    data = response.get_json()
    assert data["description"] == "A brave hero."


def test_generate_entity_without_optional_fields(client, db):
    with patch("app.services.entity_service.EntityService.generate") as mock_generate:
        mock_generate.return_value = {"description": "An ancient place."}

        response = client.post("/api/entities/generate",
            data=json.dumps({"entity_type": "place", "prompt": "Rivendell"}),
            content_type="application/json")

    assert response.status_code == 200
    mock_generate.assert_called_once_with("place", "Rivendell", "fantasy", None, [])


# --- Input validation / sanitization ---

def test_create_entity_missing_title_returns_400(client, db):
    response = client.post("/api/entities",
        data=json.dumps({"body": "Some body text"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_entity_missing_body_returns_400(client, db):
    response = client.post("/api/entities",
        data=json.dumps({"title": "A title"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_entity_no_json_returns_4xx(client, db):
    response = client.post("/api/entities", data="not json", content_type="text/plain")
    assert response.status_code in (400, 415)


def test_generate_invalid_entity_type_returns_400(client, db):
    response = client.post("/api/entities/generate",
        data=json.dumps({"entity_type": "dragon", "prompt": "Name", "genre": "fantasy"}),
        content_type="application/json")
    assert response.status_code == 400


def test_generate_invalid_genre_returns_400(client, db):
    response = client.post("/api/entities/generate",
        data=json.dumps({"entity_type": "person", "prompt": "Name", "genre": "romance"}),
        content_type="application/json")
    assert response.status_code == 400


def test_generate_missing_prompt_returns_400(client, db):
    response = client.post("/api/entities/generate",
        data=json.dumps({"entity_type": "person", "genre": "fantasy"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_association_self_link_returns_400(client, db):
    entity = make_entity(db)
    response = client.post("/api/associations",
        data=json.dumps({"entity_id_1": entity.id, "entity_id_2": entity.id, "description": "self"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_association_invalid_ids_returns_400(client, db):
    response = client.post("/api/associations",
        data=json.dumps({"entity_id_1": "abc", "entity_id_2": "xyz", "description": "test"}),
        content_type="application/json")
    assert response.status_code == 400


def test_html_in_title_is_stripped(client, db):
    response = client.post("/api/entities",
        data=json.dumps({"title": "<b>Bold Name</b>", "body": "A body."}),
        content_type="application/json")
    assert response.status_code == 201
    assert response.get_json()["title"] == "Bold Name"
