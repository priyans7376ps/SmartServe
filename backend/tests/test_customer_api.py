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


@pytest.mark.asyncio
async def test_customer_cart_item_lifecycle(client: AsyncClient):
    # Setup admin & restaurant
    admin_signup = await client.post("/api/v1/auth/signup", json={
        "email": "cart_admin@smartserve.com",
        "password": "Password123!",
        "full_name": "Cart Admin",
        "role": "admin"
    })
    admin_token = admin_signup.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    rest_res = await client.post("/api/v1/restaurants/", json={
        "name": "Cart Rest",
        "slug": "cart-rest"
    }, headers=admin_headers)
    rest_id = rest_res.json()["id"]

    # Setup kitchen user & category
    chef_signup = await client.post("/api/v1/auth/signup", json={
        "email": "cart_chef@smartserve.com",
        "password": "Password123!",
        "full_name": "Chef Cart",
        "role": "kitchen"
    })
    chef_token = chef_signup.json()["access_token"]
    chef_headers = {"Authorization": f"Bearer {chef_token}"}

    cat_res = await client.post("/api/v1/categories/", json={
        "restaurant_id": rest_id,
        "name": "Cart Delights"
    }, headers=chef_headers)
    cat_id = cat_res.json()["id"]

    # Create Item A (with compare_price)
    item_a_res = await client.post("/api/v1/menu/", json={
        "restaurant_id": rest_id,
        "category_id": cat_id,
        "name": "Special Burger",
        "price": 12.50,
        "compare_price": 15.00,
        "cost_price": 5.00,
        "is_available": True,
        "is_active": True
    }, headers=chef_headers)
    assert item_a_res.status_code == 201
    item_a_id = item_a_res.json()["id"]

    # Create Item B (simple)
    item_b_res = await client.post("/api/v1/menu/", json={
        "restaurant_id": rest_id,
        "category_id": cat_id,
        "name": "Fries",
        "price": 4.00,
        "cost_price": 1.00,
        "is_available": True,
        "is_active": True
    }, headers=chef_headers)
    assert item_b_res.status_code == 201
    item_b_id = item_b_res.json()["id"]

    # Customer Signup
    cust_signup = await client.post("/api/v1/customer/auth/signup", json={
        "email": "cart_lifecycle_cust@smartserve.com",
        "password": "Password123!",
        "full_name": "Cart Lifecycle User",
        "role": "customer"
    })
    cust_token = cust_signup.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Add Item A to Cart -> MUST return 200 OK (not 500)
    add_a_res = await client.post("/api/v1/customer/cart/items", json={
        "menu_item_id": item_a_id,
        "quantity": 1
    }, headers=cust_headers)
    assert add_a_res.status_code == 200
    cart_data = add_a_res.json()
    assert len(cart_data["items"]) == 1
    item_a_cart = cart_data["items"][0]
    assert item_a_cart["menu_item_id"] == item_a_id
    assert item_a_cart["unit_price"] == 12.50  # Must be MenuItem.price, NOT cost_price
    assert item_a_cart["compare_price"] == 15.00
    assert item_a_cart["quantity"] == 1
    assert item_a_cart["subtotal"] == 12.50

    # 2. Fetch Cart
    get_cart_res = await client.get("/api/v1/customer/cart", headers=cust_headers)
    assert get_cart_res.status_code == 200
    assert get_cart_res.json()["subtotal"] == 12.50

    # 3. Increase Quantity to 3
    cart_item_a_id = item_a_cart["id"]
    inc_res = await client.put(f"/api/v1/customer/cart/items/{cart_item_a_id}", json={
        "quantity": 3
    }, headers=cust_headers)
    assert inc_res.status_code == 200
    assert inc_res.json()["items"][0]["quantity"] == 3
    assert inc_res.json()["items"][0]["subtotal"] == 37.50

    # 4. Decrease Quantity to 2
    dec_res = await client.put(f"/api/v1/customer/cart/items/{cart_item_a_id}", json={
        "quantity": 2
    }, headers=cust_headers)
    assert dec_res.status_code == 200
    assert dec_res.json()["items"][0]["quantity"] == 2
    assert dec_res.json()["items"][0]["subtotal"] == 25.00

    # 5. Add Item B with Add-ons
    add_b_res = await client.post("/api/v1/customer/cart/items", json={
        "menu_item_id": item_b_id,
        "quantity": 2,
        "add_ons_selected": [{"name": "Extra Mayo", "price": 0.50}]
    }, headers=cust_headers)
    assert add_b_res.status_code == 200
    cart_data_2 = add_b_res.json()
    assert len(cart_data_2["items"]) == 2
    # Total subtotal = 25.00 (Item A) + (4.00 + 0.50)*2 = 25.00 + 9.00 = 34.00
    assert cart_data_2["subtotal"] == 34.00

    # 6. Remove Item A from cart
    rem_res = await client.delete(f"/api/v1/customer/cart/items/{cart_item_a_id}", headers=cust_headers)
    assert rem_res.status_code == 200
    assert len(rem_res.json()["items"]) == 1
    assert rem_res.json()["subtotal"] == 9.00

