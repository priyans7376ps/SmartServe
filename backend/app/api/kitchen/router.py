"""
SmartServe Kitchen API Router
Complete production-ready endpoints for Kitchen Staff & Display System.
"""

from typing import Optional, List, Dict, Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_kitchen, get_optional_current_user
from app.models.user import User, UserRole
from app.models.order import OrderStatus
from app.schemas.auth import UserResponse, TokenResponse, UserLogin as LoginRequest
from app.schemas.menu import MenuItemCreate, MenuItemUpdate, MenuItemResponse
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

from app.services.auth_service import AuthService
from app.services.kitchen_service import KitchenService
from app.services.menu_service import MenuService
from app.services.category_service import CategoryService
from app.services.image_service import ImageUploadService
from app.repositories.notification_repository import NotificationRepository

router = APIRouter()

# -----------------------------------------------------------------------------
# 1. AUTHENTICATION & STATUS
# -----------------------------------------------------------------------------
@router.get("/status", summary="Check kitchen access status")
async def get_kitchen_status(current_user: User = Depends(get_current_kitchen)):
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "message": "Welcome to the Kitchen Display System",
        "user": UserResponse.model_validate(current_user)
    }

@router.post("/auth/login", response_model=TokenResponse, summary="Kitchen Staff Login")
async def kitchen_login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    response = await auth_service.login(request)
    if response.user.role not in [UserRole.KITCHEN, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kitchen staff permission required."
        )
    return response

@router.post("/auth/logout", summary="Kitchen Logout")
async def kitchen_logout(current_user: Optional[User] = Depends(get_optional_current_user)):
    return {"status": "success", "message": "Kitchen staff logged out successfully"}

