import tempfile
import pytest
from app import create_app, db as _db


@pytest.fixture(scope="session")
def app():
    # An isolated instance_path keeps tests (e.g. settings.json) from touching the real
    # dev instance folder.
    with tempfile.TemporaryDirectory() as instance_dir:
        application = create_app("testing", instance_path=instance_dir)
        with application.app_context():
            _db.create_all()
            yield application
            _db.drop_all()


@pytest.fixture(scope="function")
def db(app):
    with app.app_context():
        yield _db
        _db.session.remove()
        # Clear all rows between tests
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture(scope="function")
def client(app, db):
    return app.test_client()


@pytest.fixture(scope="function")
def project(db):
    from app.models.project import Project
    p = Project(name="Test Project")
    db.session.add(p)
    db.session.commit()
    return p


@pytest.fixture(scope="function")
def clean_settings(app):
    """Remove any settings.json left over from a previous test."""
    from pathlib import Path
    path = Path(app.instance_path) / "settings.json"
    path.unlink(missing_ok=True)
    yield
    path.unlink(missing_ok=True)
