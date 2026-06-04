# Somame API Documentation

Base URL: http://localhost:3000

---

## 1. Health Checks

### Check API Status
- **Endpoint**: `GET /` or `GET /health`
- **Description**: Verifies the API is up and running.
- **Example Response**:
```json
{
  "status": "success",
  "message": "somame_api is running"
}
```

---

## 2. Authentication (/api/auth)

### Step 1a: Register User
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user and trigger a 6-digit SMS OTP.
- **Body payload (JSON)**:
```json
{
  "phone_number": "1234567890",
  "password": "securepassword123",
  "role": "customer" // Can be "customer", "rider", or "vendor"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Registration initiated. OTP sent to phone number.",
  "data": {
    "userId": 1,
    "phone_number": "1234567890"
  }
}
```

### Step 1b: Login User
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate using ONLY a phone number and trigger a 6-digit SMS OTP (passwordless).
- **Body payload (JSON)**:
```json
{
  "phone_number": "1234567890"
}
```
- **Example Response**: 
```json
{
  "status": "success",
  "message": "Login initiated. OTP sent to phone number.",
  "data": {
    "userId": 1,
    "phone_number": "1234567890"
  }
}
```

### Step 2: Verify OTP
- **Endpoint**: `POST /api/auth/verify-otp`
- **Description**: Verifies the 6-digit code sent via SMS. Returns the JWT token on success.
- **Body payload (JSON)**:
```json
{
  "phone_number": "1234567890",
  "otp_code": "123456"
}
```
- **Example Response**: 
```json
{
  "status": "success",
  "message": "OTP verified successfully.",
  "data": {
    "user": {
      "id": 1,
      "phone_number": "1234567890",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
*(You MUST use this `token` in the `Authorization: Bearer <token>` header for all "Protected" routes below).*

---

## 3. Vendors (/api/vendors)

### Create a Vendor (Protected)
- **Endpoint**: `POST /api/vendors`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Adds a new vendor with their physical coordinates to the database.
- **Body payload (JSON)**:
```json
{
  "name": "KFC Accra",
  "logo_url": "https://example.com/logo.png",
  "rating": 4.5,
  "lat": 5.6037,
  "lng": -0.1870
}
```
- **Example Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "KFC Accra",
    "logo_url": "https://example.com/logo.png",
    "rating": "4.50",
    "location": "0101000020E610000022204E9484F2C7BF8BC0EB255EE61640",
    "created_at": "2026-06-04T03:35:00.000Z"
  }
}
```

### Get Nearby Vendors (Public)
- **Endpoint**: `GET /api/vendors/nearby`
- **Description**: Uses PostGIS spatial queries to find vendors within a certain radius.
- **Query Parameters**:
  - `lat`: Latitude of the customer
  - `lng`: Longitude of the customer
  - `radius`: Radius in meters (defaults to 5000)
- **Example URL**: `GET /api/vendors/nearby?lat=5.6037&lng=-0.1870&radius=5000`
- **Example Response**:
```json
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "id": 1,
      "name": "KFC Accra",
      "logo_url": "https://example.com/logo.png",
      "rating": "4.50",
      "lat": 5.6037,
      "lng": -0.1870,
      "distance": 0
    }
  ]
}
```

### Get Vendor Details (Public)
- **Endpoint**: `GET /api/vendors/:id`
- **Description**: Retrieves specific vendor details by ID.
- **Example URL**: `GET /api/vendors/1`
- **Example Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "KFC Accra",
    "logo_url": "https://example.com/logo.png",
    "rating": "4.50",
    "lat": 5.6037,
    "lng": -0.1870,
    "created_at": "2026-06-04T03:35:00.000Z"
  }
}
```

---

## 4. Orders (/api/orders)

### Create an Order (Protected)
- **Endpoint**: `POST /api/orders`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Creates a new order, saves line items, and initializes delivery tracking.
- **Body payload (JSON)**:
```json
{
  "vendor_id": 1,
  "rider_id": 2, 
  "total_amount": 55.50,
  "payment_method": "momo",
  "items": [
    { "item_name": "Fried Rice", "quantity": 2, "price": 20.00 },
    { "item_name": "Chicken", "quantity": 1, "price": 15.50 }
  ],
  "delivery_location": {
    "lat": 5.6145,
    "lng": -0.2057
  }
}
```
- **Example Response**:
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": 1,
      "customer_id": 3,
      "vendor_id": 1,
      "rider_id": 2,
      "status": "pending",
      "total_amount": "55.50",
      "payment_method": "momo",
      "payment_status": "pending",
      "created_at": "2026-06-04T03:40:00.000Z"
    },
    "delivery": {
      "id": 1,
      "order_id": 1,
      "rider_id": 2,
      "current_location": "0101000020E61000000ABFDB3CAAA5CABF160B547C38741640",
      "updated_at": "2026-06-04T03:40:00.000Z"
    }
  }
}
```

### Get Order Details (Protected)
- **Endpoint**: `GET /api/orders/:id`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Fetch order details including items and active delivery status.
- **Example URL**: `GET /api/orders/1`
- **Example Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "customer_id": 3,
    "vendor_id": 1,
    "rider_id": 2,
    "status": "pending",
    "total_amount": "55.50",
    "payment_method": "momo",
    "payment_status": "pending",
    "created_at": "2026-06-04T03:40:00.000Z",
    "items": [
      {
        "id": 1,
        "order_id": 1,
        "item_name": "Fried Rice",
        "quantity": 2,
        "price": "20.00"
      },
      {
        "id": 2,
        "order_id": 1,
        "item_name": "Chicken",
        "quantity": 1,
        "price": "15.50"
      }
    ],
    "delivery": {
      "id": 1,
      "rider_id": 2,
      "updated_at": "2026-06-04T03:40:00.000Z",
      "lat": 5.6145,
      "lng": -0.2057
    }
  }
}
```

---

## 5. Live Tracking (Socket.io)

Connect to the Socket.io server by passing the JWT token. 

**Connection Headers**: 
`Authorization: Bearer <your_jwt_token>`

### Events to Emit (from Postman WebSocket client):
- `join_order_room`: Emitted by customers/vendors to listen to a specific order.
  - Payload: `{ "orderId": 1 }`
- `update_location`: Emitted continuously by riders.
  - Payload: `{ "orderId": 1, "latitude": 5.6145, "longitude": -0.2057 }`

### Events to Listen for:
- `location_changed`: Received by anyone in the order room when the rider moves.
  - Response payload:
```json
{
  "orderId": 1,
  "riderId": 2,
  "latitude": 5.6145,
  "longitude": -0.2057,
  "timestamp": "2026-06-04T03:45:00.000Z"
}
```
