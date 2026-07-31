-- SmartServe Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

CREATE TYPE user_role AS ENUM ('customer', 'kitchen', 'admin', 'super_admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    role user_role NOT NULL DEFAULT 'customer',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    password_changed_at TIMESTAMPTZ,
    refresh_token VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    device_token VARCHAR(500),
    device_type VARCHAR(50),
    restaurant_id UUID REFERENCES restaurants(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- RESTAURANTS
-- =============================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    tagline VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(500),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'US',
    latitude FLOAT,
    longitude FLOAT,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    favicon_url VARCHAR(500),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    opening_time TIME,
    closing_time TIME,
    opening_days JSONB DEFAULT '{}',
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    tax_rate FLOAT NOT NULL DEFAULT 0.08,
    service_charge_rate FLOAT NOT NULL DEFAULT 0.05,
    max_tables INTEGER NOT NULL DEFAULT 50,
    max_capacity INTEGER NOT NULL DEFAULT 200,
    preparation_time_buffer INTEGER NOT NULL DEFAULT 5,
    max_items_per_order INTEGER NOT NULL DEFAULT 50,
    order_timeout_minutes INTEGER NOT NULL DEFAULT 30,
    enable_online_ordering BOOLEAN NOT NULL DEFAULT TRUE,
    enable_table_reservation BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_payment_methods JSONB DEFAULT '[]',
    stripe_publishable_key VARCHAR(500),
    stripe_secret_key VARCHAR(500),
    enable_email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    enable_sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    enable_push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    table_number INTEGER NOT NULL,
    table_name VARCHAR(100),
    section VARCHAR(100),
    capacity INTEGER NOT NULL DEFAULT 4,
    min_capacity INTEGER NOT NULL DEFAULT 1,
    max_capacity INTEGER NOT NULL DEFAULT 8,
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_reserved BOOLEAN NOT NULL DEFAULT FALSE,
    is_smoking BOOLEAN NOT NULL DEFAULT FALSE,
    qr_code_url VARCHAR(500),
    qr_code_data VARCHAR(500),
    floor INTEGER NOT NULL DEFAULT 1,
    x_position FLOAT,
    y_position FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(restaurant_id, table_number)
);

-- =============================================
-- CATEGORIES
-- =============================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    image_url VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    show_on_menu BOOLEAN NOT NULL DEFAULT TRUE,
    parent_id UUID REFERENCES categories(id),
    color VARCHAR(7),
    background_color VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(restaurant_id, slug)
);

-- =============================================
-- MENU ITEMS
-- =============================================

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price FLOAT NOT NULL,
    compare_price FLOAT,
    cost_price FLOAT,
    image_url VARCHAR(500),
    image_urls JSONB DEFAULT '[]',
    video_url VARCHAR(500),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_todays_special BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_vegetarian BOOLEAN NOT NULL DEFAULT FALSE,
    is_vegan BOOLEAN NOT NULL DEFAULT FALSE,
    is_gluten_free BOOLEAN NOT NULL DEFAULT FALSE,
    is_spicy BOOLEAN NOT NULL DEFAULT FALSE,
    preparation_time INTEGER NOT NULL DEFAULT 15,
    calories INTEGER,
    allergens JSONB DEFAULT '[]',
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    variants JSONB DEFAULT '[]',
    add_ons JSONB DEFAULT '[]',
    rating FLOAT NOT NULL DEFAULT 0.0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    order_count INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(restaurant_id, slug)
);

