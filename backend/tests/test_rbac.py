import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_unauthorized_admin_access(client: AsyncClient):
    response = await client.get("/api/v1/admin/status")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_unauthorized_kitchen_access(client: AsyncClient):
    response = await client.get("/api/v1/kitchen/status")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_unauthorized_customer_access(client: AsyncClient):
    response = await client.get("/api/v1/customer/status")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_guest_signup_and_customer_route_access(client: AsyncClient):
    # Register guest user
    response = await client.post("/api/v1/auth/guest")
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    token = data["access_token"]

    # Access customer route with bearer token
    headers = {"Authorization": f"Bearer {token}"}
    cust_resp = await client.get("/api/v1/customer/status", headers=headers)
    assert cust_resp.status_code == 200
    cust_data = cust_resp.json()
    assert cust_data["status"] == "authorized"
    assert cust_data["role"] == "customer"

    # Attempt to access admin route with customer token -> Should return 403 Forbidden
    admin_resp = await client.get("/api/v1/admin/status", headers=headers)
    assert admin_resp.status_code == 403
