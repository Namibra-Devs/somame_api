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

### Seed Admin (Hidden)
- **Endpoint**: `POST /api/auth/seed-admin`
- **Description**: Creates a new admin user directly. Fails if an admin already exists.
- **Body payload (JSON)**:
```json
{
  "phone_number": "0000000000",
  "password": "supersecretadmin"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Admin seeded successfully"
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

## 3. Users (/api/users)

### Get User Profile (Protected)
- **Endpoint**: `GET /api/users/profile`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Retrieves the logged-in user's profile details.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "first_name": "Hamza",
    "last_name": "Ibrahim",
    "email": "zero@example.com",
    "phone_number": "1234567890",
    "role": "customer",
    "is_verified": true,
    "created_at": "2026-06-04T03:30:00.000Z"
  }
}
```

### Update User Profile (Protected)
- **Endpoint**: `PUT /api/users/profile`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Updates the logged-in user's profile details.
- **Body payload (JSON)**:
```json
{
  "first_name": "Hamza",
  "last_name": "Ibramin",
  "email": "zero@example.com"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "first_name": "Hamza",
    "last_name": "Ibramin",
    "email": "zero@example.com",
    "phone_number": "1234567890",
    "role": "customer",
    "is_verified": true,
    "is_active": true,
    "updated_at": "2026-06-04T03:30:00.000Z"
  }
}
```

### Update Password (Protected)
- **Endpoint**: `PUT /api/users/password`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Updates the logged-in user's password.
- **Body payload (JSON)**:
```json
{
  "old_password": "my_current_password",
  "new_password": "my_new_secure_password"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Password updated successfully"
}
```

### Update User Status (Admin Only)
- **Endpoint**: `PATCH /api/users/:id/status`
- **Headers**: `Authorization: Bearer <your_admin_jwt_token>`
- **Description**: Bans or unbans a user instantly from the platform.
- **Body payload (JSON)**:
```json
{
  "is_active": false
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "phone_number": "1234567890",
    "is_active": false
  }
}
```

### Get My Saved Addresses (Customer)
- **Endpoint**: `GET /api/users/me/addresses`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Retrieves all saved addresses for the logged-in user.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "customer_id": 3,
      "type": "home",
      "name": "Home",
      "address_text": "123 Main St, Accra",
      "lat": 5.6145,
      "lng": -0.2057,
      "created_at": "2026-06-21T08:00:00.000Z",
      "updated_at": "2026-06-21T08:00:00.000Z"
    }
  ]
}
```

### Add a Saved Address (Customer)
- **Endpoint**: `POST /api/users/me/addresses`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "type": "custom", // "home", "work", or "custom"
  "name": "Mom's Place", // required (TEXT - e.g., "Mom's Place" for Mom's Place)
  "address_text": "456 Market Road, Kumasi", // required (TEXT - e.g., "456 Market Road, Kumasi" for 456 Market Road, Kumasi)
  "location": {
    "lat": 6.6885, // required (DECIMAL - e.g., 6.6885 for 6.6885)
    "lng": -1.6244 // required (DECIMAL - e.g., -1.6244 for -1.6244)
  }
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "customer_id": 3,
    "type": "home",
    "name": "Home",
    "address_text": "123 Main St, Accra",
    "lat": 5.6145,
    "lng": -0.2057,
    "created_at": "2026-06-21T08:00:00.000Z",
    "updated_at": "2026-06-21T08:00:00.000Z"
  }
}
```

### Update a Saved Address (Customer)
- **Endpoint**: `PUT /api/users/me/addresses/:id`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "name": "Mother's House" // optional (TEXT - e.g., "Mother's House" for Mother's House)
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "customer_id": 3,
    "type": "home",
    "name": "Home",
    "address_text": "123 Main St, Accra",
    "lat": 5.6145,
    "lng": -0.2057,
    "created_at": "2026-06-21T08:00:00.000Z",
    "updated_at": "2026-06-21T08:00:00.000Z"
  }
}
```

### Delete a Saved Address (Customer)
- **Endpoint**: `DELETE /api/users/me/addresses/:id`
- **Headers**: `Authorization: Bearer <your_jwt_token>`

---

## 4. Categories (/api/categories)

### Get All Categories (Public)
- **Endpoint**: `GET /api/categories`
- **Description**: Retrieves all categories.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "name": "Fast Food",
      "description": "Quick and tasty meals",
      "is_active": true,
      "created_at": "2026-06-04T03:30:00.000Z",
      "updated_at": "2026-06-04T03:30:00.000Z"
    }
  ]
}
```

