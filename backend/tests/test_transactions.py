from tests.conftest import client


def test_get_transactions(client):
    """Test retrieving transactions"""
    response = client.get('/transactions')
    assert response.status_code == 200
    assert response.json == []
