"""
SmartServe Customer API Router
Complete RESTful customer endpoints covering all 17 customer modules.
"""

from typing import Optional, List, Dict, Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_customer, get_optional_current_user
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse, TokenResponse, UserLogin as LoginRequest, UserSignup as SignupRequest, RefreshTokenRequest
from app.schemas.customer import (
    GuestAuthRequest, GuestAuthResponse, ForgotPasswordRequest, ResetPasswordRequest,
    CustomerProfileUpdate, ChangePasswordRequest,
    CartItemAddRequest, CartItemUpdateRequest, CartResponse,
    CouponApplyRequest, CustomerCouponResponse,
    CheckoutSummaryRequest, CheckoutSummaryResponse,
    OrderCreateRequest, OrderTrackingResponse,
    LoyaltyPointsResponse, PointsTransactionResponse,
    CustomerNotificationResponse,
    ReviewPlaceholderRequest, ReviewPlaceholderResponse,
    FavoritePlaceholderRequest, FavoritePlaceholderResponse
)
from app.schemas.menu import MenuItemResponse, PaginatedMenuItemResponse
from app.schemas.category import CategoryResponse

from app.services.auth_service import AuthService
from app.services.customer_service import CustomerService
from app.services.menu_service import MenuService
from app.services.category_service import CategoryService
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.loyalty_service import LoyaltyService
from app.repositories.coupon_repository import CouponRepository
from app.repositories.notification_repository import NotificationRepository

router = APIRouter()

# -----------------------------------------------------------------------------
# 1 & 2. GUEST SESSION & CUSTOMER AUTHENTICATION
# -----------------------------------------------------------------------------
@router.get("/status", summary="Check customer access status")
async def get_customer_status(current_user: User = Depends(get_current_customer)):
    return {
        "status": "authorized",
        "role": current_user.role.value,
        "message": "Welcome to SmartServe Customer Portal",
        "user": UserResponse.model_validate(current_user)
    }