### Create Category (Admin Only)
- **Endpoint**: `POST /api/categories`
- **Headers**: `Authorization: Bearer <your_admin_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "name": "Fast Food",
  "description": "Quick and tasty meals"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "name": "Fast Food",
    "description": "Quick and tasty meals",
    "is_active": true,
    "created_at": "2026-06-04T03:30:00.000Z",
    "updated_at": "2026-06-04T03:30:00.000Z"
  }
}
```

### Update Category (Admin Only)
- **Endpoint**: `PUT /api/categories/:id`
- **Headers**: `Authorization: Bearer <your_admin_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "name": "Fast Food",
  "description": "Updated description",
  "is_active": true
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "name": "Fast Food",
    "description": "Updated description",
    "is_active": true,
    "created_at": "2026-06-04T03:30:00.000Z",
    "updated_at": "2026-06-04T03:35:00.000Z"
  }
}
```

### Patch Category (Admin Only)
- **Endpoint**: `PATCH /api/categories/:id`
- **Headers**: `Authorization: Bearer <your_admin_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "is_active": false
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "name": "Fast Food",
    "description": "Updated description",
    "is_active": false,
    "created_at": "2026-06-04T03:30:00.000Z",
    "updated_at": "2026-06-04T03:40:00.000Z"
  }
}
```

### Delete Category (Admin Only)
- **Endpoint**: `DELETE /api/categories/:id`
- **Headers**: `Authorization: Bearer <your_admin_jwt_token>`
- **Example Response**:
```json
{
  "status": "success",
  "message": "Category removed"
}
```

---

## 5. Vendors (/api/vendors)

### Create a Vendor (Protected)
- **Endpoint**: `POST /api/vendors`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Adds a new vendor with their physical coordinates to the database. The `user_id` is automatically extracted from your JWT token to link the vendor profile to your account.
- **Body payload (JSON)**:
```json
{
  "name": "KFC Accra",
  "category_id": 1,
  "logo_url": "https://example.com/logo.png",
  "tags": "fast food, chicken, local",
  "rating": 4.5,
  "lat": 5.6037,
  "lng": -0.1870
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "name": "KFC Accra",
    "user_id": 2,
    "logo_url": "https://example.com/logo.png",
    "rating": "4.50",
    "tags": "fast food, chicken, local",
    "location": "0101000020E610000022204E9484F2C7BF8BC0EB255EE61640",
    "created_at": "2026-06-04T03:35:00.000Z"
  }
}
```