# -----------------------------------------------------------------------------
# 2. DASHBOARD APIs
# -----------------------------------------------------------------------------
@router.get("/dashboard/stats", summary="Get Kitchen Dashboard Statistics")
async def get_dashboard_stats(
    restaurant_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.get_dashboard_stats(restaurant_id)

@router.get("/dashboard/performance", summary="Get Kitchen Performance Metrics")
async def get_dashboard_performance(
    restaurant_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.get_dashboard_performance(restaurant_id)

# -----------------------------------------------------------------------------
# 3. LIVE ORDER QUEUE & DETAILS
# -----------------------------------------------------------------------------
@router.get("/orders", summary="Get Live Order Queue")
async def get_active_orders(
    restaurant_id: Optional[uuid.UUID] = None,
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, preparing, ready, completed, active"),
    search: Optional[str] = Query(None, description="Search by order number, customer name, phone"),
    priority: Optional[str] = Query(None, description="Filter by priority: high, medium, low"),
    sort_by: str = Query("placed_at", description="Sort by placed_at or priority"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.get_active_queue(
        restaurant_id=restaurant_id,
        status_filter=status,
        search=search,
        priority_filter=priority,
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )

@router.get("/orders/{order_id}", summary="Get Order Details for Kitchen")
async def get_kitchen_order_details(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    order = await service.get_order_details(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order

# -----------------------------------------------------------------------------
# 4. ORDER STATUS TRANSITION WORKFLOW APIs
# -----------------------------------------------------------------------------
@router.post("/orders/{order_id}/accept", summary="Accept Order")
async def accept_order(
    order_id: uuid.UUID,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.update_order_status(
        order_id=order_id,
        target_status=OrderStatus.CONFIRMED,
        changed_by_user=current_user,
        notes=notes or "Order accepted by kitchen"
    )

@router.post("/orders/{order_id}/reject", summary="Reject Order")
async def reject_order(
    order_id: uuid.UUID,
    reason: Optional[str] = Query("Item unavailable / Out of stock"),
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.update_order_status(
        order_id=order_id,
        target_status=OrderStatus.CANCELLED,
        changed_by_user=current_user,
        notes=f"Order rejected by kitchen. Reason: {reason}"
    )

@router.post("/orders/{order_id}/preparing", summary="Mark Order as Preparing")
async def start_preparing_order(
    order_id: uuid.UUID,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.update_order_status(
        order_id=order_id,
        target_status=OrderStatus.PREPARING,
        changed_by_user=current_user,
        notes=notes or "Preparation started by chef"
    )

@router.post("/orders/{order_id}/ready", summary="Mark Order as Ready")
async def mark_order_ready(
    order_id: uuid.UUID,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.update_order_status(
        order_id=order_id,
        target_status=OrderStatus.READY,
        changed_by_user=current_user,
        notes=notes or "Order is ready for serving/pickup"
    )

@router.post("/orders/{order_id}/completed", summary="Mark Order as Completed")
async def mark_order_completed(
    order_id: uuid.UUID,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.update_order_status(
        order_id=order_id,
        target_status=OrderStatus.COMPLETED,
        changed_by_user=current_user,
        notes=notes or "Order served and completed"
    )

@router.post("/orders/{order_id}/cancel", summary="Cancel Order")
async def cancel_kitchen_order(
    order_id: uuid.UUID,
    reason: Optional[str] = Query("Cancelled by kitchen"),
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = KitchenService(db)
    return await service.update_order_status(
        order_id=order_id,
        target_status=OrderStatus.CANCELLED,
        changed_by_user=current_user,
        notes=reason
    )

# -----------------------------------------------------------------------------
# 5 & 6. MENU & CATEGORY MANAGEMENT FOR KITCHEN
# -----------------------------------------------------------------------------
@router.post("/menu/upload-image", summary="Upload Menu Item Image to Cloudinary")
async def upload_menu_item_image(
    file: Optional[UploadFile] = File(None, description="JPG, PNG, or WEBP image — max 5 MB"),
    image: Optional[UploadFile] = File(None, description="Alternative field name for image file"),
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a menu item image to Cloudinary.

    - Authentication: Kitchen / Admin / Super Admin only.
    - Accepted formats: JPEG, JPG, PNG, WEBP.
    - Maximum size: 5 MB.
    - Images are stored under: smartserve/menu-items/
    - Returns: image_url (Cloudinary HTTPS URL) + image_public_id.
    - The Cloudinary API secret is NEVER returned in this response.
    """
    upload_file = file or image
    if not upload_file:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image file is required (form-data field 'file' or 'image')."
        )
    service = ImageUploadService()
    result = await service.upload_image(upload_file, folder="smartserve/menu-items")
    return {
        "success": True,
        "message": "Menu image uploaded successfully.",
        "data": {
            "image_url": result.url,
            "image_public_id": result.public_id,
        }
    }

@router.post("/menu", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED, summary="Create Menu Item")
async def create_kitchen_menu_item(
    data: MenuItemCreate,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.create_menu_item(data)

@router.put("/menu/{item_id}", response_model=MenuItemResponse, summary="Update Menu Item (PUT)")
@router.patch("/menu/{item_id}", response_model=MenuItemResponse, summary="Update Menu Item (PATCH)")
async def update_kitchen_menu_item(
    item_id: uuid.UUID,
    data: MenuItemUpdate,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.update_menu_item(item_id, data)

@router.delete("/menu/{item_id}", summary="Delete Menu Item")
async def delete_kitchen_menu_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.delete_menu_item(item_id)
 
@router.get("/categories", response_model=List[CategoryResponse], summary="List Categories")
async def list_kitchen_categories(
    restaurant_id: Optional[uuid.UUID] = Query(None, description="Restaurant UUID"),
    active_only: bool = Query(True, description="Filter active categories"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    return await service.list_categories(restaurant_id, active_only=active_only, skip=skip, limit=limit)

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, summary="Create Category")
async def create_kitchen_category(
    data: CategoryCreate,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    return await service.create_category(data)

@router.patch("/categories/{category_id}", response_model=CategoryResponse, summary="Update Category")
async def update_kitchen_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    return await service.update_category(category_id, data)

@router.delete("/categories/{category_id}", summary="Delete Category")
async def delete_kitchen_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    return await service.delete_category(category_id)

# -----------------------------------------------------------------------------
# 7. KITCHEN NOTIFICATIONS
# -----------------------------------------------------------------------------
@router.get("/notifications", summary="Get Kitchen Notifications")
async def get_kitchen_notifications(
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    notifs = await repo.get_user_notifications(current_user.id, unread_only=unread_only)
    return [
        {
            "id": str(n.id),
            "type": n.type.value,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifs
    ]

@router.patch("/notifications/{notification_id}/read", summary="Mark Kitchen Notification Read")
async def mark_kitchen_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    n = await repo.mark_as_read(notification_id, current_user.id)
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "success", "message": "Notification marked as read"}

@router.delete("/notifications/{notification_id}", summary="Delete Kitchen Notification")
async def delete_kitchen_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_kitchen),
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    deleted = await repo.delete(notification_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "success", "message": "Notification deleted"}
