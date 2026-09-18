"""
SmartServe Admin API Router
Includes protected endpoints for all 11 Admin Portal modules.
Enforces strict server-side Admin role check (`get_current_admin`).
"""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, status, Query, HTTPException, Body, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.deps import get_db, get_current_admin, EnvPrincipal
from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.coupon import Coupon
from app.models.complaint import Complaint
from app.models.notification import Notification
from app.models.audit_log import AuditLog

from app.services.admin_service import AdminService
from app.services.payment_service import PaymentService
from app.repositories.order_repository import OrderRepository
from app.repositories.coupon_repository import CouponRepository
from app.repositories.audit_repository import AuditRepository

from app.schemas.auth import UserResponse
from app.schemas.admin import (
    DashboardStatsResponse,
    RevenueAnalyticsResponse,
    StaffCreate,
    StaffUpdate,
    StaffResponse,
    ComplaintUpdateAdmin,
    ComplaintResponse,
    CouponCreate,
    CouponUpdate,
    CouponResponse,
    RestaurantSettingsUpdate,
    AdminProfileUpdate,
    ChangePasswordRequest,
    AuditLogResponse,
)
from app.schemas.payment import PaymentResponse, RefundPaymentRequest

router = APIRouter()


@router.get("/status", summary="Check admin access status")
async def get_admin_status(current_user: User = Depends(get_current_admin)):
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "message": "Welcome to the Admin Portal",
        "user": UserResponse.model_validate(current_user)
    }


# -------------------------------------------------------------
# 1. DASHBOARD ANALYTICS & OVERVIEW
# -------------------------------------------------------------
@router.get("/dashboard/stats", response_model=DashboardStatsResponse, summary="Get real-time dashboard statistics")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_dashboard_stats()