### Get My Vendor Profile (Protected)
- **Endpoint**: `GET /api/vendors/me`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Fetches the vendor profile linked to the logged-in user.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "user_id": 2,
    "category_id": 1,
    "name": "KFC Accra",
    "logo_url": "https://example.com/logo.png",
    "rating": "4.50",
    "tags": "fast food, chicken, local",
    "is_open": true,
    "lat": 5.6037,
    "lng": -0.1870,
    "created_at": "2026-06-04T03:35:00.000Z",
    "updated_at": "2026-06-04T03:35:00.000Z"
  }
}
```

### Update My Vendor Profile (Protected)
- **Endpoint**: `PUT /api/vendors/me`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Updates the vendor profile for the logged-in user. Only provided fields are updated.
- **Body payload (JSON)**:
```json
{
  "name": "KFC East Legon",
  "category_id": 2,
  "logo_url": "https://example.com/newlogo.png",
  "tags": "drinks, continental",
  "lat": 5.6150,
  "lng": -0.1900,
  "is_open": false
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "user_id": 2,
    "category_id": 2,
    "name": "KFC East Legon",
    "logo_url": "https://example.com/newlogo.png",
    "rating": "4.50",
    "tags": "drinks, continental",
    "is_open": false,
    "lat": 5.6150,
    "lng": -0.1900,
    "created_at": "2026-06-04T03:35:00.000Z",
    "updated_at": "2026-06-04T03:40:00.000Z"
  }
}
```

### Search and Filter Vendors (Public)
- **Endpoint**: `GET /api/vendors/search`
- **Description**: Searches vendors by name or category, and allows filtering by category or open status. Can also sort by rating or distance if location is provided.
- **Query Parameters**:
  - `q`: Search keyword (matches vendor name or category name)
  - `is_open`: (true/false) Filter for currently open vendors
  - `category_id`: Filter by a specific category
  - `lat`, `lng`: Latitude and longitude (optional, sorts results by distance unless `sort=rating` is provided)
  - `radius`: Radius in meters (only applied if lat/lng are provided)
  - `sort`: Sort parameter (optional, use `rating` to sort by highest rating. Defaults to alphabetical, or distance if lat/lng are provided). *NB*: However, if you also provide your lat and lng coordinates, it will intelligently override the default and sort by the closest distance instead.
- **Example Usage**: `GET /api/vendors/search?q=pizza&is_open=true&lat=5.6037&lng=-0.1870&sort=rating`
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "count": 1,
  "data": [
    {
      "id": 1,
      "name": "KFC Accra",
      "logo_url": "https://example.com/logo.png",
      "rating": "4.50",
      "is_open": true,
      "lat": 5.6037,
      "lng": -0.1870,
      "distance": 0
    }
  ]
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
  "message": "Request processed successfully",
  "count": 1,
  "data": [
    {
      "id": 1,
      "name": "KFC Accra",
      "logo_url": "https://example.com/logo.png",
      "rating": "4.50",
      "is_open": true,
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
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "name": "KFC Accra",
    "logo_url": "https://example.com/logo.png",
    "rating": "4.50",
    "is_open": true,
    "lat": 5.6037,
    "lng": -0.1870,
    "created_at": "2026-06-04T03:35:00.000Z"
  }
}
```

---

## 6. Vendor Menus (/api/vendors)

### Get Vendor Full Menu (Public)
- **Endpoint**: `GET /api/vendors/:id/menu`
- **Description**: Retrieves the full menu for a vendor, grouped by menu categories.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "name": "Starters",
      "description": "Appetizers and quick bites",
      "items": [
        {
          "id": 1,
          "menu_category_id": 1,
          "name": "Spring Rolls",
          "price": "15.50",
          "size": "Regular",
          "is_in_stock": true
        }
      ]
    }
  ]
}
```

### Get My Menu Categories (Vendor Only)
- **Endpoint**: `GET /api/vendors/me/menu-categories`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Retrieves all menu categories for the logged-in vendor.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "name": "Starters",
      "description": "Appetizers and quick bites",
      "created_at": "2026-06-04T03:30:00.000Z",
      "updated_at": "2026-06-04T03:30:00.000Z"
    }
  ]
}
```

### Create Menu Category (Vendor Only)
- **Endpoint**: `POST /api/vendors/me/menu-categories`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "name": "Starters",
  "description": "Appetizers and quick bites"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "name": "Starters",
    "description": "Appetizers and quick bites",
    "created_at": "2026-06-04T03:30:00.000Z",
    "updated_at": "2026-06-04T03:30:00.000Z"
  }
}
```

### Update Menu Category (Vendor Only)
- **Endpoint**: `PUT /api/vendors/me/menu-categories/:id`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "name": "Appetizers"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "name": "Appetizers",
    "description": "Appetizers and quick bites",
    "created_at": "2026-06-04T03:30:00.000Z",
    "updated_at": "2026-06-04T03:35:00.000Z"
  }
}
```

### Delete Menu Category (Vendor Only)
- **Endpoint**: `DELETE /api/vendors/me/menu-categories/:id`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Deletes a specific menu category belonging to the vendor.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Menu category deleted successfully"
}
```

### Get My Menu Items (Vendor Only)
- **Endpoint**: `GET /api/vendors/me/menu-items`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Retrieves all menu items for the logged-in vendor.
- **Query Parameters**:
  - `category_id`: (Optional) Filter items by a specific menu category ID. Example: `?category_id=1`
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "menu_category_id": 1,
      "name": "Spring Rolls",
      "description": "Crispy vegetable spring rolls",
      "price": "15.50",
      "size": "Regular",
      "quantity": 3,
      "image_url": "https://example.com/springrolls.jpg",
      "extras": [
        { "name": "Sweet Chili Sauce", "price": 2.00 }
      ],
      "is_in_stock": true,
      "created_at": "2026-06-04T03:30:00.000Z",
      "updated_at": "2026-06-04T03:30:00.000Z"
    }
  ]
}
```

