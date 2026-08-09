const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const oldStr = `- **Query Parameters**:
  - \`category_id\`: (Optional) Filter items by a specific menu category ID. Example: \`?category_id=1\``;

const newStr = `- **Query Parameters**:
  - \`category_id\`: (Optional) Filter items by a specific menu category ID. Example: \`?category_id=1\`
  - \`search\`: (Optional) Search items by name. Example: \`?search=rice\``;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Updated successfully");
} else {
    console.log("Could not find old string!");
}
