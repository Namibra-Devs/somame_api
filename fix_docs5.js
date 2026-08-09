const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const regex = /### Get My Menu Items \(Vendor Only\)[\s\S]*?- \*\*Query Parameters\*\*:\r?\n  - \`category_id\`: \(Optional\) Filter items by a specific menu category ID\. Example: \`\?category_id=1\`/g;

const replacement = `### Get My Menu Items (Vendor Only)
- **Endpoint**: \`GET /api/vendors/me/menu-items\`
- **Headers**: \`Authorization: Bearer <your_vendor_jwt_token>\`
- **Description**: Retrieves all menu items for the logged-in vendor.
- **Query Parameters**:
  - \`category_id\`: (Optional) Filter items by a specific menu category ID. Example: \`?category_id=1\`
  - \`search\`: (Optional) Search items by name. Example: \`?search=rice\``;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Updated successfully");
} else {
    console.log("Could not find regex match!");
}
