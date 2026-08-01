from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field, EmailStr

# -------------------------------------------------------------
# 1. Guest & Auth Schemas
# -------------------------------------------------------------
class GuestAuthRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Optional client generated session ID")
    device_info: Optional[str] = None

class GuestAuthResponse(BaseModel):
    session_id: str
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# -------------------------------------------------------------
# 2. Profile Schemas
# -------------------------------------------------------------
class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# -------------------------------------------------------------
# 3. Cart Schemas
# -------------------------------------------------------------
class CartItemAddRequest(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = Field(1, ge=1)
    notes: Optional[str] = None
    variant_selected: Optional[Dict[str, Any]] = None
    add_ons_selected: Optional[List[Dict[str, Any]]] = None

class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=0)
    notes: Optional[str] = None

class CartItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    menu_item_name: Optional[str] = None
    menu_item_image: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    notes: Optional[str] = None
    variant_selected: Optional[Dict[str, Any]] = None
    add_ons_selected: Optional[List[Dict[str, Any]]] = None
    add_ons_total: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class CartResponse(BaseModel):
    id: uuid.UUID
    session_id: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    items: List[CartItemResponse] = []
    subtotal: float
    tax_amount: float
    discount_amount: float
    total: float
    total_items: int
    coupon_code: Optional[str] = None
    notes: Optional[str] = None

# -------------------------------------------------------------
# 4. Coupon Schemas
# -------------------------------------------------------------
class CouponApplyRequest(BaseModel):
    code: str

class CustomerCouponResponse(BaseModel):
    id: uuid.UUID
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    min_order_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    valid_until: Optional[datetime] = None

# -------------------------------------------------------------
# 5. Checkout & Order Schemas
# -------------------------------------------------------------
class CheckoutSummaryRequest(BaseModel):
    session_id: Optional[str] = None
    table_id: Optional[uuid.UUID] = None
    coupon_code: Optional[str] = None

class CheckoutSummaryResponse(BaseModel):
    subtotal: float
    tax_amount: float
    delivery_fee: float
    discount_amount: float
    total_amount: float
    items_count: int
    coupon_applied: Optional[str] = None
    estimated_prep_time_mins: int = 20

class OrderCreateRequest(BaseModel):
    session_id: Optional[str] = None
    table_id: Optional[uuid.UUID] = None
    order_type: str = "dine_in"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    special_instructions: Optional[str] = None
    payment_method: str = "cash"

class OrderTrackingResponse(BaseModel):
    order_id: uuid.UUID
    order_number: str
    status: str
    payment_status: str
    table_number: Optional[str] = None
    token_number: str
    estimated_time_mins: int
    placed_at: datetime
    timeline: Dict[str, Optional[datetime]]

# -------------------------------------------------------------
# 6. Loyalty Schemas
# -------------------------------------------------------------
class LoyaltyPointsResponse(BaseModel):
    current_balance: int
    current_tier: str
    total_points_earned: int
    total_points_redeemed: int
    tier_benefits: Dict[str, Any]

class PointsTransactionResponse(BaseModel):
    id: uuid.UUID
    transaction_type: str
    points: int
    balance_after: int
    description: Optional[str] = None
    created_at: datetime

# -------------------------------------------------------------
# 7. Notification Schemas
# -------------------------------------------------------------
class CustomerNotificationResponse(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

# -------------------------------------------------------------
# 8. Reviews & Favorites Placeholders
# -------------------------------------------------------------
class ReviewPlaceholderRequest(BaseModel):
    order_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewPlaceholderResponse(BaseModel):
    status: str = "recorded_placeholder"
    message: str = "Thank you for your feedback! Review system placeholder triggered."
    review_id: str

class FavoritePlaceholderRequest(BaseModel):
    menu_item_id: uuid.UUID

class FavoritePlaceholderResponse(BaseModel):
    status: str = "success"
    message: str
    menu_item_id: uuid.UUID
