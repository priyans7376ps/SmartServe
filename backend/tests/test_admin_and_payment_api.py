import pytest
import hmac
import hashlib
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient
from app.core.config import settings
from app.models.user import UserRole
from app.models.order import Order, OrderStatus, OrderType
from tests.conftest import FakeSession


def add_to_session(obj):
    fs = FakeSession()
    fs.add(obj)


@pytest.mark.asyncio
async def test_admin_rbac_protection(client: AsyncClient):
    # Register customer user via auth signup
    cust_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": "cust_test_rbac@example.com",
            "password": "password123",
            "full_name": "Test Customer",
            "role": "customer"
        }
    )
    assert cust_res.status_code == 201
    cust_token = cust_res.json()["access_token"]

    resp = await client.get("/api/v1/admin/status", headers={"Authorization": f"Bearer {cust_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_dashboard_stats(client: AsyncClient):
    admin_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": "admin_dash@example.com",
            "password": "password123",
            "full_name": "Admin Dash",
            "role": "admin"
        }
    )
    assert admin_res.status_code == 201
    admin_token = admin_res.json()["access_token"]

    resp = await client.get("/api/v1/admin/dashboard/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "today_revenue" in data
    assert "today_orders" in data
    assert "completed_orders" in data
    assert "restaurant_name" in data


@pytest.mark.asyncio
async def test_admin_revenue_analytics(client: AsyncClient):
    admin_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": "admin_rev@example.com",
            "password": "password123",
            "full_name": "Admin Rev",
            "role": "admin"
        }
    )
    assert admin_res.status_code == 201
    admin_token = admin_res.json()["access_token"]

    resp = await client.get("/api/v1/admin/analytics/revenue", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total_sales" in data
    assert "net_revenue" in data
    assert "avg_order_value" in data


@pytest.mark.asyncio
async def test_razorpay_create_order_and_verify(client: AsyncClient):
    order_id = uuid.uuid4()
    order = Order(
        id=order_id,
        restaurant_id=uuid.uuid4(),
        order_number="ORD-1001",
        order_type=OrderType.DINE_IN,
        status=OrderStatus.PENDING,
        total_amount=500.0,
        subtotal=450.0,
        tax_amount=25.0,
        service_charge=25.0,
        customer_name="John Doe",
        customer_email="john@example.com",
        placed_at=datetime.now(timezone.utc)
    )
    add_to_session(order)

    # 1. Create Razorpay order
    resp = await client.post(
        "/api/v1/payments/create-order",
        json={"order_id": str(order_id)}
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["amount"] == 50000  # 500 INR in paise
    assert "razorpay_order_id" in data

    rzp_order_id = data["razorpay_order_id"]
    rzp_payment_id = "pay_test_9999"

    # Compute valid HMAC-SHA256 signature
    msg = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    valid_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    # 2. Verify signature - invalid signature
    bad_resp = await client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": str(order_id),
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": "invalid_signature_hash"
        }
    )
    assert bad_resp.status_code == 400

    # 3. Verify signature - valid signature
    good_resp = await client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": str(order_id),
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert good_resp.status_code == 200
    res_data = good_resp.json()
    assert res_data["success"] is True
    assert res_data["order_status"] == OrderStatus.CONFIRMED.value


@pytest.mark.asyncio
async def test_razorpay_webhook(client: AsyncClient):
    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_123",
                    "order_id": "order_rzp_mock",
                    "amount": 50000,
                    "status": "captured"
                }
            }
        }
    }
    import json
    body_str = json.dumps(webhook_payload)
    sig = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        body_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    resp = await client.post(
        "/api/v1/payments/webhook/razorpay",
        content=body_str,
        headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["processed", "ignored"]
