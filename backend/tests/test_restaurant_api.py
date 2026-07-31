import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_and_get_restaurant(client: AsyncClient):
    # Obtain admin auth token
    admin_signup = await client.post("/api/v1/auth/signup", json={
        "email": "admin_rest@smartserve.com",
        "password": "Password123!",
        "full_name": "Admin User",
        "role": "admin"
    })
    assert admin_signup.status_code == 201
    admin_token = admin_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create restaurant
    rest_data = {
        "name": "Gourmet Bistro",
        "slug": "gourmet-bistro",
        "description": "Fine dining restaurant",
        "email": "info@gourmetbistro.com",
        "phone": "+1234567890",
        "country": "US",
        "tax_rate": 0.08,
        "service_charge_rate": 0.05
    }
    create_res = await client.post("/api/v1/restaurants/", json=rest_data, headers=headers)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["name"] == "Gourmet Bistro"
    assert data["slug"] == "gourmet-bistro"
    rest_id = data["id"]

    # Public get restaurant
    get_res = await client.get(f"/api/v1/restaurants/{rest_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == rest_id

    # Public list restaurants
    list_res = await client.get("/api/v1/restaurants/")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
