import pytest
from httpx import AsyncClient
from app.core.config import settings

@pytest.mark.asyncio
async def test_restaurant_settings_rbac(client: AsyncClient):
    # 1. Unauthenticated GET -> 401
    res_unauth = await client.get("/api/v1/admin/restaurant")
    assert res_unauth.status_code == 401

    # 2. Unauthenticated PUT -> 401
    res_unauth_put = await client.put(
        "/api/v1/admin/restaurant",
        json={"name": "Hacked Bistro"}
    )
    assert res_unauth_put.status_code == 401

    # 3. Customer role token -> 403
    cust_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": "cust_rest_rbac@example.com",
            "password": "password123",
            "full_name": "Test Customer",
            "role": "customer"
        }
    )
    assert cust_res.status_code == 201
    cust_token = cust_res.json()["access_token"]

    res_cust_get = await client.get(
        "/api/v1/admin/restaurant",
        headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert res_cust_get.status_code == 403

    res_cust_put = await client.put(
        "/api/v1/admin/restaurant",
        json={"name": "Customer Bistro"},
        headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert res_cust_put.status_code == 403


@pytest.mark.asyncio
async def test_restaurant_settings_get_and_put_with_env_admin(client: AsyncClient):
    # 1. Login with ENV admin credentials
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. GET restaurant settings (safe initialization when missing)
    get_res = await client.get("/api/v1/admin/restaurant", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert "name" in data
    assert "address" in data
    assert "tax_rate" in data
    assert "opening_time" in data
    assert "closing_time" in data
    assert "gstin" in data
    assert "timezone" in data
    assert data["currency"] == "INR"

    # 3. PUT restaurant settings with frontend shape
    update_payload = {
        "name": "SmartServe Royal Bistro",
        "logo_url": "https://images.unsplash.com/photo-logo.png",
        "address": "456 Royal Crescent, Cyber City",
        "phone": "+91 99999 11111",
        "email": "contact@smartserveroyal.com",
        "gstin": "07AAAAA1111A1Z9",
        "tax_rate": 0.12,
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "opening_time": "08:30",
        "closing_time": "23:45",
        "is_open": True,
    }
    put_res = await client.put(
        "/api/v1/admin/restaurant",
        json=update_payload,
        headers=headers,
    )
    assert put_res.status_code == 200, f"PUT failed: {put_res.text}"
    put_data = put_res.json()
    assert put_data["name"] == "SmartServe Royal Bistro"
    assert put_data["address"] == "456 Royal Crescent, Cyber City"
    assert put_data["logo_url"] == "https://images.unsplash.com/photo-logo.png"
    assert put_data["phone"] == "+91 99999 11111"
    assert put_data["email"] == "contact@smartserveroyal.com"
    assert put_data["gstin"] == "07AAAAA1111A1Z9"
    assert put_data["tax_rate"] == 0.12
    assert put_data["opening_time"] == "08:30"
    assert put_data["closing_time"] == "23:45"
    assert put_data["is_open"] is True

    # 4. Persistence verification: follow-up GET confirms updated values
    followup_res = await client.get("/api/v1/admin/restaurant", headers=headers)
    assert followup_res.status_code == 200
    followup_data = followup_res.json()
    assert followup_data["name"] == "SmartServe Royal Bistro"
    assert followup_data["address"] == "456 Royal Crescent, Cyber City"
    assert followup_data["gstin"] == "07AAAAA1111A1Z9"
    assert followup_data["tax_rate"] == 0.12
    assert followup_data["opening_time"] == "08:30"
    assert followup_data["closing_time"] == "23:45"


@pytest.mark.asyncio
async def test_restaurant_settings_nullable_and_partial_update(client: AsyncClient):
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Partial update with nullable/optional fields omitted
    partial_payload = {
        "name": "Updated Partial Bistro",
    }
    put_res = await client.put(
        "/api/v1/admin/restaurant",
        json=partial_payload,
        headers=headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "Updated Partial Bistro"


@pytest.mark.asyncio
async def test_restaurant_settings_invalid_payload_returns_4xx(client: AsyncClient):
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # tax_rate > 0.5 violates validation schema
    bad_payload = {
        "tax_rate": 1.5,
    }
    bad_res = await client.put(
        "/api/v1/admin/restaurant",
        json=bad_payload,
        headers=headers,
    )
    assert bad_res.status_code == 422


@pytest.mark.asyncio
async def test_restaurant_settings_direct_db_persistence_with_env_principal():
    from app.database.connection import async_session_factory, engine
    from app.database.base import BaseModel
    from app.services.admin_service import AdminService
    from app.core.deps import EnvPrincipal
    from app.models.user import UserRole
    from datetime import time

    # Initialize tables on engine
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)

    env_admin = EnvPrincipal(
        role=UserRole.ADMIN,
        email="admin@smartserve.com",
        full_name="Admin",
    )

    async with async_session_factory() as session:
        service = AdminService(session)
        # 1. Safe initialization
        rest = await service.get_restaurant_settings()
        assert rest is not None
        assert rest.name is not None

        # 2. Update with physical address, time conversion, and features
        updated = await service.update_restaurant_settings(
            {
                "name": "DB Direct Cafe",
                "address": "789 Innovation Parkway",
                "opening_time": "07:30",
                "closing_time": "22:15",
                "gstin": "29ABCDE1234F1Z5",
                "timezone": "Asia/Kolkata",
                "tax_rate": 0.07,
                "is_open": False,
            },
            admin_user=env_admin,
        )
        assert updated.name == "DB Direct Cafe"
        assert updated.address_line1 == "789 Innovation Parkway"
        assert updated.opening_time == time(7, 30)
        assert updated.closing_time == time(22, 15)
        assert updated.tax_rate == 0.07
        assert updated.is_open is False

        # 3. Verify to_dict output
        d = updated.to_dict()
        assert d["name"] == "DB Direct Cafe"
        assert d["address"] == "789 Innovation Parkway"
        assert d["opening_time"] == "07:30"
        assert d["closing_time"] == "22:15"
        assert d["gstin"] == "29ABCDE1234F1Z5"
        assert d["timezone"] == "Asia/Kolkata"
        assert d["is_open"] is False
