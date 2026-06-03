import pytest
from app import create_app, db as _db


@pytest.fixture(scope="session")
def app():
    application = create_app("testing")
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
def auth_client(app, db):
    """Test client with an active session."""
    c = app.test_client()
    c.post("/api/auth/login",
           json={"username": "anyone", "password": "test-password"},
           content_type="application/json")
    return c