### Get My Vendor Orders (Vendor Only)
- **Endpoint**: `GET /api/vendors/me/orders`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Retrieves all orders that have been placed with this vendor, sorted from newest to oldest.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "order_number": "ORD-1X2Y3Z-1234",
      "customer_id": 3,
      "vendor_id": 1,
      "rider_id": 2,
      "status": "pending",
      "total_amount": "46.50",
      "promotion_id": null,
      "discount_amount": "0.00",
      "rider_tip": "5.00",
      "estimated_delivery_time": null,
      "customer_note": "Please leave at the front door",
      "payment_method": "momo",
      "payment_status": "pending",
      "created_at": "2026-06-04T03:40:00.000Z"
    }
  ]
}
```

### Create Menu Item (Vendor Only)
- **Endpoint**: `POST /api/vendors/me/menu-items`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "menu_category_id": 1,
  "name": "Spring Rolls",
  "description": "Crispy vegetable spring rolls",
  "price": 15.50,
  "size": "Regular",
  "quantity": 3,
  "image_url": "https://example.com/springrolls.jpg",
  "extras": [
    { "name": "Sweet Chili Sauce", "price": 2.00 }
  ],
  "is_in_stock": true
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "menu_category_id": 1,
    "name": "Spring Rolls",
    "description": "Crispy vegetable spring rolls",
    "price": "15.50",
    "size": "Regular",
    "quantity": 3,
    "image_url": "https://example.com/springrolls.jpg",
    "extras": [
      { "name": "Sweet Chili Sauce", "price": 2.00 }
    ],
    "is_in_stock": true,
    "created_at": "2026-06-04T03:30:00.000Z",
    "updated_at": "2026-06-04T03:30:00.000Z"
  }
}
```

### Update Menu Item (Vendor Only)
- **Endpoint**: `PUT /api/vendors/me/menu-items/:id`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "price": 18.00,
  "is_in_stock": false
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "menu_category_id": 1,
    "name": "Spring Rolls",
    "description": "Crispy vegetable spring rolls",
    "price": "18.00",
    "size": "Regular",
    "quantity": 3,
    "image_url": "https://example.com/springrolls.jpg",
    "extras": [
      { "name": "Sweet Chili Sauce", "price": 2.00 }
    ],
    "is_in_stock": false,
    "created_at": "2026-06-04T03:30:00.000Z",
    "updated_at": "2026-06-04T03:40:00.000Z"
  }
}
```

### Delete Menu Item (Vendor Only)
- **Endpoint**: `DELETE /api/vendors/me/menu-items/:id`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Deletes a specific menu item belonging to the vendor.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Menu item deleted successfully"
}
```

---

## 7. Orders (/api/orders)

