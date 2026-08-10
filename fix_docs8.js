const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const insertionPoint = "## 6. Vendor Menus (/api/vendors)";
const newEndpoints = `### Get Vendor Customers
- **Endpoint**: \`GET /api/vendors/me/customers\`
- **Headers**: \`Authorization: Bearer <your_jwt_token>\` (Must have \`vendor\` role)
- **Description**: Returns a paginated list of distinct customers who have ordered from the vendor, sorted by their most recent order date.
- **Query Parameters**:
  - \`search\`: (Optional) Search by customer first name, last name, or phone number.
  - \`date_filter\`: (Optional) Filter by most recent order date. Options: \`today\`, \`yesterday\`, \`this_week\`, \`this_month\`.
  - \`page\`: (Optional) Default is 1.
  - \`limit\`: (Optional) Default is 10.
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": 2,
      "first_name": "Paul",
      "last_name": "Amegah",
      "phone_number": "0555555555",
      "last_order_date": "2026-06-04T03:40:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
\`\`\`

### Get Vendor Customer Details
- **Endpoint**: \`GET /api/vendors/me/customers/:id\`
- **Headers**: \`Authorization: Bearer <your_jwt_token>\` (Must have \`vendor\` role)
- **Description**: Returns detailed statistics for a specific customer, including their total orders, total spent, average order value, date joined, and a paginated list of their recent orders with this vendor.
- **Query Parameters**:
  - \`page\`: (Optional) Page number for recent orders. Default is 1.
  - \`limit\`: (Optional) Number of recent orders per page. Default is 10.
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Customer details retrieved successfully",
  "data": {
    "stats": {
      "id": 2,
      "first_name": "Paul",
      "last_name": "Amegah",
      "phone_number": "0555555555",
      "date_joined": "2020-06-23T00:00:00.000Z",
      "total_orders": "23",
      "total_spent": "23000.00",
      "last_order": "2026-03-23T00:00:00.000Z",
      "average_order": "180.00"
    },
    "recentOrders": [
      {
        "id": 1,
        "order_number": "ORD-12345",
        "status": "completed",
        "total_amount": "235.00",
        "created_at": "2026-06-04T03:40:00.000Z",
        "customer_note": "Extra spicy",
        "estimated_delivery_time": "2026-06-04T04:10:00.000Z"
      }
    ],
    "pagination": {
      "total": 23,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
\`\`\`

`;

if (content.includes(insertionPoint)) {
    content = content.replace(insertionPoint, newEndpoints + insertionPoint);
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Updated API_DOCS.md successfully");
} else {
    console.log("Could not find insertion point!");
}
