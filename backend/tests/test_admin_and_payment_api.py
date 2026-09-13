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


from unittest.mock import patch


@pytest.mark.asyncio
async def test_razorpay_create_order_and_verify(client: AsyncClient):
    order_id = uuid.uuid4()
    order = Order(
        id=order_id,
        restaurant_id=uuid.uuid4(),
        order_number="ORD-1001",
        order_type=OrderType.DINE_IN,
        status=OrderStatus.PENDING,
        payment_method="online",
        payment_status="pending",
        total_amount=500.0,
        subtotal=450.0,
        tax_amount=25.0,
        service_charge=25.0,
        customer_name="John Doe",
        customer_email="john@example.com",
        placed_at=datetime.now(timezone.utc)
    )
    add_to_session(order)

    # 1. Create Razorpay order (mocking external SDK API call)
    with patch("razorpay.resources.Order.create", return_value={"id": "order_rzp_mock1001"}):
        resp = await client.post(
            "/api/v1/payments/create-order",
            json={"order_id": str(order_id)}
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["amount"] == 50000  # 500 INR in paise, calculated strictly server-side
        assert data["razorpay_order_id"] == "order_rzp_mock1001"
        assert data["currency"] == "INR"

    rzp_order_id = data["razorpay_order_id"]
    rzp_payment_id = "pay_test_9999"

    # Compute valid HMAC-SHA256 signature using RAZORPAY_KEY_SECRET
    msg = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
    valid_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    # 2. Verify signature - invalid signature must be rejected with 400
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
    assert "invalid signature" in bad_resp.json()["detail"].lower()

    # 3. Verify signature - valid signature must succeed with 200
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
    assert res_data["payment_status"] == "completed"

    # 4. Duplicate verification idempotency - repeating verify call should return success without error
    dup_resp = await client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": str(order_id),
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert dup_resp.status_code == 200
    assert dup_resp.json()["success"] is True

    # 5. Prevent creating a new Razorpay order for an already-completed order
    with patch("razorpay.resources.Order.create", return_value={"id": "order_rzp_dup"}):
        recreate_resp = await client.post(
            "/api/v1/payments/create-order",
            json={"order_id": str(order_id)}
        )
        assert recreate_resp.status_code == 400
        assert "already been paid" in recreate_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_razorpay_order_id_mismatch(client: AsyncClient):
    order_id = uuid.uuid4()
    order = Order(
        id=order_id,
        restaurant_id=uuid.uuid4(),
        order_number="ORD-1002",
        order_type=OrderType.DINE_IN,
        status=OrderStatus.PENDING,
        payment_method="online",
        payment_status="pending",
        total_amount=250.0,
        subtotal=230.0,
        tax_amount=20.0,
        customer_name="Jane Doe",
        placed_at=datetime.now(timezone.utc)
    )
    add_to_session(order)

    with patch("razorpay.resources.Order.create", return_value={"id": "order_rzp_expected"}):
        await client.post(
            "/api/v1/payments/create-order",
            json={"order_id": str(order_id)}
        )

    # Submit with mismatched order ID
    mismatch_resp = await client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": str(order_id),
            "razorpay_order_id": "order_rzp_wrong",
            "razorpay_payment_id": "pay_test_0000",
            "razorpay_signature": "any_signature"
        }
    )
    assert mismatch_resp.status_code == 400
    assert "mismatch" in mismatch_resp.json()["detail"].lower()


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
