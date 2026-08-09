import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

dashboard_docs = """
### Get Vendor Dashboard Statistics
- **Endpoint**: `GET /api/vendors/me/dashboard`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `vendor` role)
- **Description**: Returns dashboard statistics for the authenticated vendor, including summary cards (New, Preparing, Completed, Cancelled orders), recent orders, monthly sales overview for the current year, and top-selling menu items.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "cards": [
      { "status": "pending", "count": "23" },
      { "status": "preparing", "count": "23" },
      { "status": "delivered", "count": "23" },
      { "status": "cancelled", "count": "23" }
    ],
    "recentOrders": [
      {
        "id": 35,
        "order_number": "ORD-...",
        "status": "preparing",
        "total_amount": "235.00",
        "created_at": "2026-06-04T14:23:00.000Z",
        "first_name": "Paul",
        "last_name": "Amegah"
      }
    ],
    "salesOverview": [
      {
        "month": "1",
        "total_sales": "750.00"
      },
      {
        "month": "2",
        "total_sales": "910.00"
      }
    ],
    "topItems": [
      {
        "id": 1,
        "name": "Streetwise 2",
        "image_url": "https://...",
        "units_sold": "150"
      }
    ]
  }
}
```
"""

# Insert it before "## 3. Menu Categories" or after "### Get Vendor Orders"
new_content = content.replace("## 3. Menu Categories", dashboard_docs + "\n## 3. Menu Categories")

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Added Vendor Dashboard Docs")
