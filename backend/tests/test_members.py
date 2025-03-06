from tests.conftest import client


def test_get_members(client):
    """Test retrieving members"""
    response = client.get('/members')
    assert response.status_code == 200
    assert response.json == []

def test_create_member(client):
    """Test creating a new member"""
    new_member = {
        "name": "John Doe",
        "email": "john@example.com"
    }
    response = client.post('/members', json=new_member)
    assert response.status_code == 201
    assert response.json['message'] == "Member added successfully"