### Create an Order (Protected)
- **Endpoint**: `POST /api/orders`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Creates a new order, saves line items, and initializes delivery tracking.
- **Body payload (JSON)**:
```json
{
  "vendor_id": 1,
  "rider_id": 2, // this isoptional for now
  "total_amount": 46.50,
  "promotion_id": 1,
  "discount_amount": 9.00, // this is optional for now
  "rider_tip": 5.00, // optional rider tip amount
  "estimated_delivery_time": "2026-06-04T04:10:00.000Z", // optional
  "customer_note": "Please leave at the front door", // optional
  "payment_method": "momo", // this can be momo, cash, card, stripe
  "items": [
    { "item_id": 1, "item_name": "Fried Rice", "quantity": 2, "price": 20.00 }, // should be get from the menu_items table using the item_id
    { "item_id": 2, "item_name": "Chicken", "quantity": 1, "price": 15.50 } // should be get from the menu_items table using the item_id
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
  "message": "Request processed successfully",
  "data": {
    "order": {
      "id": 1,
      "order_number": "ORD-1X2Y3Z-1234",
      "customer_id": 3,
      "vendor_id": 1,
      "rider_id": 2,
      "status": "pending",
      "total_amount": "46.50",
      "promotion_id": 1,
      "discount_amount": "9.00",
      "rider_tip": "5.00",
      "estimated_delivery_time": "2026-06-04T04:10:00.000Z",
      "customer_note": "Please leave at the front door",
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

### Get My Orders (Protected)
- **Endpoint**: `GET /api/orders/me`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Fetch all orders created by the logged-in customer.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "order_number": "ORD-1X2Y3Z-1234",
      "customer_id": 3,
      "vendor_id": 1,
      "rider_id": 2,
      "status": "pending",
      "total_amount": "46.50",
      "promotion_id": 1,
      "discount_amount": "9.00",
      "rider_tip": "5.00",
      "estimated_delivery_time": "2026-06-04T04:10:00.000Z",
      "customer_note": "Please leave at the front door",
      "payment_method": "momo",
      "payment_status": "pending",
      "created_at": "2026-06-04T03:40:00.000Z"
    }
  ]
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
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-1X2Y3Z-1234",
    "customer_id": 3,
    "vendor_id": 1,
    "rider_id": 2,
    "status": "pending",
    "total_amount": "46.50",
    "promotion_id": 1,
    "discount_amount": "9.00",
    "rider_tip": "5.00",
    "estimated_delivery_time": "2026-06-04T04:10:00.000Z",
    "customer_note": "Please leave at the front door",
    "payment_method": "momo",
    "payment_status": "pending",
    "created_at": "2026-06-04T03:40:00.000Z",
    "items": [
      {
        "id": 1,
        "order_id": 1,
        "item_id": 1,
        "item_name": "Fried Rice",
        "quantity": 2,
        "price": "20.00"
      },
      {
        "id": 2,
        "order_id": 1,
        "item_id": 2,
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

### Update Order Status (Vendor / Rider / Admin)
- **Endpoint**: `PATCH /api/orders/:id/status`
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Description**: Updates the status of an order. Vendors can update to `accepted` or `preparing`. Riders can update to `out_for_delivery` or `delivered`.
- **Body payload (JSON)**:
```json
{
  "status": "accepted"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-1X2Y3Z-1234",
    "customer_id": 3,
    "vendor_id": 1,
    "rider_id": 2,
    "status": "accepted",
    "total_amount": "46.50",
    "created_at": "2026-06-04T03:40:00.000Z"
  }
}
```

### Submit Ratings (Customer Only)
- **Endpoint**: `POST /api/orders/:id/ratings`
- **Headers**: `Authorization: Bearer <your_customer_jwt_token>`
- **Description**: Submits ratings and comments for the vendor and/or the rider for a delivered order. Both can be submitted at the same time, or just one.
- **Body payload (JSON)**:
```json
{
  "vendor_rating": 5, // integer between 1 and 5 (optional)
  "vendor_comment": "The food was hot and delicious!", // string (optional)
  "rider_rating": 4, // integer between 1 and 5 (optional)
  "rider_comment": "Fast delivery, but spilled a little drink." // string (optional)
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Ratings submitted successfully"
}
```

---

## 8. Delivery Tracking (/api/deliveries)

Connect to the Socket.io server by passing the JWT token. 

**Connection Headers**: 
`Authorization: Bearer <your_jwt_token>`

### Events to Emit (from Postman WebSocket client):
- `join_order_room`: Emitted by customers/vendors/riders to listen to a specific order.
  - Payload: `{ "orderId": 1, "orderType": "food" }` (Note: `orderType` defaults to "food", but for parcels you must send `"orderType": "parcel"`)
- `update_location`: Emitted continuously by riders.
  - Payload: `{ "orderId": 1, "orderType": "food", "latitude": 5.6145, "longitude": -0.2057 }`

### Events to Listen for:
- `location_changed`: Received by anyone in the order room when the rider moves.
  - Response payload:
```json
{
  "orderId": 1,
  "orderType": "food",
  "riderId": 2,
  "latitude": 5.6145,
  "longitude": -0.2057,
  "timestamp": "2026-06-04T03:45:00.000Z"
}
```

---

## 9. Vendor Promotions

### Create Promotion (Vendor Only)
- **Endpoint**: `POST /api/vendors/me/promotions`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Creates a new promotional code for the vendor.
- **Body payload (JSON)**:
```json
{
  "code": "SUMMER15",
  "discount_type": "percentage", // can be "percentage" or "fixed" (DECIMAL - e.g., 15 for 15%, or 5 for $5 off)
  "discount_value": 15, // can be percentage value or fixed amount (DECIMAL - e.g., 15 for 15%, or 5 for $5 off)
  "min_order_subtotal": 50.00, // optional (DECIMAL - e.g., 50.00 for $50 minimum)
  "max_discount_limit": 20.00, // optional (DECIMAL - e.g., 20.00 for $20 maximum discount)
  "applicable_to": { "type": "all", "ids": [] }, // "all" or "category" or "item" (JSONB - e.g., { "type": "all", "ids": [] } for all items)
  "expires_at": "2026-12-31T23:59:59Z", // required (TIMESTAMP WITH TIME ZONE - e.g., 2026-12-31T23:59:59Z for December 31, 2026)
  "is_active": true // optional
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "code": "SUMMER15",
    "discount_type": "percentage",
    "discount_value": 15,
    "min_order_subtotal": 50.00,
    "max_discount_limit": 20.00,
    "applicable_to": { "type": "all", "ids": [] },
    "expires_at": "2026-12-31T23:59:59Z",
    "is_active": true,
    "created_at": "2026-06-04T03:50:00.000Z",
    "updated_at": "2026-06-04T03:50:00.000Z"
  }
}
```

### Get My Promotions (Vendor Only)
- **Endpoint**: `GET /api/vendors/me/promotions`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Retrieves all promotions created by the vendor.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "code": "SUMMER15",
      "discount_type": "percentage",
      "discount_value": 15,
      "min_order_subtotal": 50.00,
      "max_discount_limit": 20.00,
      "applicable_to": { "type": "all", "ids": [] },
      "expires_at": "2026-12-31T23:59:59Z",
      "is_active": true,
      "created_at": "2026-06-04T03:50:00.000Z",
      "updated_at": "2026-06-04T03:50:00.000Z"
    }
  ]
}
```

