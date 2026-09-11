from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.models.user import UserRole
from app.models.coupon import DiscountType
from app.models.complaint import ComplaintStatus, ComplaintPriority


# Dashboard Analytics Schemas
class MetricComparison(BaseModel):
    current: float
    previous: float
    percentage_change: float
    trend: str  # "up" | "down" | "neutral"


class DashboardStatsResponse(BaseModel):
    today_revenue: float
    today_orders: int
    completed_orders: int
    pending_orders: int
    preparing_orders: int
    ready_orders: int
    cancelled_orders: int
    avg_order_value: float
    avg_prep_time_minutes: int
    total_customers: int
    registered_customers: int
    guest_customers: int
    active_tables: int
    total_menu_items: int
    out_of_stock_items: int
    restaurant_name: str
    revenue_comparison: Optional[MetricComparison] = None
    orders_comparison: Optional[MetricComparison] = None


class HourlyRevenuePoint(BaseModel):
    time: str
    revenue: float
    orders: int


class CategorySalesPoint(BaseModel):
    name: str
    value: float
    amount: float
    color: str


# Revenue Analytics Schemas
class RevenueAnalyticsResponse(BaseModel):
    total_sales: float
    net_revenue: float
    total_discounts: float
    total_tax: float
    avg_order_value: float
    total_orders_count: int
    series: List[Dict[str, Any]]
    by_category: List[Dict[str, Any]]
    by_payment_method: List[Dict[str, Any]]


# Staff Management Schemas
class StaffCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    role: UserRole = Field(..., description="Role must be ADMIN or KITCHEN")


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class StaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None


# Complaint Management Schemas
class ComplaintUpdateAdmin(BaseModel):
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    resolution_notes: Optional[str] = None


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_id: Optional[uuid.UUID] = None
    subject: str
    description: str
    category: str
    priority: ComplaintPriority
    status: ComplaintStatus
    resolution_notes: Optional[str] = None
    resolved_by: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


# Coupon Management Schemas
class CouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = None
    discount_type: DiscountType = DiscountType.PERCENTAGE
    discount_value: float = Field(..., gt=0)
    max_discount_amount: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_usage_count: Optional[int] = None
    max_usage_per_user: int = 1
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True
    is_public: bool = True
    display_name: Optional[str] = None
    terms_conditions: Optional[str] = None


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = None
    max_discount_amount: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_usage_count: Optional[int] = None
    max_usage_per_user: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    display_name: Optional[str] = None
    terms_conditions: Optional[str] = None


# Restaurant Settings Schemas
class RestaurantSettingsUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    tax_rate: Optional[float] = Field(None, ge=0.0, le=0.5, description="Tax rate decimal 0 to 0.5")
    currency: Optional[str] = None
    timezone: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_open: Optional[bool] = None


# Profile & Password Update Schemas
class AdminProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# Audit Log Schemas
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    admin_id: Optional[uuid.UUID] = None
    admin_name: str = "System"
    admin_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Dict[str, Any] = {}
    created_at: Optional[datetime] = None
