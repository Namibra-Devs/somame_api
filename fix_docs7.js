const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const insertionPoint = "### Create Menu Item (Vendor Only)";
const newEndpoint = `### Get Menu Item Details (Vendor Only)
- **Endpoint**: \`GET /api/vendors/me/menu-items/:id\`
- **Headers**: \`Authorization: Bearer <your_vendor_jwt_token>\`
- **Description**: Retrieves full details of a specific menu item including its sizes and prices.
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Menu item details retrieved successfully",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "menu_category_id": 1,
    "name": "Spring Rolls",
    "description": "Crispy vegetable spring rolls",
    "price": "15.50",
    "size": "Regular",
    "sizes": [
      { "size": "Small", "price": 10.00 },
      { "size": "Regular", "price": 15.50 }
    ],
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
\`\`\`

`;

if (content.includes(insertionPoint)) {
    content = content.replace(insertionPoint, newEndpoint + insertionPoint);
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Updated successfully");
} else {
    console.log("Could not find insertion point!");
}