@router.post("/auth/guest", response_model=GuestAuthResponse, summary="Guest Session Creation")
async def create_guest_session(
    request: Optional[GuestAuthRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    sid = request.session_id if request else None
    return await service.create_guest_session(sid)

@router.post("/auth/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="Customer Signup")
async def customer_signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    # Ensure role is customer
    request.role = UserRole.CUSTOMER
    return await auth_service.signup(request)

@router.post("/auth/login", response_model=TokenResponse, summary="Customer Login")
async def customer_login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.login(request)

@router.post("/auth/refresh", response_model=TokenResponse, summary="Refresh Token")
async def customer_refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.refresh_token(request.refresh_token)

@router.post("/auth/logout", summary="Logout")
async def customer_logout(current_user: User = Depends(get_current_customer)):
    return {"status": "success", "message": "Successfully logged out"}

@router.post("/auth/forgot-password", summary="Forgot Password Placeholder")
async def forgot_password_placeholder(request: ForgotPasswordRequest):
    return {
        "status": "success",
        "message": f"Password reset instructions dispatched to {request.email} (Placeholder)"
    }

@router.post("/auth/reset-password", summary="Reset Password Placeholder")
async def reset_password_placeholder(request: ResetPasswordRequest):
    return {
        "status": "success",
        "message": "Password successfully reset (Placeholder)"
    }

@router.post("/auth/verify-email", summary="Email Verification Placeholder")
async def verify_email_placeholder(token: str):
    return {
        "status": "success",
        "message": "Email address verified successfully (Placeholder)"
    }

# -----------------------------------------------------------------------------
# 3. CUSTOMER PROFILE
# -----------------------------------------------------------------------------
@router.get("/profile", response_model=UserResponse, summary="Get Profile")
async def get_profile(current_user: User = Depends(get_current_customer)):
    return UserResponse.model_validate(current_user)

@router.patch("/profile", response_model=UserResponse, summary="Update Profile")
async def update_profile(
    data: CustomerProfileUpdate,
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    user = await service.update_profile(current_user.id, data)
    return UserResponse.model_validate(user)

@router.post("/profile/change-password", summary="Change Password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    return await service.change_password(current_user.id, data)

@router.delete("/profile", summary="Delete Account")
async def delete_account(
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    return await service.delete_account(current_user.id)

@router.post("/profile/image", summary="Profile Image Upload Placeholder")
async def profile_image_placeholder(
    current_user: User = Depends(get_current_customer)
):
    return {
        "status": "success",
        "message": "Profile avatar uploaded successfully (Placeholder)",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
    }

# -----------------------------------------------------------------------------
# 4, 5, 6, 7. RESTAURANT MENU, CATEGORIES, SEARCH, FILTERS
# -----------------------------------------------------------------------------
@router.get("/categories", response_model=List[CategoryResponse], summary="List Categories")
async def list_customer_categories(
    restaurant_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    if not restaurant_id:
        from app.repositories.restaurant_repository import RestaurantRepository
        rest_repo = RestaurantRepository(db)
        rests = await rest_repo.get_all(limit=1)
        if rests:
            restaurant_id = rests[0].id
    if not restaurant_id:
        return []
    return await service.list_categories(restaurant_id=restaurant_id, active_only=True)

@router.get("/menu", response_model=PaginatedMenuItemResponse, summary="List Menu")
async def list_customer_menu(
    restaurant_id: Optional[uuid.UUID] = None,
    category_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    is_veg: Optional[bool] = None,
    is_available: Optional[bool] = True,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.list_menu_items(
        restaurant_id=restaurant_id,
        category_id=category_id,
        search_query=search,
        is_veg=is_veg,
        is_available=is_available,
        min_price=min_price,
        max_price=max_price,
        page=page,
        limit=page_size
    )

@router.get("/menu/search", response_model=PaginatedMenuItemResponse, summary="Search Menu")
async def search_customer_menu(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = MenuService(db)
    return await service.list_menu_items(search_query=q, page=page, limit=page_size)

@router.get("/menu/specials", response_model=List[MenuItemResponse], summary="Today's Specials")
async def get_today_specials(db: AsyncSession = Depends(get_db)):
    service = MenuService(db)
    paginated = await service.list_menu_items(page=1, limit=10)
    return [item for item in paginated.items if item.is_featured or getattr(item, "is_todays_special", False)]

@router.get("/menu/popular", response_model=List[MenuItemResponse], summary="Popular Dishes")
async def get_popular_dishes(db: AsyncSession = Depends(get_db)):
    service = MenuService(db)
    paginated = await service.list_menu_items(page=1, limit=10)
    return paginated.items

@router.get("/menu/recommended", response_model=List[MenuItemResponse], summary="Recommended Items")
async def get_recommended_dishes(db: AsyncSession = Depends(get_db)):
    service = MenuService(db)
    paginated = await service.list_menu_items(page=1, limit=10)
    return paginated.items[:6]

@router.get("/menu/{item_id}", response_model=MenuItemResponse, summary="Menu Item Details")
async def get_menu_item_details(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = MenuService(db)
    return await service.get_menu_item(item_id)

# -----------------------------------------------------------------------------
# 8. CART
# -----------------------------------------------------------------------------
@router.get("/cart", response_model=CartResponse, summary="Get Cart")
async def get_cart(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartService(db)
    sid = x_session_id or session_id
    uid = current_user.id if current_user else None
    return await service.get_or_create_cart(user_id=uid, session_id=sid)

@router.post("/cart/items", response_model=CartResponse, summary="Add Item to Cart")
async def add_cart_item(
    request: CartItemAddRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartService(db)
    sid = x_session_id or session_id
    uid = current_user.id if current_user else None
    return await service.add_item_to_cart(
        menu_item_id=request.menu_item_id,
        quantity=request.quantity,
        user_id=uid,
        session_id=sid,
        notes=request.notes,
        variant_selected=request.variant_selected,
        add_ons_selected=request.add_ons_selected
    )

@router.put("/cart/items/{item_id}", response_model=CartResponse, summary="Update Cart Item Quantity")
async def update_cart_item(
    item_id: uuid.UUID,
    request: CartItemUpdateRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartService(db)
    sid = x_session_id or session_id
    uid = current_user.id if current_user else None
    return await service.update_item_quantity(item_id, request.quantity, user_id=uid, session_id=sid)

@router.delete("/cart/items/{item_id}", response_model=CartResponse, summary="Remove Item from Cart")
async def remove_cart_item(
    item_id: uuid.UUID,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartService(db)
    sid = x_session_id or session_id
    uid = current_user.id if current_user else None
    return await service.remove_item(item_id, user_id=uid, session_id=sid)

@router.delete("/cart", response_model=CartResponse, summary="Clear Cart")
async def clear_cart(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartService(db)
    sid = x_session_id or session_id
    uid = current_user.id if current_user else None
    return await service.clear_cart(user_id=uid, session_id=sid)

# -----------------------------------------------------------------------------
# 9. COUPONS
# -----------------------------------------------------------------------------
@router.get("/coupons", response_model=List[CustomerCouponResponse], summary="List Coupons")
async def list_available_coupons(db: AsyncSession = Depends(get_db)):
    repo = CouponRepository(db)
    coupons = await repo.get_public_active_coupons()
    return [CustomerCouponResponse.model_validate(c) for c in coupons]

@router.post("/cart/coupon", response_model=CartResponse, summary="Apply Coupon")
async def apply_coupon(
    request: CouponApplyRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartService(db)
    sid = x_session_id or session_id
    uid = current_user.id if current_user else None
    return await service.apply_coupon(request.code, user_id=uid, session_id=sid)

@router.delete("/cart/coupon", response_model=CartResponse, summary="Remove Coupon")
async def remove_coupon(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartService(db)
    sid = x_session_id or session_id
    uid = current_user.id if current_user else None
    return await service.remove_coupon(user_id=uid, session_id=sid)

# -----------------------------------------------------------------------------
# 10. CHECKOUT
# -----------------------------------------------------------------------------
@router.post("/checkout/summary", response_model=CheckoutSummaryResponse, summary="Generate Order Checkout Summary")
async def get_checkout_summary(
    request: Optional[CheckoutSummaryRequest] = None,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    sid = request.session_id if request else (x_session_id or None)
    uid = current_user.id if current_user else None
    return await service.get_checkout_summary(user_id=uid, session_id=sid)

@router.post("/checkout/payment-placeholder", summary="Prepare Payment Request Placeholder")
async def prepare_payment_placeholder(
    amount: float,
    payment_method: str = "upi"
):
    return {
        "status": "success",
        "message": "Payment gateway initialization placeholder",
        "transaction_ref": f"TXN-{str(uuid.uuid4())[:8].upper()}",
        "amount": amount,
        "payment_method": payment_method
    }

# -----------------------------------------------------------------------------
# 11, 12, 13. ORDERS, ORDER TRACKING, ORDER HISTORY
# -----------------------------------------------------------------------------
@router.post("/orders", status_code=status.HTTP_201_CREATED, summary="Place Order")
async def place_order(
    request: OrderCreateRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    sid = request.session_id or x_session_id
    uid = current_user.id if current_user else None
    order = await service.place_order(request=request, user_id=uid, session_id=sid)
    return {
        "status": "success",
        "message": "Order placed successfully!",
        "order_id": str(order.id),
        "order_number": order.order_number,
        "total_amount": order.total_amount
    }

@router.get("/orders", summary="Get My Active Orders")
async def get_my_orders(
    current_user: User = Depends(get_current_customer),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    orders = await service.order_repo.get_customer_orders(user_id=current_user.id, skip=skip, limit=limit)
    return [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "status": o.status.value,
            "total_amount": o.total_amount,
            "placed_at": o.placed_at,
            "items_count": len(o.items)
        }
        for o in orders
    ]

@router.get("/orders/history", summary="Get Order History")
async def get_order_history(
    current_user: User = Depends(get_current_customer),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    orders = await service.order_repo.get_customer_orders(user_id=current_user.id, skip=skip, limit=limit)
    history_orders = [o for o in orders if o.status.value in ["completed", "delivered", "cancelled", "refunded"]]
    return [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "status": o.status.value,
            "total_amount": o.total_amount,
            "placed_at": o.placed_at,
            "items_count": len(o.items)
        }
        for o in history_orders
    ]

@router.get("/orders/{order_id}", summary="Get Order Details")
async def get_order_details(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    order = await service.order_repo.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "status": order.status.value,
        "payment_status": order.payment_status,
        "subtotal": order.subtotal,
        "tax_amount": order.tax_amount,
        "discount_amount": order.discount_amount,
        "total_amount": order.total_amount,
        "placed_at": order.placed_at,
        "items": [
            {
                "id": str(i.id),
                "name": i.item_name,
                "quantity": i.quantity,
                "unit_price": i.unit_price,
                "total_price": i.total_price
            }
            for i in order.items
        ]
    }

@router.get("/orders/{order_id}/track", response_model=OrderTrackingResponse, summary="Track Order Status Timeline")
async def track_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    return await service.get_order_tracking(order_id)

@router.post("/orders/{order_id}/cancel", summary="Cancel Order")
async def cancel_order(
    order_id: uuid.UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    order = await service.cancel_order(order_id, reason)
    return {
        "status": "success",
        "message": f"Order {order.order_number} cancelled",
        "order_id": str(order.id)
    }

@router.post("/orders/{order_id}/repeat", summary="Repeat Order")
async def repeat_order(
    order_id: uuid.UUID,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    uid = current_user.id if current_user else None
    order = await service.repeat_order(order_id, user_id=uid, session_id=x_session_id)
    return {
        "status": "success",
        "message": "Order repeated successfully!",
        "new_order_id": str(order.id),
        "new_order_number": order.order_number
    }

# -----------------------------------------------------------------------------
# 14. LOYALTY POINTS
# -----------------------------------------------------------------------------
@router.get("/loyalty", response_model=LoyaltyPointsResponse, summary="Get Loyalty Points Balance")
async def get_loyalty_balance(
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    service = LoyaltyService(db)
    return await service.get_points_balance(current_user.id)

@router.get("/loyalty/transactions", response_model=List[PointsTransactionResponse], summary="Points Transaction History")
async def get_points_transactions(
    current_user: User = Depends(get_current_customer),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = LoyaltyService(db)
    return await service.get_points_history(current_user.id, skip=skip, limit=limit)

@router.get("/loyalty/rewards", summary="Get Available Loyalty Rewards Placeholder")
async def get_loyalty_rewards():
    return [
        {"id": "rew-1", "name": "Free Cold Brew Coffee", "points_required": 150, "reward_type": "free_item"},
        {"id": "rew-2", "name": "₹100 Flat Discount Voucher", "points_required": 300, "reward_type": "discount"},
        {"id": "rew-3", "name": "Free Gourmet Dessert", "points_required": 500, "reward_type": "free_item"}
    ]

@router.post("/loyalty/redeem-placeholder", summary="Redeem Reward Placeholder")
async def redeem_reward_placeholder(reward_id: str):
    return {
        "status": "success",
        "message": f"Reward {reward_id} redeemed successfully! (Placeholder)",
        "voucher_code": f"REWARD-{str(uuid.uuid4())[:6].upper()}"
    }

# -----------------------------------------------------------------------------
# 15. NOTIFICATIONS
# -----------------------------------------------------------------------------
@router.get("/notifications", response_model=List[CustomerNotificationResponse], summary="Get Customer Notifications")
async def get_notifications(
    current_user: User = Depends(get_current_customer),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    notifs = await repo.get_user_notifications(current_user.id, unread_only=unread_only)
    return [
        CustomerNotificationResponse(
            id=n.id,
            type=n.type.value,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            created_at=n.created_at
        )
        for n in notifs
    ]

@router.patch("/notifications/{notification_id}/read", summary="Mark Notification as Read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    n = await repo.mark_as_read(notification_id, current_user.id)
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "success", "message": "Notification marked as read"}

@router.delete("/notifications/{notification_id}", summary="Delete Notification")
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db)
):
    repo = NotificationRepository(db)
    deleted = await repo.delete(notification_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "success", "message": "Notification deleted"}

# -----------------------------------------------------------------------------
# 16 & 17. REVIEWS & FAVORITES PLACEHOLDERS
# -----------------------------------------------------------------------------
@router.post("/reviews/placeholder", response_model=ReviewPlaceholderResponse, summary="Submit Review Placeholder")
async def submit_review_placeholder(request: ReviewPlaceholderRequest):
    return ReviewPlaceholderResponse(
        review_id=str(uuid.uuid4())
    )

@router.get("/reviews/placeholder", summary="List Product Reviews Placeholder")
async def list_reviews_placeholder(menu_item_id: Optional[uuid.UUID] = None):
    return [
        {
            "id": str(uuid.uuid4()),
            "rating": 5,
            "comment": "Delicious food and prompt table delivery!",
            "customer_name": "Sarah S.",
            "created_at": "2026-08-01T20:00:00Z"
        }
    ]

@router.post("/favorites/placeholder", response_model=FavoritePlaceholderResponse, summary="Add Favorite Placeholder")
async def add_favorite_placeholder(request: FavoritePlaceholderRequest):
    return FavoritePlaceholderResponse(
        message="Item added to customer favorites",
        menu_item_id=request.menu_item_id
    )

@router.get("/favorites/placeholder", summary="List Favorites Placeholder")
async def list_favorites_placeholder():
    return [
        {
            "favorite_id": str(uuid.uuid4()),
            "menu_item_id": str(uuid.uuid4()),
            "name": "Butter Chicken Special",
            "price": 450.00
        }
    ]

@router.delete("/favorites/placeholder/{item_id}", summary="Remove Favorite Placeholder")
async def remove_favorite_placeholder(item_id: uuid.UUID):
    return {
        "status": "success",
        "message": "Item removed from favorites",
        "menu_item_id": str(item_id)
    }
