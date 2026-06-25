import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Create Parcel endpoint body payload
old_parcel_body = """    "pickup_location": {
      "lat": 5.6145,
      "lng": -0.2057
    },
    "dropoff_location": {
      "lat": 5.6030,
      "lng": -0.1860
    },"""
new_parcel_body = """    "pickup_location": {
      "lat": 5.6145,
      "lng": -0.2057
    },
    "pickup_address": "Adenta- Dodowa Road",
    "dropoff_location": {
      "lat": 5.6030,
      "lng": -0.1860
    },
    "dropoff_address": "Madina","""
content = content.replace(old_parcel_body, new_parcel_body)

# 2. Add Rider History Endpoints
new_endpoints = """
### Get Rider Food Deliveries History
- **Endpoint**: `GET /api/orders/rider-history`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Returns a list of all food deliveries assigned to the logged-in rider, ordered by date.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Rider food deliveries retrieved successfully",
  "data": [
    {
      "id": 1,
      "order_number": "ORD-12345",
      "status": "delivered",
      "total_amount": "101.34",
      "created_at": "2026-06-04T13:34:00.000Z",
      "delivery_address": "Madina",
      "vendor_name": "KFC - Adenta",
      "vendor_logo_url": "...",
      "vendor_address": "Adenta- Dodowa Road",
      "delivery_lat": 5.6030,
      "delivery_lng": -0.1860,
      "vendor_lat": 5.6145,
      "vendor_lng": -0.2057
    }
  ]
}
```

### Get Rider Parcel Deliveries History
- **Endpoint**: `GET /api/parcels/rider-history`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Returns a list of all parcel deliveries assigned to the logged-in rider, ordered by date.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Rider parcel deliveries retrieved successfully",
  "data": [
    {
      "id": 1,
      "order_number": "PAR-ABC-1234",
      "pickup_address": "Adenta- Dodowa Road",
      "dropoff_address": "Madina",
      "distance_km": "3.50",
      "total_amount": "23.50",
      "status": "delivered",
      "created_at": "2026-06-04T13:34:00.000Z",
      "pickup_lat": 5.6145,
      "pickup_lng": -0.2057,
      "dropoff_lat": 5.6030,
      "dropoff_lng": -0.1860
    }
  ]
}
```
"""

content += new_endpoints

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated API_DOCS.md successfully")
