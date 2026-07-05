import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

payment_docs = """
## Rider Payment Methods

### Get Rider Payment Methods
- **Endpoint**: `GET /api/riders/me/payment-methods`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Returns a list of all saved payment methods for the logged-in rider.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Rider payment methods retrieved successfully",
  "data": [
    {
      "id": 1,
      "rider_id": 2,
      "provider": "bank",
      "account_name": "John Doe",
      "account_number": "0023423423423",
      "bank_name": "GCB Bank",
      "branch": "Madina",
      "is_default": true,
      "created_at": "2026-07-01T10:00:00.000Z"
    }
  ]
}
```

### Add Rider Payment Method
- **Endpoint**: `POST /api/riders/me/payment-methods`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Adds a new payment method (bank or momo) for the rider.
- **Body payload (JSON)**:
  - For Bank:
    ```json
    {
      "provider": "bank",
      "account_name": "John Doe",
      "account_number": "1234567890123",
      "bank_name": "GCB Bank",
      "branch": "Madina",
      "is_default": true
    }
    ```
  - For Mobile Money (momo):
    ```json
    {
      "provider": "momo",
      "account_name": "John Doe",
      "account_number": "+233541234567",
      "is_default": false
    }
    ```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Payment method added successfully",
  "data": { ... }
}
```

### Update Rider Payment Method
- **Endpoint**: `PUT /api/riders/me/payment-methods/:id`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Updates an existing payment method for the rider. Send only the fields to update.
- **Body payload (JSON)**:
```json
{
  "account_name": "Jonathan Doe",
  "branch": "East Legon"
}
```

### Delete Rider Payment Method
- **Endpoint**: `DELETE /api/riders/me/payment-methods/:id`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Deletes an existing payment method.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Payment method deleted successfully"
}
```
"""

content += payment_docs

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated API_DOCS.md successfully")
