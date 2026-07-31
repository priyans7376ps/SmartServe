import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_menu_item_filtering_and_search(client: AsyncClient):
    # Kitchen auth token
    kitchen_signup = await client.post("/api/v1/auth/signup", json={
        "email": "kitchen_menu@smartserve.com",
        "password": "Password123!",
        "full_name": "Chef Luigi",
        "role": "kitchen"
    })
    token = kitchen_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Admin to create restaurant
    admin_signup = await client.post("/api/v1/auth/signup", json={
        "email": "admin_menu@smartserve.com",
        "password": "Password123!",
        "full_name": "Admin Menu",
        "role": "admin"
    })
    admin_token = admin_signup.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    rest_res = await client.post("/api/v1/restaurants/", json={
        "name": "Menu Rest",
        "slug": "menu-rest"
    }, headers=admin_headers)
    assert rest_res.status_code == 201
    restaurant_id = rest_res.json()["id"]

    # Category creation
    cat_res = await client.post("/api/v1/categories/", json={
        "restaurant_id": restaurant_id,
        "name": "Pizza Category"
    }, headers=headers)
    assert cat_res.status_code == 201
    category_id = cat_res.json()["id"]

    # Create menu item (Vegetarian, Special)
    menu_data = {
        "restaurant_id": restaurant_id,
        "category_id": category_id,
        "name": "Margherita Special Pizza",
        "description": "Fresh basil, mozzarella, and san marzano tomatoes",
        "price": 14.99,
        "is_available": True,
        "is_vegetarian": True,
        "is_todays_special": True,
        "preparation_time": 12
    }
    create_res = await client.post("/api/v1/menu/", json=menu_data, headers=headers)
    assert create_res.status_code == 201
    item_data = create_res.json()
    assert item_data["name"] == "Margherita Special Pizza"
    assert item_data["is_vegetarian"] is True

    # Search endpoint
    search_res = await client.get("/api/v1/menu/search?q=Margherita")
    assert search_res.status_code == 200
    search_json = search_res.json()
    assert search_json["total"] >= 1
    assert search_json["items"][0]["name"] == "Margherita Special Pizza"

    # Filter by veg
    veg_res = await client.get("/api/v1/menu/?is_veg=true")
    assert veg_res.status_code == 200
    assert len(veg_res.json()["items"]) >= 1

    # Unauthorized customer attempt to create item -> 403 Forbidden
    cust_signup = await client.post("/api/v1/auth/signup", json={
        "email": "cust_menu@smartserve.com",
        "password": "Password123!",
        "full_name": "Customer User",
        "role": "customer"
    })
    cust_token = cust_signup.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    forbidden_res = await client.post("/api/v1/menu/", json=menu_data, headers=cust_headers)
    assert forbidden_res.status_code == 403
