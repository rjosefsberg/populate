import pytest
from app.models.entity import Entity
from app.models.association import Association
from app.services.association_service import AssociationService
from app import db as _db


def make_entity(db, title, body="Some body text", project_id=None):
    if project_id is None:
        from app.models.project import Project
        project = Project(name="Untitled Project")
        db.session.add(project)
        db.session.commit()
        project_id = project.id
    entity = Entity(title=title, body=body, project_id=project_id)
    db.session.add(entity)
    db.session.commit()
    return entity


def test_create_association(db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")

    result = AssociationService.create({
        "entity_id_1": e1.id,
        "entity_id_2": e2.id,
        "description": "mentor and student"
    })

    assert result["entity_id_1"] == e1.id
    assert result["entity_id_2"] == e2.id
    assert result["description"] == "mentor and student"
    assert result["entity_1_title"] == "Gandalf"
    assert result["entity_2_title"] == "Frodo"


def test_get_for_entity_returns_association_for_entity_1(db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")
    AssociationService.create({"entity_id_1": e1.id, "entity_id_2": e2.id, "description": "companions"})

    results = AssociationService.get_for_entity(e1.id)
    assert len(results) == 1
    assert results[0]["description"] == "companions"


def test_get_for_entity_returns_association_for_entity_2(db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")
    AssociationService.create({"entity_id_1": e1.id, "entity_id_2": e2.id, "description": "companions"})

    results = AssociationService.get_for_entity(e2.id)
    assert len(results) == 1
    assert results[0]["description"] == "companions"


def test_get_for_entity_returns_empty_when_no_associations(db):
    e1 = make_entity(db, "Gandalf")
    results = AssociationService.get_for_entity(e1.id)
    assert results == []


def test_delete_removes_association(db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")
    assoc = AssociationService.create({"entity_id_1": e1.id, "entity_id_2": e2.id, "description": "companions"})

    AssociationService.delete(assoc["id"])

    results = AssociationService.get_for_entity(e1.id)
    assert results == []


def test_delete_association_no_longer_appears_for_either_entity(db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo")
    assoc = AssociationService.create({"entity_id_1": e1.id, "entity_id_2": e2.id, "description": "companions"})

    AssociationService.delete(assoc["id"])

    assert AssociationService.get_for_entity(e1.id) == []
    assert AssociationService.get_for_entity(e2.id) == []


def test_get_for_project_excludes_associations_from_other_projects(db):
    e1 = make_entity(db, "Gandalf")
    e2 = make_entity(db, "Frodo", project_id=e1.project_id)
    other = make_entity(db, "Sauron")  # different project

    AssociationService.create({"entity_id_1": e1.id, "entity_id_2": e2.id, "description": "companions"})
    AssociationService.create({"entity_id_1": e1.id, "entity_id_2": other.id, "description": "nemesis"})

    results = AssociationService.get_for_project(e1.project_id)

    assert len(results) == 1
    assert results[0]["description"] == "companions"
