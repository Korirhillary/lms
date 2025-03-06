import pytest
from flask import Flask
from flask_restful import Api
from models import Book, Member, db
from resources.books import BookResource
from resources.issuing import IssuingResource
from resources.members import MemberResource
from resources.transaction import TransactionResource


@pytest.fixture
def app():
    """Create a Flask test app with test configuration"""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:library.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TESTING'] = True

    # Initialize SQLAlchemy with the app
    db.init_app(app)

    # Create API and add resources
    api = Api(app)
    api.add_resource(BookResource, '/books')
    api.add_resource(MemberResource, '/members')
    api.add_resource(IssuingResource, '/issuing')
    api.add_resource(TransactionResource, '/transactions')

    # Create test tables
    with app.app_context():
        db.create_all()

    yield app
    #drop db when tests are done
    with app.app_context():
        db.drop_all()

@pytest.fixture
def client(app):
    """Create a test client for making requests"""
    return app.test_client()

@pytest.fixture
def session(app):
    """Create a database session for adding test data"""
    with app.app_context():
        yield db.session
        db.session.remove()

def test_book_resource(client, session):
    """Test Book Resource"""
    # Test adding a book
    book_data = {
        'title': 'Test Book',
        'author': 'Test Author',
        'stock': 10,
        'image_url': 'http://example.com/book.jpg'
    }
    response = client.post('/books', json=book_data)
    assert response.status_code == 201
    assert response.json['message'] == 'Book added successfully'

    # Test getting books
    response = client.get('/books')
    assert response.status_code == 200
    books = response.json
    assert len(books) > 0
    assert books[0]['title'] == 'Test Book'

def test_member_resource(client, session):
    """Test Member Resource"""
    # Test adding a member
    member_data = {
        'name': 'John Doe',
        'email': 'john@example.com'
    }
    response = client.post('/members', json=member_data)
    assert response.status_code == 201
    assert response.json['message'] == 'Member added successfully'

    # Test adding duplicate email
    response = client.post('/members', json=member_data)
    assert response.status_code == 400
    assert response.json['message'] == 'Email already exists'

    # Test getting members
    response = client.get('/members')
    assert response.status_code == 200
    members = response.json
    assert len(members) > 0
    assert members[0]['name'] == 'John Doe'

def test_issuing_resource(client, session):
    """Test Issuing Resource"""
    # Use app context to add test data
    with client.application.app_context():
        # Add a book
        book = Book(title='Test Book', author='Test Author', stock=5)
        session.add(book)

        # Add a member
        member = Member(name='John Doe', email='john@example.com')
        session.add(member)
        session.commit()

        # Test book issuing
        issuing_data = {
            'email': 'john@example.com',
            'book_name': 'Test Book'
        }
        response = client.post('/issuing', json=issuing_data)
        assert response.status_code == 201
        assert response.json['message'] == 'Book issued successfully'

        # Test book return
        response = client.put('/issuing', json=issuing_data)
        assert response.status_code == 200
        assert response.json['message'] == 'Book returned successfully and transaction recorded'

def test_transaction_resource(client, session):
    """Test Transaction Resource"""
    # Use app context to add test data
    with client.application.app_context():
        # Add a book
        book = Book(title='Transaction Book', author='Test Author', stock=5)
        session.add(book)

        # Add a member
        member = Member(name='Jane Doe', email='jane@example.com')
        session.add(member)
        session.commit()

        # Issue a book
        issuing_data = {
            'email': 'jane@example.com',
            'book_name': 'Transaction Book'
        }
        client.post('/issuing', json=issuing_data)
        client.put('/issuing', json=issuing_data)

        # Test getting transactions
        response = client.get('/transactions')
        assert response.status_code == 200
        transactions = response.json
        assert len(transactions) > 0
        assert transactions[0]['book_name'] == 'Transaction Book'

def test_issuing_edge_cases(client, session):
    """Test edge cases for book issuing"""
    # Use app context to add test data
    with client.application.app_context():
        # Add a book with zero stock
        no_stock_book = Book(title='Out of Stock Book', author='Test Author', stock=0)
        session.add(no_stock_book)

        # Add a book for debt limit test
        debt_book = Book(title='Debt Limit Book', author='Test Author', stock=5)
        session.add(debt_book)

        # Scenario 1: Member with debt exactly at the limit (500)
        member1 = Member(name='Test Member 1', email='test1@example.com', outstanding_debt=500)
        session.add(member1)

        # Scenario 2: Member with debt below the limit (450)
        member2 = Member(name='Test Member 2', email='test2@example.com', outstanding_debt=450)
        session.add(member2)

        # Scenario 3: Member with debt exceeding the limit (501)
        member3 = Member(name='Test Member 3', email='test3@example.com', outstanding_debt=501)
        session.add(member3)

        session.commit()

        # Test 1: Book with zero stock
        no_stock_data = {
            'email': 'test1@example.com',
            'book_name': 'Out of Stock Book'
        }
        response = client.post('/issuing', json=no_stock_data)
        assert response.status_code == 400
        assert response.json['message'] == 'Book out of stock'

        print("Member Outstanding Debt 1:", member1.outstanding_debt)
        print("Member Outstanding Debt 2:", member2.outstanding_debt)
        print("Member Outstanding Debt 3:", member3.outstanding_debt)

        # Test 2: Member with debt at limit (500) - should be rejected
        debt_data_limit = {
            'email': 'test1@example.com',
            'book_name': 'Debt Limit Book'
        }
        response = client.post('/issuing', json=debt_data_limit)
        assert response.status_code == 400
        assert response.json['message'] == 'Outstanding debt exceeds Kes.500'

        # Test 3: Member with debt below limit (450) - should be allowed
        debt_data_below_limit = {
            'email': 'test2@example.com',
            'book_name': 'Debt Limit Book'
        }
        response = client.post('/issuing', json=debt_data_below_limit)
        assert response.status_code == 201
        assert response.json['message'] == 'Book issued successfully'

        # Test 4: Member with debt exceeding limit (501) - should be rejected
        debt_data_over_limit = {
            'email': 'test3@example.com',
            'book_name': 'Debt Limit Book'
        }
        response = client.post('/issuing', json=debt_data_over_limit)

        print("Response Status Code:", response.status_code)
        print("Response JSON:", response.json)
        
        assert response.status_code == 400
        assert response.json['message'] == 'Outstanding debt exceeds Kes.500'



def test_nonexistent_book_or_member(client):
    """Test issuing for nonexistent book or member"""
    # Try to issue a book with nonexistent book or member
    issuing_data = {
        'email': 'nonexistent@example.com',
        'book_name': 'Nonexistent Book'
    }
    response = client.post('/issuing', json=issuing_data)
    assert response.status_code == 404
    assert response.json['message'] == 'Book or Member not found'