const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const getVendorOrdersStr = `### Get Vendor Orders
- **Endpoint**: \`GET /api/vendors/me/orders\`
- **Headers**: \`Authorization: Bearer <your_vendor_jwt_token>\` (Must have \`vendor\` role)
- **Query Parameters**:
  - \`search\` (optional): Search by order number or customer name.
  - \`status\` (optional): Filter by status (e.g., \`pending\`, \`preparing\`, \`delivered\`). Use \`all\` for no status filter.
  - \`dateFilter\` (optional): Filter by date (\`today\`, \`yesterday\`, \`this_week\`, \`this_month\`).
  - \`page\` (optional): Page number for pagination (default: 1).
  - \`limit\` (optional): Items per page (default: 10).
- **Description**: Retrieves a paginated list of orders for the logged-in vendor.
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Vendor orders retrieved successfully",
  "totalCount": 40,
  "data": [
    {
      "id": 35,
      "order_number": "ORD-123",
      "status": "preparing",
      "total_amount": "235.00",
      "first_name": "Paul",
      "last_name": "Amegah",
      "created_at": "2026-06-04T14:23:00.000Z"
    }
  ]
}
\`\`\`

### Get Vendor Order Details
- **Endpoint**: \`GET /api/vendors/me/orders/:id\`
- **Headers**: \`Authorization: Bearer <your_vendor_jwt_token>\` (Must have \`vendor\` role)
- **Description**: Retrieves full details of a specific order, including customer info and menu item images.
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Order details retrieved successfully",
  "data": {
    "id": 35,
    "order_number": "ORD-123",
    "status": "preparing",
    "customer_first_name": "Paul",
    "customer_last_name": "Amegah",
    "customer_phone": "05555555",
    "items": [
      {
        "id": 1,
        "item_name": "Streetwise 2",
        "quantity": 2,
        "price": "127.50",
        "image_url": "https://..."
      }
    ]
  }
}
\`\`\`

`;

// Check if it already exists, remove it if so
content = content.replace(/### Get Vendor Orders[\s\S]*?### Get Vendor Order Details[\s\S]*?```\s*?\n/g, "");

// Insert before ## 6. Vendor Menus
content = content.replace("## 6. Vendor Menus (/api/vendors)", getVendorOrdersStr + "## 6. Vendor Menus (/api/vendors)");

fs.writeFileSync(path, content, 'utf-8');
console.log("Updated API_DOCS.md with vendor order endpoints");
