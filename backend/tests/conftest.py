import pytest
from app import app, db


@pytest.fixture(scope='module')
def client():
    """Create a test client and a new database for testing."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///test_library.db"

    with app.test_client() as client:
        with app.app_context():
            db.create_all()  # Create tables before running tests
        yield client  # Provide the test client to tests
        with app.app_context():
            db.drop_all()  # Clean up after tests
