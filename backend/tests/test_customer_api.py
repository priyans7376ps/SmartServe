import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_customer_guest_and_auth_flow(client: AsyncClient):
    # 1. Guest Session
    guest_res = await client.post("/api/v1/customer/auth/guest", json={"session_id": "test-session-123"})
    assert guest_res.status_code == 200
    guest_data = guest_res.json()
    assert "access_token" in guest_data
    assert guest_data["session_id"] == "test-session-123"

    # 2. Customer Signup & Login
    signup_res = await client.post("/api/v1/customer/auth/signup", json={
        "email": "customer_test@smartserve.com",
        "password": "Password123!",
        "full_name": "Jane Customer",
        "role": "customer"
    })
    assert signup_res.status_code == 201
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get & Update Customer Profile
    prof_res = await client.get("/api/v1/customer/profile", headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["email"] == "customer_test@smartserve.com"

    update_res = await client.patch("/api/v1/customer/profile", json={
        "name": "Jane Doe Customer",
        "phone": "+91 99999 88888"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Jane Doe Customer"

    # 4. Status Check
    status_res = await client.get("/api/v1/customer/status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "authorized"

@pytest.mark.asyncio
async def test_customer_menu_categories_and_cart_flow(client: AsyncClient):
    # 1. Signup customer
    signup_res = await client.post("/api/v1/customer/auth/signup", json={
        "email": "cart_customer@smartserve.com",
        "password": "Password123!",
        "full_name": "Cart Customer",
        "role": "customer"
    })
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Fetch Customer Categories & Menu
    cat_res = await client.get("/api/v1/customer/categories")
    assert cat_res.status_code == 200

    menu_res = await client.get("/api/v1/customer/menu")
    assert menu_res.status_code == 200

    search_res = await client.get("/api/v1/customer/menu/search?q=pizza")
    assert search_res.status_code == 200

    specials_res = await client.get("/api/v1/customer/menu/specials")
    assert specials_res.status_code == 200

    popular_res = await client.get("/api/v1/customer/menu/popular")
    assert popular_res.status_code == 200

    rec_res = await client.get("/api/v1/customer/menu/recommended")
    assert rec_res.status_code == 200

    # 3. Cart & Coupon & Checkout Summaries
    cart_res = await client.get("/api/v1/customer/cart", headers=headers)
    assert cart_res.status_code == 200
    assert cart_res.json()["total_items"] == 0

    coupons_res = await client.get("/api/v1/customer/coupons")
    assert coupons_res.status_code == 200

    checkout_summary = await client.post("/api/v1/customer/checkout/summary", headers=headers)
    assert checkout_summary.status_code == 200
    assert checkout_summary.json()["total_amount"] == 0.0

@pytest.mark.asyncio
async def test_customer_loyalty_notifications_placeholders(client: AsyncClient):
    signup_res = await client.post("/api/v1/customer/auth/signup", json={
        "email": "loyalty_cust@smartserve.com",
        "password": "Password123!",
        "full_name": "Loyalty Customer",
        "role": "customer"
    })
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Loyalty
    loyalty_res = await client.get("/api/v1/customer/loyalty", headers=headers)
    assert loyalty_res.status_code == 200
    assert loyalty_res.json()["current_tier"] == "bronze"

    rewards_res = await client.get("/api/v1/customer/loyalty/rewards", headers=headers)
    assert rewards_res.status_code == 200

    # Notifications
    notif_res = await client.get("/api/v1/customer/notifications", headers=headers)
    assert notif_res.status_code == 200

    # Placeholders
    rev_res = await client.get("/api/v1/customer/reviews/placeholder")
    assert rev_res.status_code == 200

    fav_res = await client.get("/api/v1/customer/favorites/placeholder")
    assert fav_res.status_code == 200
