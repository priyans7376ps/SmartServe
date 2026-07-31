import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_table_lifecycle_and_status(client: AsyncClient):
    # Kitchen auth token
    kitchen_signup = await client.post("/api/v1/auth/signup", json={
        "email": "kitchen_table@smartserve.com",
        "password": "Password123!",
        "full_name": "Kitchen Staff",
        "role": "kitchen"
    })
    assert kitchen_signup.status_code == 201
    kitchen_token = kitchen_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {kitchen_token}"}

    # Admin auth token to create restaurant
    admin_signup = await client.post("/api/v1/auth/signup", json={
        "email": "admin_table@smartserve.com",
        "password": "Password123!",
        "full_name": "Admin Table",
        "role": "admin"
    })
    admin_token = admin_signup.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create restaurant
    rest_res = await client.post("/api/v1/restaurants/", json={
        "name": "Table Rest",
        "slug": "table-rest"
    }, headers=admin_headers)
    assert rest_res.status_code == 201
    restaurant_id = rest_res.json()["id"]

    # Create table
    table_data = {
        "restaurant_id": restaurant_id,
        "table_number": 12,
        "table_name": "VIP Booth",
        "capacity": 6,
        "device_id": "tablet_vip_12",
        "status": "available"
    }
    create_res = await client.post("/api/v1/tables/", json=table_data, headers=headers)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["table_number"] == 12
    assert data["status"] == "available"
    table_id = data["id"]

    # Update table status to occupied
    status_res = await client.patch(f"/api/v1/tables/{table_id}/status", json={"status": "occupied"}, headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "occupied"
    assert status_res.json()["is_occupied"] is True

    # Get single table
    get_res = await client.get(f"/api/v1/tables/{table_id}")
    assert get_res.status_code == 200
    assert get_res.json()["table_name"] == "VIP Booth"
