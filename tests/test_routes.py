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
        data=json.dumps({
            "title": "Aragorn", "body": "A ranger from the north.",
            "entity_type": "person", "project_id": project.id,
        }),
        content_type="application/json")
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Aragorn"
    assert data["body"] == "A ranger from the north."
    assert data["entity_type"] == "person"
    assert data["project_id"] == project.id
    assert "id" in data


def test_create_note_entity_returns_201(auth_client, db, project):
    response = auth_client.post("/api/entities",
        data=json.dumps({
            "title": "Campaign rules", "body": "House rules for this campaign.",
            "entity_type": "note", "project_id": project.id,
        }),
        content_type="application/json")
    assert response.status_code == 201
    assert response.get_json()["entity_type"] == "note"


def test_create_entity_missing_entity_type_returns_400(auth_client, db, project):
    response = auth_client.post("/api/entities",
        data=json.dumps({"title": "Aragorn", "body": "A ranger.", "project_id": project.id}),
        content_type="application/json")
    assert response.status_code == 400


def test_create_entity_invalid_entity_type_returns_400(auth_client, db, project):
    response = auth_client.post("/api/entities",
        data=json.dumps({
            "title": "Aragorn", "body": "A ranger.",
            "entity_type": "dragon", "project_id": project.id,
        }),
        content_type="application/json")
    assert response.status_code == 400


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


def test_update_entity_type(auth_client, db, project):
    entity = make_entity(db, "Legolas", project=project)
    response = auth_client.put(f"/api/entities/{entity.id}",
        data=json.dumps({"entity_type": "note"}),
        content_type="application/json")
    assert response.status_code == 200
    assert response.get_json()["entity_type"] == "note"


def test_update_entity_invalid_type_returns_400(auth_client, db, project):
    entity = make_entity(db, "Legolas", project=project)
    response = auth_client.put(f"/api/entities/{entity.id}",
        data=json.dumps({"entity_type": "dragon"}),
        content_type="application/json")
    assert response.status_code == 400


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
        data=json.dumps({
            "title": "<b>Bold Name</b>", "body": "A body.",
            "entity_type": "person", "project_id": project.id,
        }),
        content_type="application/json")
    assert response.status_code == 201
    assert response.get_json()["title"] == "Bold Name"


def test_body_allows_formatting_tags_but_strips_scripts(auth_client, db, project):
    response = auth_client.post("/api/entities",
        data=json.dumps({
            "title": "A title",
            "body": "<p><strong>Bold</strong></p><script>alert(1)</script>",
            "entity_type": "person",
            "project_id": project.id,
        }),
        content_type="application/json")
    assert response.status_code == 201
    body = response.get_json()["body"]
    assert "<strong>Bold</strong>" in body
    assert "<script>" not in body


# --- Assist chat route ---

def test_assist_chat_calls_service_with_correct_args(auth_client, db):
    with patch("app.services.assist_service.AssistService.chat") as mock_chat:
        mock_chat.return_value = "Here's an idea..."
        response = auth_client.post("/api/assist/chat",
            data=json.dumps({
                "entity_type": "person",
                "genre": "fantasy",
                "messages": [{"role": "user", "content": "Give me an idea for a wizard"}],
            }),
            content_type="application/json")

    assert response.status_code == 200
    mock_chat.assert_called_once_with(
        "person", "fantasy", [{"role": "user", "content": "Give me an idea for a wizard"}], []
    )
    assert response.get_json()["reply"] == "Here's an idea..."


def test_assist_chat_missing_messages_returns_400(auth_client, db):
    response = auth_client.post("/api/assist/chat",
        data=json.dumps({"entity_type": "person", "genre": "fantasy"}),
        content_type="application/json")
    assert response.status_code == 400


def test_assist_chat_invalid_entity_type_returns_400(auth_client, db):
    response = auth_client.post("/api/assist/chat",
        data=json.dumps({
            "entity_type": "dragon",
            "genre": "fantasy",
            "messages": [{"role": "user", "content": "hi"}],
        }),
        content_type="application/json")
    assert response.status_code == 400


def test_assist_chat_includes_context_entities(auth_client, db):
    with patch("app.services.assist_service.AssistService.chat") as mock_chat:
        mock_chat.return_value = "Here's an idea..."
        response = auth_client.post("/api/assist/chat",
            data=json.dumps({
                "entity_type": "person",
                "genre": "fantasy",
                "messages": [{"role": "user", "content": "hi"}],
                "context_entities": [{"title": "Gandalf", "body": "<p>A wizard.</p>"}],
            }),
            content_type="application/json")

    assert response.status_code == 200
    mock_chat.assert_called_once_with(
        "person", "fantasy", [{"role": "user", "content": "hi"}],
        [{"title": "Gandalf", "body": "A wizard."}],
    )


def test_assist_chat_context_entities_must_be_a_list(auth_client, db):
    response = auth_client.post("/api/assist/chat",
        data=json.dumps({
            "entity_type": "person",
            "genre": "fantasy",
            "messages": [{"role": "user", "content": "hi"}],
            "context_entities": "not a list",
        }),
        content_type="application/json")
    assert response.status_code == 400


def test_assist_chat_context_entity_requires_title(auth_client, db):
    response = auth_client.post("/api/assist/chat",
        data=json.dumps({
            "entity_type": "person",
            "genre": "fantasy",
            "messages": [{"role": "user", "content": "hi"}],
            "context_entities": [{"body": "no title"}],
        }),
        content_type="application/json")
    assert response.status_code == 400


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
