import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_kitchen_auth_and_status(client: AsyncClient):
    # 1. Signup kitchen user
    signup_res = await client.post("/api/v1/auth/signup", json={
        "email": "head_chef@smartserve.com",
        "password": "Password123!",
        "full_name": "Head Chef Gordon",
        "role": "kitchen"
    })
    assert signup_res.status_code == 201
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check kitchen status
    status_res = await client.get("/api/v1/kitchen/status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "authorized"
    assert status_res.json()["role"] == "kitchen"

    # 3. Kitchen Login via /kitchen/auth/login
    login_res = await client.post("/api/v1/kitchen/auth/login", json={
        "email": "head_chef@smartserve.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

@pytest.mark.asyncio
async def test_kitchen_dashboard_and_order_queue(client: AsyncClient):
    # Kitchen auth
    signup_res = await client.post("/api/v1/auth/signup", json={
        "email": "chef_queue@smartserve.com",
        "password": "Password123!",
        "full_name": "Chef Mario",
        "role": "kitchen"
    })
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Dashboard Stats & Performance
    stats_res = await client.get("/api/v1/kitchen/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    assert "today_orders" in stats_res.json()
    assert "average_cooking_time" in stats_res.json()

    perf_res = await client.get("/api/v1/kitchen/dashboard/performance", headers=headers)
    assert perf_res.status_code == 200
    assert "completion_rate" in perf_res.json()

    # Active Queue
    queue_res = await client.get("/api/v1/kitchen/orders", headers=headers)
    assert queue_res.status_code == 200
    assert "orders" in queue_res.json()

@pytest.mark.asyncio
async def test_kitchen_menu_and_notifications(client: AsyncClient):
    signup_res = await client.post("/api/v1/auth/signup", json={
        "email": "chef_menu@smartserve.com",
        "password": "Password123!",
        "full_name": "Chef Remy",
        "role": "kitchen"
    })
    token = signup_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Notifications
    notif_res = await client.get("/api/v1/kitchen/notifications", headers=headers)
    assert notif_res.status_code == 200
    assert isinstance(notif_res.json(), list)
