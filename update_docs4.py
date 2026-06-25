import re

with open('API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Accept Food Job docs to include vendor details
old_accept_food = """    "order": {
      "id": 1,
      "order_number": "ORD-12345678-1234",
      "rider_id": 4,
      "status": "accepted"
    },"""

new_accept_food = """    "order": {
      "id": 1,
      "order_number": "ORD-12345678-1234",
      "rider_id": 4,
      "status": "accepted",
      "vendor_name": "PIZZA HUB ADENTA",
      "vendor_phone": "+233541234567",
      "vendor_address": "Rowi Junction",
      "vendor_lat": 5.6050,
      "vendor_lng": -0.1880
    },"""
content = content.replace(old_accept_food, new_accept_food)

rider_workflow_docs = """
### Arrive at Merchant (Rider)
- **Endpoint**: `POST /api/orders/:id/arrive-merchant`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Allows a rider to mark that they have arrived at the vendor's location to pick up the food.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Rider arrived at merchant",
  "data": {
    "order": {
      "id": 1,
      "status": "arrived_at_vendor"
    }
  }
}
```

### Confirm Pickup (Rider)
- **Endpoint**: `POST /api/orders/:id/confirm-pickup`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Rider submits a photo proof of the pickup. Note: the merchant confirms the OTP separately. Returns customer delivery details.
- **Body payload (JSON)**:
```json
{
  "proof_image_url": "https://storage.googleapis.com/.../proof.jpg"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Pickup confirmed. Proceed to customer.",
  "data": {
    "order": {
      "id": 1,
      "status": "out_for_delivery",
      "customer_first_name": "John",
      "customer_last_name": "Doe",
      "customer_phone": "+233541234567",
      "delivery_address": "Ring Road Central, Accra",
      "delivery_lat": 5.6030,
      "delivery_lng": -0.1860
    }
  }
}
```

### Arrive at Customer (Rider)
- **Endpoint**: `POST /api/orders/:id/arrive-customer`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Allows a rider to mark that they have arrived at the customer's delivery location.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Rider arrived at customer",
  "data": {
    "order": {
      "id": 1,
      "status": "arrived_at_customer"
    }
  }
}
```

### Confirm Delivery (Rider)
- **Endpoint**: `POST /api/orders/:id/confirm-delivery`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Rider confirms the delivery by entering the 4-digit OTP provided by the customer.
- **Body payload (JSON)**:
```json
{
  "delivery_otp": "7392"
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Delivery confirmed successfully",
  "data": {
    "order": {
      "id": 1,
      "status": "delivered"
    }
  }
}
```
"""

# Insert rider_workflow_docs after Decline Food Job section
decline_food_end = """### Decline Food Job (Targeted Dispatch)
- **Endpoint**: `POST /api/orders/:id/decline-job`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Allows a rider to decline an unassigned job order. Records the decline so the dispatch engine won't re-assign it.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Job declined successfully"
}
```
"""

content = content.replace(decline_food_end, decline_food_end + "\n" + rider_workflow_docs)

with open('API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated API_DOCS.md")
