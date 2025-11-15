# Integration tests for API endpoints
import pytest
import sys
from pathlib import Path
import asyncio
from httpx import AsyncClient

sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from server import app

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.anyio
async def test_admin_login():
    """Test admin login endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/admin/login", json={
            "username": "admin_demo",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"

@pytest.mark.anyio
async def test_admin_login_invalid():
    """Test admin login with invalid credentials"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/admin/login", json={
            "username": "admin_demo",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

@pytest.mark.anyio
async def test_create_user_as_admin():
    """Test creating a user as admin"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login as admin
        login_response = await client.post("/api/auth/admin/login", json={
            "username": "admin_demo",
            "password": "Admin@123"
        })
        token = login_response.json()["token"]
        
        # Create user
        response = await client.post(
            "/api/admin/users",
            json={
                "username": f"testuser_{asyncio.get_event_loop().time()}",
                "password": "Test@123",
                "avatar": 0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "username" in data
        assert data["role"] == "user"

@pytest.mark.anyio
async def test_get_games():
    """Test getting available games"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login as admin (any authenticated user can view games)
        login_response = await client.post("/api/auth/admin/login", json={
            "username": "admin_demo",
            "password": "Admin@123"
        })
        token = login_response.json()["token"]
        
        # Get games
        response = await client.get(
            "/api/games",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
