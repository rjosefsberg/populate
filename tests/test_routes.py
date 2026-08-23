import json
import pytest
from unittest.mock import patch, MagicMock
from app.models.entity import Entity
from app.models.association import Association
from app import db as _db


def make_entity(db, title="Test Entity", body="Test body", project=None):
    if project is None:
        from app.models.project import Project
        project = Project(name="Untitled Project")
        db.session.add(project)
        db.session.commit()
    entity = Entity(title=title, body=body, project_id=project.id)
    db.session.add(entity)
    db.session.commit()
    return entity


# --- Entity routes ---

def test_get_entities_returns_list(auth_client, db, project):
    make_entity(db, "Gandalf", project=project)
    make_entity(db, "Frodo", project=project)
    response = auth_client.get("/api/entities")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2


def test_get_entities_empty(auth_client, db):
    response = auth_client.get("/api/entities")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_entity_returns_201(auth_client, db, project):
    response = auth_client.post("/api/entities",
        data=json.dumps({"title": "Aragorn", "body": "A ranger from the north.", "project_id": project.id}),
        content_type="application/json")
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Aragorn"
    assert data["body"] == "A ranger from the north."
    assert data["project_id"] == project.id
    assert "id" in data


def test_get_entity_by_id(auth_client, db, project):
    entity = make_entity(db, "Legolas", "An elf archer.", project=project)
    response = auth_client.get(f"/api/entities/{entity.id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == "Legolas"
    assert data["body"] == "An elf archer."


def test_get_entity_not_found(auth_client, db):
    response = auth_client.get("/api/entities/9999")
    assert response.status_code == 404


def test_update_entity(auth_client, db, project):
    entity = make_entity(db, "Legolas", project=project)
    response = auth_client.put(f"/api/entities/{entity.id}",
        data=json.dumps({"title": "Legolas Greenleaf", "body": "Updated body."}),
        content_type="application/json")
    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == "Legolas Greenleaf"


def test_delete_entity_returns_200(auth_client, db, project):
    entity = make_entity(db, project=project)
    response = auth_client.delete(f"/api/entities/{entity.id}")
    assert response.status_code == 200
    data = response.get_json()
    assert "message" in data


def test_delete_entity_removes_it(auth_client, db, project):
    entity = make_entity(db, project=project)
    auth_client.delete(f"/api/entities/{entity.id}")
    response = auth_client.get(f"/api/entities/{entity.id}")
    assert response.status_code == 404


# --- Association routes ---

def test_get_associations_for_entity(auth_client, db, project):
    e1 = make_entity(db, "Gandalf", project=project)
    e2 = make_entity(db, "Frodo", project=project)
    assoc = Association(entity_id_1=e1.id, entity_id_2=e2.id, description="companions")
    db.session.add(assoc)
    db.session.commit()

    response = auth_client.get(f"/api/entities/{e1.id}/associations")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["description"] == "companions"


def test_create_association(auth_client, db, project):
    e1 = make_entity(db, "Gandalf", project=project)
    e2 = make_entity(db, "Frodo", project=project)
    response = auth_client.post("/api/associations",
        data=json.dumps({"entity_id_1": e1.id, "entity_id_2": e2.id, "description": "mentor"}),
        content_type="application/json")
    assert response.status_code == 201
    data = response.get_json()
    assert data["description"] == "mentor"


def test_delete_association(auth_client, db, project):
    e1 = make_entity(db, "Gandalf", project=project)
    e2 = make_entity(db, "Frodo", project=project)
    assoc = Association(entity_id_1=e1.id, entity_id_2=e2.id, description="companions")
    db.session.add(assoc)
    db.session.commit()

    response = auth_client.delete(f"/api/associations/{assoc.id}")
    assert response.status_code == 200


# --- Usage route ---

def test_get_usage_returns_key_active_and_stats(auth_client, db):
    with patch("anthropic.Anthropic") as MockClient:
        instance = MockClient.return_value
        instance.models.list.return_value = MagicMock()

        response = auth_client.get("/api/usage")

    assert response.status_code == 200
    data = response.get_json()
    assert "key_active" in data
    assert "input_tokens" in data
    assert "output_tokens" in data
    assert "request_count" in data


def test_get_usage_key_inactive_on_exception(auth_client, db):
    with patch("anthropic.Anthropic") as MockClient:
        instance = MockClient.return_value
        instance.models.list.side_effect = Exception("Connection refused")

        response = auth_client.get("/api/usage")

    assert response.status_code == 200
    data = response.get_json()
    assert data["key_active"] is False


# --- Generate route ---

def test_generate_entity_calls_service_with_correct_args(auth_client, db):
    with patch("app.services.entity_service.EntityService.generate") as mock_generate:
        mock_generate.return_value = {"description": "A brave hero."}

        response = auth_client.post("/api/entities/generate",
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


def test_generate_entity_without_optional_fields(auth_client, db):
    with patch("app.services.entity_service.EntityService.generate") as mock_generate:
        mock_generate.return_value = {"description": "An ancient place."}

        response = auth_client.post("/api/entities/generate",
            data=json.dumps({"entity_type": "place", "prompt": "Rivendell"}),
            content_type="application/json")

    assert response.status_code == 200
    mock_generate.assert_called_once_with("place", "Rivendell", "fantasy", None, [])


# --- Input validation / sanitization ---

def test_create_entity_missing_title_returns_400(auth_client, db):
    response = auth_client.post("/api/entities",
        data=json.dumps({"body": "Some body text"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_entity_missing_body_returns_400(auth_client, db):
    response = auth_client.post("/api/entities",
        data=json.dumps({"title": "A title"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_entity_no_json_returns_4xx(auth_client, db):
    response = auth_client.post("/api/entities", data="not json", content_type="text/plain")
    assert response.status_code in (400, 415)


def test_generate_invalid_entity_type_returns_400(auth_client, db):
    response = auth_client.post("/api/entities/generate",
        data=json.dumps({"entity_type": "dragon", "prompt": "Name", "genre": "fantasy"}),
        content_type="application/json")
    assert response.status_code == 400


def test_generate_invalid_genre_returns_400(auth_client, db):
    response = auth_client.post("/api/entities/generate",
        data=json.dumps({"entity_type": "person", "prompt": "Name", "genre": "romance"}),
        content_type="application/json")
    assert response.status_code == 400


def test_generate_missing_prompt_returns_400(auth_client, db):
    response = auth_client.post("/api/entities/generate",
        data=json.dumps({"entity_type": "person", "genre": "fantasy"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_entity_missing_project_id_returns_400(auth_client, db):
    response = auth_client.post("/api/entities",
        data=json.dumps({"title": "A title", "body": "A body"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_association_self_link_returns_400(auth_client, db, project):
    entity = make_entity(db, project=project)
    response = auth_client.post("/api/associations",
        data=json.dumps({"entity_id_1": entity.id, "entity_id_2": entity.id, "description": "self"}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_association_invalid_ids_returns_400(auth_client, db):
    response = auth_client.post("/api/associations",
        data=json.dumps({"entity_id_1": "abc", "entity_id_2": "xyz", "description": "test"}),
        content_type="application/json")
    assert response.status_code == 400


def test_html_in_title_is_stripped(auth_client, db, project):
    response = auth_client.post("/api/entities",
        data=json.dumps({"title": "<b>Bold Name</b>", "body": "A body.", "project_id": project.id}),
        content_type="application/json")
    assert response.status_code == 201
    assert response.get_json()["title"] == "Bold Name"


# --- Auth routes ---

def test_login_with_correct_password(client, db):
    response = client.post("/api/auth/login",
        data=json.dumps({"username": "anyone", "password": "test-password"}),
        content_type="application/json")
    assert response.status_code == 200
    assert response.get_json()["ok"] is True


def test_login_with_wrong_password(client, db):
    response = client.post("/api/auth/login",
        data=json.dumps({"username": "anyone", "password": "wrong"}),
        content_type="application/json")
    assert response.status_code == 401


def test_login_without_password_returns_400(client, db):
    response = client.post("/api/auth/login",
        data=json.dumps({}),
        content_type="application/json")
    assert response.status_code == 400


def test_me_returns_authenticated_after_login(client, db):
    client.post("/api/auth/login", json={"username": "anyone", "password": "test-password"})
    response = client.get("/api/auth/me")
    assert response.get_json()["authenticated"] is True


def test_me_returns_unauthenticated_before_login(client, db):
    response = client.get("/api/auth/me")
    assert response.get_json()["authenticated"] is False


def test_logout_clears_session(client, db):
    client.post("/api/auth/login", json={"username": "anyone", "password": "test-password"})
    client.post("/api/auth/logout")
    response = client.get("/api/auth/me")
    assert response.get_json()["authenticated"] is False


def test_protected_route_returns_401_without_auth(client, db):
    response = client.get("/api/entities")
    assert response.status_code == 401


def test_protected_route_accessible_after_login(client, db):
    client.post("/api/auth/login", json={"username": "anyone", "password": "test-password"})
    response = client.get("/api/entities")
    assert response.status_code == 200