-- =============================================
-- CARTS
-- =============================================

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    notes TEXT,
    table_id UUID REFERENCES tables(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_converted BOOLEAN NOT NULL DEFAULT FALSE,
    converted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    coupon_id UUID REFERENCES coupons(id),
    coupon_code VARCHAR(50),
    discount_amount FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price FLOAT NOT NULL,
    compare_price FLOAT,
    notes TEXT,
    variant_selected JSONB,
    add_ons_selected JSONB DEFAULT '[]',
    add_ons_total FLOAT NOT NULL DEFAULT 0.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ORDERS
-- =============================================

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled', 'refunded');
CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway', 'delivery');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    user_id UUID REFERENCES users(id),
    table_id UUID REFERENCES tables(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_type order_type NOT NULL DEFAULT 'dine_in',
    status order_status NOT NULL DEFAULT 'pending',
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    guest_session_id VARCHAR(255),
    subtotal FLOAT NOT NULL,
    tax_amount FLOAT NOT NULL DEFAULT 0.0,
    service_charge FLOAT NOT NULL DEFAULT 0.0,
    delivery_fee FLOAT NOT NULL DEFAULT 0.0,
    packaging_fee FLOAT NOT NULL DEFAULT 0.0,
    discount_amount FLOAT NOT NULL DEFAULT 0.0,
    coupon_code VARCHAR(50),
    coupon_id UUID REFERENCES coupons(id),
    total_amount FLOAT NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    estimated_preparation_time INTEGER NOT NULL DEFAULT 15,
    estimated_delivery_time INTEGER,
    actual_preparation_time INTEGER,
    notes TEXT,
    special_instructions TEXT,
    cancellation_reason TEXT,
    is_priority BOOLEAN NOT NULL DEFAULT FALSE,
    priority_reason VARCHAR(255),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);

-- =============================================
-- ORDER ITEMS
-- =============================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price FLOAT NOT NULL,
    compare_price FLOAT,
    subtotal FLOAT NOT NULL,
    notes TEXT,
    variant_selected JSONB,
    add_ons_selected JSONB DEFAULT '[]',
    add_ons_total FLOAT NOT NULL DEFAULT 0.0,
    preparation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    preparation_started_at TIMESTAMPTZ,
    preparation_completed_at TIMESTAMPTZ,
    preparation_notes TEXT,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PAYMENTS
-- =============================================

CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'online', 'upi', 'wallet');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
    user_id UUID REFERENCES users(id),
    transaction_id VARCHAR(255) UNIQUE,
    payment_intent_id VARCHAR(255),
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    amount FLOAT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    tax_amount FLOAT NOT NULL DEFAULT 0.0,
    tip_amount FLOAT NOT NULL DEFAULT 0.0,
    service_charge FLOAT NOT NULL DEFAULT 0.0,
    discount_amount FLOAT NOT NULL DEFAULT 0.0,
    total_amount FLOAT NOT NULL,
    gateway_response JSONB DEFAULT '{}',
    gateway_status VARCHAR(100),
    gateway_message TEXT,
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    card_expiry_month INTEGER,
    card_expiry_year INTEGER,
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_phone VARCHAR(20),
    billing_address JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_amount FLOAT NOT NULL DEFAULT 0.0,
    refund_reason TEXT,
    refund_transaction_id VARCHAR(255),
    receipt_url VARCHAR(500),
    receipt_number VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COUPONS
-- =============================================

CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping', 'buy_one_get_one');

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL DEFAULT 'percentage',
    discount_value FLOAT NOT NULL,
    max_discount_amount FLOAT,
    min_order_amount FLOAT,
    max_usage_count INTEGER,
    max_usage_per_user INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    applicable_to JSONB DEFAULT '{}',
    excluded_items JSONB DEFAULT '[]',
    user_roles JSONB DEFAULT '[]',
    first_time_only BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    display_name VARCHAR(100),
    terms_conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    discount_amount FLOAT NOT NULL,
    order_amount FLOAT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COMPLAINTS
-- =============================================

CREATE TYPE complaint_status AS ENUM ('submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'escalated');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'other',
    priority complaint_priority NOT NULL DEFAULT 'medium',
    status complaint_status NOT NULL DEFAULT 'submitted',
    attachments JSONB DEFAULT '[]',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
    escalated_to UUID REFERENCES users(id),
    escalated_at TIMESTAMPTZ,
    escalation_reason TEXT,
    customer_feedback TEXT,
    customer_rating INTEGER,
    is_satisfied BOOLEAN,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    preferred_contact_method VARCHAR(50) NOT NULL DEFAULT 'email',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TYPE notification_type AS ENUM ('order_update', 'order_status', 'new_order', 'payment', 'promotion', 'coupon', 'system', 'complaint', 'kitchen', 'admin');
CREATE TYPE notification_channel AS ENUM ('in_app', 'push', 'email', 'sms');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    related_id UUID,
    related_type VARCHAR(50),
    type notification_type NOT NULL,
    channel notification_channel NOT NULL DEFAULT 'in_app',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    body TEXT,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    icon VARCHAR(100),
    image_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_delivered BOOLEAN NOT NULL DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    delivery_error TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- =============================================
-- LOYALTY PROGRAM
-- =============================================

CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
CREATE TYPE points_transaction_type AS ENUM ('earned', 'redeemed', 'expired', 'adjusted', 'bonus');

CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    total_points_earned INTEGER NOT NULL DEFAULT 0,
    total_points_redeemed INTEGER NOT NULL DEFAULT 0,
    total_points_expired INTEGER NOT NULL DEFAULT 0,
    current_balance INTEGER NOT NULL DEFAULT 0,
    current_tier loyalty_tier NOT NULL DEFAULT 'bronze',
    points_to_next_tier INTEGER,
    tier_progress_percentage FLOAT NOT NULL DEFAULT 0.0,
    lifetime_spent FLOAT NOT NULL DEFAULT 0.0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    points_expiry_days INTEGER NOT NULL DEFAULT 365,
    last_points_earned_at TIMESTAMPTZ,
    last_points_redeemed_at TIMESTAMPTZ,
    next_points_expiry_date TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_enrolled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_points_id UUID NOT NULL REFERENCES loyalty_points(id),
    transaction_type points_transaction_type NOT NULL,
    points INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_points_id UUID NOT NULL REFERENCES loyalty_points(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL DEFAULT 'discount',
    discount_percentage FLOAT,
    discount_amount FLOAT,
    free_item_id UUID REFERENCES menu_items(id),
    is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,
    redeemed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

