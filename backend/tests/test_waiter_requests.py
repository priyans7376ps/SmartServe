import pytest
from httpx import AsyncClient
from app.core.config import settings

@pytest.mark.asyncio
async def test_public_customer_restaurant_endpoint(client: AsyncClient):
    # Public endpoint without auth
    res = await client.get("/api/v1/customer/restaurant")
    assert res.status_code == 200
    data = res.json()
    assert "name" in data
    # Ensure sensitive credentials are NOT exposed
    assert "stripe_secret_key" not in data
    assert "jwt_secret" not in data
    assert "admin_password" not in data


@pytest.mark.asyncio
async def test_customer_call_waiter_and_kitchen_flow(client: AsyncClient):
    # 1. Customer calls waiter
    payload = {
        "table_number": 4,
        "request_type": "CALL_WAITER",
        "notes": "Need extra water glasses"
    }
    call_res = await client.post("/api/v1/customer/call-waiter", json=payload)
    assert call_res.status_code == 201
    call_data = call_res.json()
    assert str(call_data["table_number"]) == "4"
    assert call_data["status"] == "pending"
    request_id = call_data["id"]

    # 2. Customer checks status
    status_res = await client.get(f"/api/v1/customer/waiter-status/{request_id}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "pending"

    # 3. Unauthenticated access to kitchen waiter requests fails
    unauth_res = await client.get("/api/v1/kitchen/waiter-requests")
    assert unauth_res.status_code == 401

    # 4. Kitchen staff logs in
    kitchen_login = await client.post(
        "/api/v1/kitchen/auth/login",
        json={"email": settings.KITCHEN_EMAIL, "password": settings.KITCHEN_PASSWORD}
    )
    assert kitchen_login.status_code == 200
    kitchen_token = kitchen_login.json()["access_token"]
    kitchen_headers = {"Authorization": f"Bearer {kitchen_token}"}

    # 5. Kitchen fetches pending requests
    kitchen_reqs = await client.get("/api/v1/kitchen/waiter-requests", headers=kitchen_headers)
    assert kitchen_reqs.status_code == 200
    req_list = kitchen_reqs.json()
    assert any(r["id"] == request_id and str(r["table_number"]) == "4" for r in req_list)

    # 6. Kitchen acknowledges the request
    ack_res = await client.patch(
        f"/api/v1/kitchen/waiter-requests/{request_id}/status",
        json={"status": "acknowledged"},
        headers=kitchen_headers
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "acknowledged"

    # 7. Verify customer status sees acknowledgement
    status_res2 = await client.get(f"/api/v1/customer/waiter-status/{request_id}")
    assert status_res2.status_code == 200
    assert status_res2.json()["status"] == "acknowledged"

    # 8. Kitchen resolves the request
    resolve_res = await client.patch(
        f"/api/v1/kitchen/waiter-requests/{request_id}/status",
        json={"status": "resolved"},
        headers=kitchen_headers
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "resolved"
    assert resolve_res.json()["resolved_at"] is not None
