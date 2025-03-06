import pytest
from models import Book
from tests.conftest import client


def test_get_books(client):
    """Test retrieving books"""
    response = client.get('/books')
    assert response.status_code == 200
    assert response.json == []

def test_create_book(client):
    """Test creating a new book"""
    new_book = {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "stock": 10,
        "image_url": "https://example.com/gatsby.jpg"
    }
    response = client.post('/books', json=new_book)
    assert response.status_code == 201
    assert response.json['message'] == "Book added successfully"

    response = client.get('/books')
    assert len(response.json) == 1
    assert response.json[0]['title'] == "The Great Gatsby"
