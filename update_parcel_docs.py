import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

confirm_delivery_docs = """
### Confirm Parcel Delivery
- **Endpoint**: `POST /api/parcels/:id/confirm-delivery`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Allows a rider to confirm they have delivered the parcel. Updates the parcel status to `delivered`, calculates earnings (base pay + distance bonus) based on System Configs, records the transaction in `rider_earnings`, and credits the rider's `rider_wallets` balance.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Parcel delivery confirmed successfully",
  "data": {
    "parcel": {
      "id": 1,
      "order_number": "PRC-...",
      "status": "delivered",
      "updated_at": "..."
    }
  }
}
```
"""

# Insert it before GET Rider Parcel Deliveries History
new_content = content.replace("### Get Rider Parcel Deliveries History", confirm_delivery_docs + "\n### Get Rider Parcel Deliveries History")

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Added Confirm Parcel Delivery to API_DOCS.md")