@router.get("/dashboard/hourly", summary="Get hourly revenue & order velocity")
async def get_hourly_revenue(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_hourly_revenue()


@router.get("/dashboard/category-sales", summary="Get sales by category breakdown")
async def get_category_sales(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_category_sales()


@router.get("/dashboard", summary="Get comprehensive dashboard overview")
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_dashboard_overview()


# -------------------------------------------------------------
# 2. REVENUE & EXECUTIVE ANALYTICS
# -------------------------------------------------------------
@router.get("/analytics/revenue", response_model=RevenueAnalyticsResponse, summary="Get revenue analytics")
async def get_revenue_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    timeframe: Optional[str] = Query("daily"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_revenue_analytics(start_date=start_date, end_date=end_date, timeframe=timeframe)


@router.get("/analytics", summary="Get executive analytics (alias)")
async def get_analytics_alias(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    timeframe: Optional[str] = Query("daily"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_revenue_analytics(start_date=start_date, end_date=end_date, timeframe=timeframe)


# -------------------------------------------------------------
# 3. ORDER MANAGEMENT
# -------------------------------------------------------------
@router.get("/orders", summary="List all orders with filters")
async def list_admin_orders(
    query: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    order_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    order_repo = OrderRepository(db)
    orders, total = await order_repo.search_orders(
        query=query,
        status=status,
        payment_status=payment_status,
        payment_method=payment_method,
        date_from=date_from,
        date_to=date_to,
        order_type=order_type,
        skip=skip,
        limit=limit
    )
    return {
        "items": [
            {
                "id": str(o.id),
                "order_number": o.order_number,
                "token_number": o.token_number,
                "customer_name": o.customer_name or (o.user.full_name if o.user else "Guest"),
                "customer_phone": o.customer_phone,
                "customer_email": o.customer_email,
                "table_number": o.table.table_number if o.table else None,
                "order_type": o.order_type.value if hasattr(o.order_type, 'value') else str(o.order_type),
                "status": o.status.value if hasattr(o.status, 'value') else str(o.status),
                "payment_status": o.payment_status,
                "payment_method": o.payment_method,
                "total_amount": o.total_amount,
                "item_count": len(o.items) if o.items else 0,
                "items": [
                    {
                        "name": i.item_name,
                        "item_name": i.item_name,
                        "quantity": i.quantity,
                        "unit_price": i.unit_price,
                        "subtotal": i.subtotal,
                        "variant_selected": i.variant_selected,
                        "add_ons_selected": i.add_ons_selected
                    }
                    for i in (o.items or [])
                ],
                "placed_at": o.placed_at.isoformat() if o.placed_at else None,
            }
            for o in orders
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/orders/{order_id}", summary="Get order details (Admin)")
async def get_order_details(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    details = await service.get_order_details(order_id)
    if not details:
        raise HTTPException(status_code=404, detail="Order not found")
    return details


@router.patch("/orders/{order_id}/status", summary="Update order status (Admin)")
async def update_order_status(
    order_id: uuid.UUID,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    order_repo = OrderRepository(db)
    audit_repo = AuditRepository(db)
    order = await order_repo.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = payload.get("status")
    if new_status:
        try:
            order.status = OrderStatus(new_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid order status: {new_status}")

    if "payment_status" in payload:
        order.payment_status = payload["payment_status"]
    if "cancellation_reason" in payload:
        order.cancellation_reason = payload["cancellation_reason"]

    db.add(order)
    await db.commit()

    await audit_repo.log_action(
        admin_id=admin.id,
        action="ORDER_STATUS_UPDATED",
        resource_type="order",
        resource_id=str(order.id),
        details=payload
    )
    return {
        "message": "Order status updated successfully",
        "order_id": str(order.id),
        "status": order.status.value if hasattr(order.status, 'value') else str(order.status)
    }


@router.post("/orders/{order_id}/cancel", summary="Cancel order (Admin action)")
async def cancel_order(
    order_id: uuid.UUID,
    reason: Optional[str] = Body(None, embed=True),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    order_repo = OrderRepository(db)
    audit_repo = AuditRepository(db)
    order = await order_repo.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status in [OrderStatus.COMPLETED, OrderStatus.DELIVERED]:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or delivered order")

    order.status = OrderStatus.CANCELLED
    order.cancellation_reason = reason or "Cancelled by Administrator"
    db.add(order)
    await db.commit()

    await audit_repo.log_action(
        admin_id=admin.id,
        action="ORDER_CANCELLED",
        resource_type="order",
        resource_id=str(order.id),
        details={"reason": order.cancellation_reason}
    )
    return {"message": "Order cancelled successfully", "order_id": order.id}


# -------------------------------------------------------------
# 4. PAYMENT MANAGEMENT
# -------------------------------------------------------------
@router.get("/payments", summary="List payment records")
async def list_payments(
    query: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = PaymentService(db)
    items, total = await service.payment_repo.search_payments(query=query, status=status, method=method, skip=skip, limit=limit)
    return {
        "items": [PaymentResponse.model_validate(p) for p in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/payments/{payment_id}/refund", response_model=PaymentResponse, summary="Process refund")
async def refund_payment(
    payment_id: uuid.UUID,
    payload: RefundPaymentRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = PaymentService(db)
    return await service.process_refund(payment_id=payment_id, amount=payload.amount, reason=payload.reason, admin_user=admin)


# -------------------------------------------------------------
# 5. CUSTOMER MANAGEMENT
# -------------------------------------------------------------
@router.get("/customers", summary="List customers")
async def list_customers(
    query: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    items, total = await service.list_customers(query=query, skip=skip, limit=limit)
    return {"items": items, "total": total}


@router.get("/customers/{customer_id}", summary="Get customer details")
async def get_customer_details(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    customer = await service.get_customer_details(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# -------------------------------------------------------------
# 6. STAFF MANAGEMENT
# -------------------------------------------------------------
@router.get("/staff", response_model=List[StaffResponse], summary="List staff members")
async def list_staff(
    query: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    items, _ = await service.list_staff(query=query, role=role, skip=skip, limit=limit)
    return items


@router.get("/staff/{staff_id}", response_model=StaffResponse, summary="Get staff member details")
async def get_staff_member(
    staff_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    user_res = await db.execute(select(User).where(User.id == staff_id))
    staff = user_res.scalars().first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.post("/staff", response_model=StaffResponse, status_code=status.HTTP_201_CREATED, summary="Create new staff member")
async def create_staff(
    payload: StaffCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.create_staff(payload.model_dump(), admin_user=admin)


@router.put("/staff/{staff_id}", response_model=StaffResponse, summary="Update staff member")
async def update_staff(
    staff_id: uuid.UUID,
    payload: StaffUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.update_staff(staff_id, payload.model_dump(exclude_unset=True), admin_user=admin)


@router.patch("/staff/{staff_id}", response_model=StaffResponse, summary="Update staff member (PATCH alias)")
async def patch_staff(
    staff_id: uuid.UUID,
    payload: StaffUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.update_staff(staff_id, payload.model_dump(exclude_unset=True), admin_user=admin)


# -------------------------------------------------------------
# 7. COMPLAINT MANAGEMENT
# -------------------------------------------------------------
@router.get("/complaints", summary="List customer complaints")
async def list_complaints(
    query: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    items, total = await service.complaint_repo.search_complaints(query=query, status=status, priority=priority, skip=skip, limit=limit)
    return {
        "items": [
            {
                "id": str(c.id),
                "customer_name": c.user.full_name if c.user else "Customer",
                "customer_email": c.contact_email or (c.user.email if c.user else None),
                "order_id": str(c.order_id) if c.order_id else None,
                "subject": c.subject,
                "description": c.description,
                "category": c.category,
                "priority": c.priority.value if hasattr(c.priority, 'value') else str(c.priority),
                "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
                "resolution_notes": c.resolution_notes,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in items
        ],
        "total": total
    }


@router.get("/complaints/{complaint_id}", summary="Get complaint details")
async def get_complaint_details(
    complaint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    c = await service.complaint_repo.get_by_id(complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {
        "id": str(c.id),
        "customer_name": c.user.full_name if c.user else "Customer",
        "customer_email": c.contact_email or (c.user.email if c.user else None),
        "order_id": str(c.order_id) if c.order_id else None,
        "subject": c.subject,
        "description": c.description,
        "category": c.category,
        "priority": c.priority.value if hasattr(c.priority, 'value') else str(c.priority),
        "status": c.status.value if hasattr(c.status, 'value') else str(c.status),
        "resolution_notes": c.resolution_notes,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.patch("/complaints/{complaint_id}", summary="Update complaint status & response")
async def update_complaint(
    complaint_id: uuid.UUID,
    payload: ComplaintUpdateAdmin,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.update_complaint_status(complaint_id, payload.model_dump(exclude_unset=True), admin_user=admin)


# -------------------------------------------------------------
# 8. COUPON MANAGEMENT
# -------------------------------------------------------------
@router.get("/coupons", response_model=List[CouponResponse], summary="List coupons")
async def list_coupons(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    coupon_repo = CouponRepository(db)
    items = await coupon_repo.get_all()
    return items


@router.get("/coupons/{coupon_id}", response_model=CouponResponse, summary="Get coupon details")
async def get_coupon(
    coupon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    coupon_repo = CouponRepository(db)
    coupon = await coupon_repo.get_by_id(coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon


@router.post("/coupons", response_model=CouponResponse, status_code=201, summary="Create coupon")
async def create_coupon(
    payload: CouponCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    coupon_repo = CouponRepository(db)
    audit_repo = AuditRepository(db)

    # Get active restaurant
    rest_res = await db.execute(select(User).where(User.id == admin.id))
    rest_user = rest_res.scalars().first()
    restaurant_id = rest_user.restaurant_id if rest_user and rest_user.restaurant_id else uuid.uuid4()

    existing = await coupon_repo.get_by_code(payload.code)
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    data = payload.model_dump()
    data["restaurant_id"] = restaurant_id
    coupon = await coupon_repo.create(data)

    await audit_repo.log_action(
        admin_id=admin.id,
        action="COUPON_CREATED",
        resource_type="coupon",
        resource_id=str(coupon.id),
        details={"code": coupon.code}
    )
    return coupon


@router.put("/coupons/{coupon_id}", response_model=CouponResponse, summary="Update coupon")
async def update_coupon(
    coupon_id: uuid.UUID,
    payload: CouponUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    coupon_repo = CouponRepository(db)
    audit_repo = AuditRepository(db)
    coupon = await coupon_repo.get_by_id(coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    updated = await coupon_repo.update(coupon, payload.model_dump(exclude_unset=True))
    await audit_repo.log_action(
        admin_id=admin.id,
        action="COUPON_UPDATED",
        resource_type="coupon",
        resource_id=str(coupon.id),
        details=payload.model_dump(exclude_unset=True)
    )
    return updated


@router.patch("/coupons/{coupon_id}", response_model=CouponResponse, summary="Update coupon (PATCH alias)")
async def patch_coupon(
    coupon_id: uuid.UUID,
    payload: CouponUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return await update_coupon(coupon_id, payload, db, admin)


@router.delete("/coupons/{coupon_id}", status_code=204, summary="Delete coupon")
async def delete_coupon(
    coupon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    coupon_repo = CouponRepository(db)
    audit_repo = AuditRepository(db)
    await coupon_repo.delete(coupon_id)
    await audit_repo.log_action(
        admin_id=admin.id,
        action="COUPON_DELETED",
        resource_type="coupon",
        resource_id=str(coupon_id)
    )
    return None


# -------------------------------------------------------------
# 9. REPORTS & AUDIT EXPORTS
# -------------------------------------------------------------
@router.get("/reports/{report_type}", summary="Generate Admin Report Data")
async def get_report(
    report_type: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_report_data(report_type=report_type, start_date=start_date, end_date=end_date)


@router.get("/reports/{report_type}/export", summary="Export Real RFC-4180 CSV Report")
async def export_report_csv(
    report_type: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    service = AdminService(db)
    csv_content = await service.export_report_csv(report_type=report_type, start_date=start_date, end_date=end_date)
    start_str = start_date.strftime("%Y%m%d") if start_date else "all"
    end_str = end_date.strftime("%Y%m%d") if end_date else "now"
    filename = f"{report_type}_report_{start_str}_{end_str}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        }
    )


# -------------------------------------------------------------
# 10. RESTAURANT SETTINGS
# -------------------------------------------------------------
@router.get("/restaurant", summary="Get restaurant settings")
async def get_restaurant(
    db: AsyncSession = Depends(get_db),
    admin: Union[User, EnvPrincipal] = Depends(get_current_admin)
):
    service = AdminService(db)
    rest = await service.get_restaurant_settings()
    return rest.to_dict()


@router.get("/settings", summary="Get restaurant settings (alias)")
async def get_settings_alias(
    db: AsyncSession = Depends(get_db),
    admin: Union[User, EnvPrincipal] = Depends(get_current_admin)
):
    service = AdminService(db)
    rest = await service.get_restaurant_settings()
    return rest.to_dict()


@router.put("/restaurant", summary="Update restaurant settings")
async def update_restaurant(
    payload: RestaurantSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Union[User, EnvPrincipal] = Depends(get_current_admin)
):
    service = AdminService(db)
    rest = await service.update_restaurant_settings(payload.model_dump(exclude_unset=True), admin_user=admin)
    return rest.to_dict()


@router.put("/settings", summary="Update restaurant settings (alias)")
async def update_settings_alias(
    payload: RestaurantSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Union[User, EnvPrincipal] = Depends(get_current_admin)
):
    service = AdminService(db)
    rest = await service.update_restaurant_settings(payload.model_dump(exclude_unset=True), admin_user=admin)
    return rest.to_dict()


@router.patch("/settings", summary="Patch restaurant settings (alias)")
async def patch_settings_alias(
    payload: RestaurantSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Union[User, EnvPrincipal] = Depends(get_current_admin)
):
    service = AdminService(db)
    rest = await service.update_restaurant_settings(payload.model_dump(exclude_unset=True), admin_user=admin)
    return rest.to_dict()


# -------------------------------------------------------------
# 11. NOTIFICATIONS
# -------------------------------------------------------------
@router.get("/notifications", summary="Get Admin Notifications")
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    res = await db.execute(select(Notification).where(Notification.user_id == admin.id).order_by(desc(Notification.created_at)))
    items = list(res.scalars().all())
    unread_count = sum(1 for n in items if not n.is_read)
    return {"items": items, "unread_count": unread_count}


# -------------------------------------------------------------
# 12. ADMIN PROFILE & AUTH
# -------------------------------------------------------------
@router.put("/profile", summary="Update Admin Profile")
async def update_profile(
    payload: AdminProfileUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None and hasattr(admin, k):
            setattr(admin, k, v)
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return UserResponse.model_validate(admin)


@router.post("/change-password", summary="Change Admin Password")
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if not verify_password(payload.current_password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    admin.hashed_password = get_password_hash(payload.new_password)
    db.add(admin)
    await db.commit()
    return {"message": "Password updated successfully"}


# -------------------------------------------------------------
# 13. AUDIT LOGS
# -------------------------------------------------------------
@router.get("/audit-logs", summary="List Audit Logs")
async def list_audit_logs(
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    audit_repo = AuditRepository(db)
    items, total = await audit_repo.search_logs(action=action, resource_type=resource_type, skip=skip, limit=limit)
    return {"items": [i.to_dict() for i in items], "total": total}
