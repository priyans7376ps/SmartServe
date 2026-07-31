"""Initial backend foundation schema
Revision ID: 0001_initial_foundation
Revises: 
Create Date: 2026-07-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_initial_foundation'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. roles
    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('name', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 2. restaurants
    op.create_table(
        'restaurants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('slug', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tagline', sa.String(500), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('website', sa.String(500), nullable=True),
        sa.Column('address_line1', sa.String(255), nullable=True),
        sa.Column('address_line2', sa.String(255), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('postal_code', sa.String(20), nullable=True),
        sa.Column('country', sa.String(100), server_default='US', nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('banner_url', sa.String(500), nullable=True),
        sa.Column('favicon_url', sa.String(500), nullable=True),
        sa.Column('primary_color', sa.String(7), nullable=True),
        sa.Column('secondary_color', sa.String(7), nullable=True),
        sa.Column('opening_time', sa.Time(), nullable=True),
        sa.Column('closing_time', sa.Time(), nullable=True),
        sa.Column('opening_days', postgresql.JSONB(), nullable=True),
        sa.Column('is_open', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('currency', sa.String(3), server_default='USD', nullable=False),
        sa.Column('tax_rate', sa.Float(), server_default='0.08', nullable=False),
        sa.Column('service_charge_rate', sa.Float(), server_default='0.05', nullable=False),
        sa.Column('max_tables', sa.Integer(), server_default='50', nullable=False),
        sa.Column('max_capacity', sa.Integer(), server_default='200', nullable=False),
        sa.Column('preparation_time_buffer', sa.Integer(), server_default='5', nullable=False),
        sa.Column('max_items_per_order', sa.Integer(), server_default='50', nullable=False),
        sa.Column('order_timeout_minutes', sa.Integer(), server_default='30', nullable=False),
        sa.Column('enable_online_ordering', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('enable_table_reservation', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('accepted_payment_methods', postgresql.JSONB(), nullable=True),
        sa.Column('stripe_publishable_key', sa.String(500), nullable=True),
        sa.Column('stripe_secret_key', sa.String(500), nullable=True),
        sa.Column('enable_email_notifications', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('enable_sms_notifications', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('enable_push_notifications', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('features', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('subscription_tier', sa.String(50), server_default='basic', nullable=False),
        sa.Column('subscription_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 3. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('phone', sa.String(20), nullable=True, unique=True, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id'), nullable=True),
        sa.Column('role', sa.String(50), server_default='customer', nullable=False, index=True),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_locked', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_activity_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('phone_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('refresh_token', sa.String(500), nullable=True),
        sa.Column('preferences', postgresql.JSONB(), nullable=True),
        sa.Column('device_token', sa.String(500), nullable=True),
        sa.Column('device_type', sa.String(50), nullable=True),
        sa.Column('restaurant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('restaurants.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 4. tables
    op.create_table(
        'tables',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('restaurant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('restaurants.id'), nullable=False, index=True),
        sa.Column('table_number', sa.Integer(), nullable=False),
        sa.Column('table_name', sa.String(100), nullable=True),
        sa.Column('section', sa.String(100), nullable=True),
        sa.Column('capacity', sa.Integer(), server_default='4', nullable=False),
        sa.Column('min_capacity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('max_capacity', sa.Integer(), server_default='8', nullable=False),
        sa.Column('is_occupied', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_reserved', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_smoking', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('qr_code', sa.String(500), nullable=True),
        sa.Column('device_id', sa.String(255), nullable=True, index=True),
        sa.Column('status', sa.String(50), server_default='available', nullable=False),
        sa.Column('qr_code_url', sa.String(500), nullable=True),
        sa.Column('qr_code_data', sa.String(500), nullable=True),
        sa.Column('floor', sa.Integer(), server_default='1', nullable=False),
        sa.Column('x_position', sa.Float(), nullable=True),
        sa.Column('y_position', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('restaurant_id', 'table_number', name='uq_table_restaurant_number')
    )

    # 5. categories
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('restaurant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('restaurants.id'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_featured', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('show_on_menu', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('background_color', sa.String(7), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('restaurant_id', 'slug', name='uq_category_restaurant_slug')
    )

    # 6. menu_items
    op.create_table(
        'menu_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('restaurant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('restaurants.id'), nullable=False, index=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('categories.id'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('short_description', sa.String(500), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('compare_price', sa.Float(), nullable=True),
        sa.Column('cost_price', sa.Float(), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('image_urls', postgresql.JSONB(), nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('is_available', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_todays_special', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_featured', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_vegetarian', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_vegan', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_gluten_free', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_spicy', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('preparation_time', sa.Integer(), server_default='15', nullable=False),
        sa.Column('calories', sa.Integer(), nullable=True),
        sa.Column('allergens', postgresql.JSONB(), nullable=True),
        sa.Column('stock_quantity', sa.Integer(), server_default='100', nullable=False),
        sa.Column('low_stock_threshold', sa.Integer(), server_default='10', nullable=False),
        sa.Column('variants', postgresql.JSONB(), nullable=True),
        sa.Column('add_ons', postgresql.JSONB(), nullable=True),
        sa.Column('rating', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('rating_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('order_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('tags', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('restaurant_id', 'slug', name='uq_menu_item_restaurant_slug')
    )

    # 7. carts
    op.create_table(
        'carts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True, index=True),
        sa.Column('restaurant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('restaurants.id'), nullable=False, index=True),
        sa.Column('table_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tables.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 8. cart_items
    op.create_table(
        'cart_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('cart_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('carts.id'), nullable=False, index=True),
        sa.Column('menu_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('menu_items.id'), nullable=False, index=True),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('variant_selected', postgresql.JSONB(), nullable=True),
        sa.Column('add_ons_selected', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 9. coupons
    op.create_table(
        'coupons',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('restaurant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('restaurants.id'), nullable=False, index=True),
        sa.Column('code', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('discount_type', sa.String(50), server_default='percentage', nullable=False),
        sa.Column('discount_value', sa.Float(), nullable=False),
        sa.Column('max_discount_amount', sa.Float(), nullable=True),
        sa.Column('min_order_amount', sa.Float(), nullable=True),
        sa.Column('max_usage_count', sa.Integer(), nullable=True),
        sa.Column('max_usage_per_user', sa.Integer(), server_default='1', nullable=False),
        sa.Column('used_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('applicable_to', postgresql.JSONB(), nullable=True),
        sa.Column('excluded_items', postgresql.JSONB(), nullable=True),
        sa.Column('user_roles', postgresql.JSONB(), nullable=True),
        sa.Column('first_time_only', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_public', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('display_name', sa.String(100), nullable=True),
        sa.Column('terms_conditions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 10. orders
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('restaurant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('restaurants.id'), nullable=False, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True, index=True),
        sa.Column('table_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tables.id'), nullable=True, index=True),
        sa.Column('order_number', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('order_type', sa.String(50), server_default='dine_in', nullable=False),
        sa.Column('status', sa.String(50), server_default='pending', nullable=False, index=True),
        sa.Column('customer_name', sa.String(255), nullable=True),
        sa.Column('customer_phone', sa.String(20), nullable=True),
        sa.Column('customer_email', sa.String(255), nullable=True),
        sa.Column('subtotal', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('tax_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('service_charge', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('delivery_fee', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('discount_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('total_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('payment_status', sa.String(50), server_default='pending', nullable=False),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('coupon_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('coupons.id'), nullable=True),
        sa.Column('coupon_code', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('special_instructions', sa.Text(), nullable=True),
        sa.Column('cancellation_reason', sa.Text(), nullable=True),
        sa.Column('estimated_preparation_time', sa.Integer(), nullable=True),
        sa.Column('placed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preparing_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ready_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 11. order_items
    op.create_table(
        'order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=False, index=True),
        sa.Column('menu_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('menu_items.id'), nullable=False),
        sa.Column('item_name', sa.String(255), nullable=False),
        sa.Column('item_description', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('compare_price', sa.Float(), nullable=True),
        sa.Column('subtotal', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('variant_selected', postgresql.JSONB(), nullable=True),
        sa.Column('add_ons_selected', postgresql.JSONB(), nullable=True),
        sa.Column('add_ons_total', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('preparation_status', sa.String(50), server_default='pending', nullable=False),
        sa.Column('preparation_started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preparation_completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('preparation_notes', sa.Text(), nullable=True),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 12. order_status_logs
    op.create_table(
        'order_status_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('changed_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 13. payments
    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=False, unique=True, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True, index=True),
        sa.Column('transaction_id', sa.String(255), nullable=True, unique=True, index=True),
        sa.Column('payment_intent_id', sa.String(255), nullable=True, index=True),
        sa.Column('payment_method', sa.String(50), nullable=False),
        sa.Column('payment_status', sa.String(50), server_default='pending', nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(3), server_default='USD', nullable=False),
        sa.Column('tax_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('tip_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('service_charge', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('discount_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('gateway_response', postgresql.JSONB(), nullable=True),
        sa.Column('gateway_status', sa.String(100), nullable=True),
        sa.Column('gateway_message', sa.Text(), nullable=True),
        sa.Column('card_last_four', sa.String(4), nullable=True),
        sa.Column('card_brand', sa.String(50), nullable=True),
        sa.Column('card_expiry_month', sa.Integer(), nullable=True),
        sa.Column('card_expiry_year', sa.Integer(), nullable=True),
        sa.Column('billing_name', sa.String(255), nullable=True),
        sa.Column('billing_email', sa.String(255), nullable=True),
        sa.Column('billing_phone', sa.String(20), nullable=True),
        sa.Column('billing_address', postgresql.JSONB(), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('refunded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('refund_amount', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('refund_reason', sa.Text(), nullable=True),
        sa.Column('refund_transaction_id', sa.String(255), nullable=True),
        sa.Column('receipt_url', sa.String(500), nullable=True),
        sa.Column('receipt_number', sa.String(100), nullable=True),
        sa.Column('extra_metadata', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 14. coupon_usages
    op.create_table(
        'coupon_usages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('coupon_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('coupons.id'), nullable=False, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=True),
        sa.Column('discount_amount', sa.Float(), nullable=False),
        sa.Column('order_amount', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 15. complaints
    op.create_table(
        'complaints',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), nullable=True),
        sa.Column('subject', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(100), server_default='other', nullable=False),
        sa.Column('priority', sa.String(50), server_default='medium', nullable=False),
        sa.Column('status', sa.String(50), server_default='submitted', nullable=False),
        sa.Column('attachments', postgresql.JSONB(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_escalated', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('escalated_to', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('escalated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('escalation_reason', sa.Text(), nullable=True),
        sa.Column('customer_feedback', sa.Text(), nullable=True),
        sa.Column('customer_rating', sa.Integer(), nullable=True),
        sa.Column('is_satisfied', sa.Boolean(), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('contact_phone', sa.String(20), nullable=True),
        sa.Column('preferred_contact_method', sa.String(50), server_default='email', nullable=False),
        sa.Column('extra_metadata', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 16. notifications
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('related_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('related_type', sa.String(50), nullable=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('channel', sa.String(50), server_default='in_app', nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.Column('action_label', sa.String(100), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_delivered', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivery_error', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(20), server_default='normal', nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('extra_metadata', postgresql.JSONB(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 17. loyalty_points
    op.create_table(
        'loyalty_points',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True, index=True),
        sa.Column('total_points_earned', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_points_redeemed', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_points_expired', sa.Integer(), server_default='0', nullable=False),
        sa.Column('current_balance', sa.Integer(), server_default='0', nullable=False),
        sa.Column('current_tier', sa.String(50), server_default='bronze', nullable=False),
        sa.Column('points_to_next_tier', sa.Integer(), nullable=True),
        sa.Column('tier_progress_percentage', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('lifetime_spent', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('total_orders', sa.Integer(), server_default='0', nullable=False),
        sa.Column('points_expiry_days', sa.Integer(), server_default='365', nullable=False),
        sa.Column('last_points_earned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_points_redeemed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_points_expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('enrolled_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_enrolled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 18. points_transactions
    op.create_table(
        'points_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('loyalty_points_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('loyalty_points.id'), nullable=False, index=True),
        sa.Column('transaction_type', sa.String(50), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('balance_before', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reference_type', sa.String(50), nullable=True),
        sa.Column('reference_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # 19. loyalty_rewards
    op.create_table(
        'loyalty_rewards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('loyalty_points_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('loyalty_points.id'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('points_required', sa.Integer(), nullable=False),
        sa.Column('reward_type', sa.String(50), server_default='discount', nullable=False),
        sa.Column('discount_percentage', sa.Float(), nullable=True),
        sa.Column('discount_amount', sa.Float(), nullable=True),
        sa.Column('free_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('menu_items.id'), nullable=True),
        sa.Column('is_redeemed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('redeemed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('loyalty_rewards')
    op.drop_table('points_transactions')
    op.drop_table('loyalty_points')
    op.drop_table('notifications')
    op.drop_table('complaints')
    op.drop_table('coupon_usages')
    op.drop_table('payments')
    op.drop_table('order_status_logs')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('coupons')
    op.drop_table('cart_items')
    op.drop_table('carts')
    op.drop_table('menu_items')
    op.drop_table('categories')
    op.drop_table('tables')
    op.drop_table('users')
    op.drop_table('restaurants')
    op.drop_table('roles')
