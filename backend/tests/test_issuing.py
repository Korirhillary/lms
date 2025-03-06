from datetime import datetime

import pytest
from app import app, db
from models import Book, Issuing, Member, Transaction
from tests.conftest import client


@pytest.fixture
def setup_test_data():
    """Clears and creates fresh test data for members and books."""
    with app.app_context():
        db.session.query(Member).delete()  # Clear members
        db.session.query(Book).delete()  # Clear books
        db.session.commit()

        john = Member(name="John Doe", email="john@example.com", outstanding_debt=100)
        peter = Member(name="Peter Doe", email="peter@example.com", outstanding_debt=200)  # Ensure Peter exists

        python_book = Book(title="Python 101", author="Jane Author", stock=3)
        flask_book = Book(title="Python Flask 101", author="John Dev", stock=2)  # Ensure Flask book exists

        db.session.add_all([john, peter, python_book, flask_book])
        db.session.commit()


@pytest.fixture
def issue_book():
    """Issues a book to a test member."""
    with app.app_context():
        member = Member.query.filter_by(email="peter@example.com").first()
        book = Book.query.filter_by(title="Python Flask 101").first()

        issue = Issuing(member_id=member.id, book_id=book.id, charge=50.0)
        book.stock -= 1
        member.outstanding_debt += 50

        db.session.add(issue)
        db.session.commit()

@pytest.fixture
def active_issuing(setup_test_data):  # Ensure setup_test_data runs first
    """Creates an active issuing record (a book that has not been returned)."""
    with app.app_context():
        member = Member.query.filter_by(email="peter@example.com").first()
        book = Book.query.filter_by(title="Python Flask 101").first()

        assert member is not None, "Member not found in the database"
        assert book is not None, "Book not found in the database"

        issue = Issuing(
            member_id=member.id,
            book_id=book.id,
            charge=50.0,
            issue_date=datetime.utcnow(),
            is_cleared=False
        )
        db.session.add(issue)
        db.session.commit()

def test_get_issuing(client, setup_test_data):
    """Test retrieving all issuing records (should be empty initially)."""
    response = client.get('/issuing')
    assert response.status_code == 200
    assert response.json == []

def test_issue_book_success(client, setup_test_data):
    """Test issuing a book successfully."""
    with app.app_context():
        member = Member.query.filter_by(email="john@example.com").first()
        book = Book.query.filter_by(title="Python 101").first()

        print(f"DEBUG: member={member}, book={book}")  # Debugging output

        assert member is not None, "Member should exist in DB"
        assert book is not None, "Book should exist in DB"

    data = {
        "email": "john@example.com",
        "book_name": "Python 101"
    }
    response = client.post('/issuing', json=data)
    assert response.status_code == 201
    assert response.json['message'] == "Book issued successfully"

# def test_issue_book_success(client, setup_test_data):
#     """Test issuing a book successfully."""
#     data = {
#         "email": "peter@example.com",
#         "book_name": "Python Flask 101"
#     }
#     response = client.post('/issuing', json=data)
#     print("response: %s", response)
#     print("response.status_code: %s", response.status_code)
#     assert response.status_code == 201
#     assert response.json['message'] == "Book issued successfully"

def test_issue_book_not_found(client, setup_test_data):
    """Test issuing a book with a non-existing member or book."""
    data = {
        "email": "wrong@example.com",
        "book_name": "Unknown Book"
    }
    response = client.post('/issuing', json=data)
    assert response.status_code == 404
    assert response.json['message'] == "Book or Member not found"

def test_issue_book_out_of_stock(client, setup_test_data):
    """Test issuing a book when stock is zero."""
    with app.app_context():
        book = Book.query.filter_by(title="Python Flask 101").first()
        assert book is not None, "Book should exist in DB before running test"  # Debugging step

        book.stock = 0  # Set stock to 0
        db.session.commit()

    data = {
        "email": "peter@example.com",
        "book_name": "Python Flask 101"
    }
    response = client.post('/issuing', json=data)
    assert response.status_code == 400
    assert response.json['message'] == "Book out of stock"

def test_issue_book_exceeds_debt_limit(client, setup_test_data):
    """Test issuing a book when the member's outstanding debt exceeds 500."""
    with app.app_context():
        member = Member.query.filter_by(email="peter@example.com").first()
        assert member is not None, "Member should exist in DB before running test"  # Debugging step

        member.outstanding_debt = 500
        db.session.commit()

    data = {
        "email": "peter@example.com",
        "book_name": "Python Flask 101"
    }
    response = client.post('/issuing', json=data)
    assert response.status_code == 400
    assert response.json['message'] == "Outstanding debt exceeds Kes.500"

def test_return_book_success(client, active_issuing):
    """Test returning a book successfully."""
    data = {
        "email": "peter@example.com",
        "book_name": "Python Flask 101"
    }
    response = client.put('/issuing', json=data)
    assert response.status_code == 200
    assert response.json['message'] == "Book returned successfully and transaction recorded"

def test_return_book_no_active_issuing(client, setup_test_data):
    """Test returning a book when no active issuing record exists."""
    with app.app_context():
        member = Member.query.filter_by(email="peter@example.com").first()
        book = Book.query.filter_by(title="Python Flask 101").first()

        print(f"DEBUG: member={member}, book={book}")  # Debugging output

        assert member is not None, "Member should exist before this test runs"
        assert book is not None, "Book should exist before this test runs"

    data = {
        "email": "peter@example.com",
        "book_name": "Python Flask 101"
    }
    response = client.put('/issuing', json=data)

    print(f"DEBUG: Response JSON: {response.json}")  # Debugging output

    assert response.status_code == 404
    assert response.json['message'] == "No active issuing record found"
