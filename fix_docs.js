const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

// The replacement messed up the example response. Let's find "Retrieves all menu categories for the logged-in vendor." and insert the response.
const searchStr = `- **Description**: Retrieves all menu categories for the logged-in vendor.\n- **Endpoint**: \`POST /api/vendors/me/menu-categories\``;

const correctStr = `- **Description**: Retrieves all menu categories for the logged-in vendor.
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Request processed successfully",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "name": "Starters",
      "description": "Appetizers and quick bites",
      "item_count": "40",
      "created_at": "2026-06-04T03:30:00.000Z",
      "updated_at": "2026-06-04T03:30:00.000Z"
    }
  ]
}
\`\`\`

### Create Menu Category (Vendor Only)
- **Endpoint**: \`POST /api/vendors/me/menu-categories\``;

content = content.replace(searchStr, correctStr);
fs.writeFileSync(path, content, 'utf-8');
console.log("Fixed API_DOCS");