### Update Promotion (Vendor Only)
- **Endpoint**: `PUT /api/vendors/me/promotions/:id`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Updates an existing promotion (e.g., to turn it off, set `is_active: false`).
- **Body payload (JSON)**:
```json
{
  "is_active": false, // can be true or false
  "expires_at": "2026-10-31T23:59:59Z" // required (TIMESTAMP WITH TIME ZONE - e.g., 2026-10-31T23:59:59Z for October 31, 2026)
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "code": "SUMMER15",
    "discount_type": "percentage",
    "discount_value": 15,
    "min_order_subtotal": 50.00,
    "max_discount_limit": 20.00,
    "applicable_to": { "type": "all", "ids": [] },
    "expires_at": "2026-10-31T23:59:59Z",
    "is_active": false,
    "created_at": "2026-06-04T03:50:00.000Z",
    "updated_at": "2026-06-04T03:50:00.000Z"
  }
}
```

### Delete Promotion (Vendor Only)
- **Endpoint**: `DELETE /api/vendors/me/promotions/:id`
- **Headers**: `Authorization: Bearer <your_vendor_jwt_token>`
- **Description**: Deletes a promotion.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Promotion deleted successfully"
}
```

### Validate Promo Code (Customer / Public)
- **Endpoint**: `POST /api/orders/validate-promo`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Optional, but recommended)
- **Description**: Validates a promo code and calculates the discount amount. The `items` array is required if the promotion is set to specific categories or items.
- **Body payload (JSON)**:
```json
{
  "vendor_id": 1, // required (INT - e.g., 1 for vendor ID 1)
  "code": "SUMMER15", // required (TEXT - e.g., "SUMMER15" for "SUMMER15" promo code)
  "subtotal": 60.00, // required (DECIMAL - e.g., 60.00 for $60.00)
  "items": [  // if the promo is for all or category or item this list is required. (ARRAY - e.g., [{ "id": 1, "menu_category_id": 1, "price": 30.00, "quantity": 2 }] for all items)
    { "id": 1, "menu_category_id": 1, "price": 30.00, "quantity": 2 } // id is item id, menu_category_id is category id, price is item price, quantity is item quantity
  ]
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "promotion_id": 1,
    "code": "SUMMER15",
    "discount_type": "percentage",
    "discount_amount": 9.00,
    "original_subtotal": 60.00,
    "new_subtotal": 51.00
  }
}
}
```

---

## 10. Admin Configurations (/api/admin)

### Get System Configurations
- **Endpoint**: `GET /api/admin/configs`
- **Description**: Retrieves current system configurations (fares, fees).
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "parcel_base_fare": 10.00,
    "parcel_per_km_fee": 2.50,
    "parcel_service_fee": 5.00,
    "parcel_express_multiplier": 1.50
  }
}
```

