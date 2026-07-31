import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_category_management(client: AsyncClient):
    kitchen_signup = await client.post("/api/v1/auth/signup", json={
        "email": "kitchen_cat@smartserve.com",
        "password": "Password123!",
        "full_name": "Chef Mario",
        "role": "kitchen"
    })
    token = kitchen_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Admin to create restaurant
    admin_signup = await client.post("/api/v1/auth/signup", json={
        "email": "admin_cat@smartserve.com",
        "password": "Password123!",
        "full_name": "Admin Cat",
        "role": "admin"
    })
    admin_token = admin_signup.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    rest_res = await client.post("/api/v1/restaurants/", json={
        "name": "Category Rest",
        "slug": "category-rest"
    }, headers=admin_headers)
    assert rest_res.status_code == 201
    restaurant_id = rest_res.json()["id"]

    # Create category
    cat_data = {
        "restaurant_id": restaurant_id,
        "name": "Italian Starters",
        "description": "Delicious traditional antipasti",
        "display_order": 1
    }
    create_res = await client.post("/api/v1/categories/", json=cat_data, headers=headers)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["name"] == "Italian Starters"
    cat_id = data["id"]

    # List categories
    list_res = await client.get(f"/api/v1/categories/?restaurant_id={restaurant_id}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
