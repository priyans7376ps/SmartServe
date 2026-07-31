import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_unauthorized_me(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_guest_login_endpoint(client: AsyncClient):
    response = await client.post("/api/v1/auth/guest", json={"device_id": "device_12345"})
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["full_name"] == "Guest Customer"

@pytest.mark.asyncio
async def test_guest_me_endpoint(client: AsyncClient):
    # Obtain guest token
    guest_res = await client.post("/api/v1/auth/guest")
    assert guest_res.status_code == 201
    token = guest_res.json()["access_token"]

    # Call /me endpoint with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["full_name"] == "Guest Customer"