### Update System Configurations (Admin Only)
- **Endpoint**: `PUT /api/admin/configs`
- **Headers**: `Authorization: Bearer <admin_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "parcel_base_fare": 12.00, // optional (DECIMAL - e.g., 12.00 for $12.00 base fare)
  "parcel_per_km_fee": 3.00, // optional (DECIMAL - e.g., 3.00 for $3.00 per km)
  "parcel_service_fee": 5.00, // optional (DECIMAL - e.g., 5.00 for $5.00 service fee)
  "parcel_express_multiplier": 1.50 // optional (DECIMAL - e.g., 1.50 for 1.50x express multiplier)
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "System configurations updated successfully",
  "data": {
    "parcel_base_fare": 12.00,
    "parcel_per_km_fee": 3.00,
    "parcel_service_fee": 5.00,
    "parcel_express_multiplier": 1.50
  }
}
```

---

## 11. Parcel Delivery (/api/parcels)

### Calculate Parcel Fare (Customer)
- **Endpoint**: `POST /api/parcels/calculate-fare`
- **Headers**: `Authorization: Bearer <customer_jwt_token>` (Optional but recommended)
- **Description**: Calculates the exact price for a parcel delivery based on the Google Maps distance calculated on the frontend.
- **Body payload (JSON)**:
```json
{
  "distance_km": 15.4,
  "delivery_speed": "express" // "standard" or "express"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "distance_km": 15.4,
    "delivery_speed": "express",
    "base_fare": "10.00",
    "distance_fare": "38.50",
    "service_fee": "5.00",
    "total_amount": "80.25",
    "estimated_time_mins": 57
  }
}
```

### Create Parcel Order (Customer Only)
- **Endpoint**: `POST /api/parcels`
- **Headers**: `Authorization: Bearer <customer_jwt_token>`
- **Body payload (JSON)**:
```json
{
  "pickup_location": { "lat": 5.6145, "lng": -0.2057 }, // required
  "dropoff_location": { "lat": 5.6037, "lng": -0.1870 }, // required
  "distance_km": 15.4, // required
  "item_description": "A fragile vase", // optional
  "item_value": 250.00, // optional
  "item_photo_url": "https://example.com/photo.jpg", // optional
  "recipient_name": "John Doe", // required
  "recipient_phone": "+233541234567", // required
  "delivery_speed": "express", // required 
  "payment_method": "momo" // required
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "order_number": "PAR-A1B2C3-5678",
    "status": "pending",
    "total_amount": "80.25",
    "created_at": "2026-06-21T08:00:00.000Z"
  }
}
```

### Get My Parcels (Customer Only)
- **Endpoint**: `GET /api/parcels/me`
- **Headers**: `Authorization: Bearer <customer_jwt_token>`
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "order_number": "PAR-A1B2C3-5678",
      "distance_km": "15.40",
      "estimated_time_mins": 57,
      "item_description": "A fragile vase",
      "delivery_speed": "express",
      "status": "pending",
      "total_amount": "80.25",
      "created_at": "2026-06-21T08:00:00.000Z"
    }
  ]
}
```

### Get Parcel Details (Customer / Rider)
- **Endpoint**: `GET /api/parcels/:id`
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Description**: Get tracking info, coordinates, and details for the parcel order.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": {
    "id": 1,
    "order_number": "PAR-A1B2C3-5678",
    "customer_id": 3,
    "rider_id": null,
    "pickup_lat": 5.6145,
    "pickup_lng": -0.2057,
    "dropoff_lat": 5.6037,
    "dropoff_lng": -0.1870,
    "distance_km": "15.40",
    "estimated_time_mins": 57,
    "item_description": "A fragile vase",
    "item_value": "250.00",
    "item_photo_url": "https://example.com/photo.jpg",
    "recipient_name": "John Doe",
    "recipient_phone": "+233541234567",
    "delivery_speed": "express",
    "status": "pending",
    "total_amount": "80.25",
    "payment_method": "momo",
    "payment_status": "pending",
    "created_at": "2026-06-21T08:00:00.000Z",
    "customer_first_name": "Jane",
    "customer_last_name": "Doe",
    "customer_phone": "+233540000000"
  }
}
```
