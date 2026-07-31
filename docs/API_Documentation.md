# SmartServe API Documentation

## Base URL
- Development: `http://localhost:8000`
- Production: `https://api.smartserve.app`

## Authentication
All API requests (except auth endpoints) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Auth Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "customer",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /api/auth/login
Authenticate and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "customer"
  }
}
```

### Menu Endpoints

#### GET /api/menu
Get all menu items with optional filters.

**Query Parameters:**
- `category_id` (optional) - Filter by category
- `search` (optional) - Search by name/description
- `available` (optional) - Filter by availability
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Margherita Pizza",
      "description": "Classic tomato and mozzarella",
      "price": 12.99,
      "category_id": "uuid",
      "category_name": "Pizza",
      "image_url": "/uploads/pizza.jpg",
      "is_available": true,
      "is_todays_special": false,
      "preparation_time": 15,
      "rating": 4.5
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### Order Endpoints

#### POST /api/orders
Place a new order.

**Request Body:**
```json
{
  "table_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "special_instructions": "No onions"
    }
  ],
  "coupon_code": "SAVE10"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "order_number": "ORD-2024-0001",
  "status": "pending",
  "items": [...],
  "subtotal": 25.98,
  "discount": 2.60,
  "total": 23.38,
  "estimated_time": 20,
  "created_at": "2024-01-01T12:00:00Z"
}
```

### WebSocket Endpoints

#### WS /ws/orders/{order_id}
Real-time order status updates.

**Events:**
```json
{
  "event": "order_status_update",
  "data": {
    "order_id": "uuid",
    "status": "preparing",
    "estimated_time": 15,
    "updated_at": "2024-01-01T12:05:00Z"
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "status_code": 400
}
```

## Rate Limiting
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Pagination
All list endpoints support pagination with `page` and `limit` parameters.
Response includes `total`, `page`, and `limit` fields.

