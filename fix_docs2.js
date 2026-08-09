const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const oldStr = `      "description": "Appetizers and quick bites",
      "created_at": "2026-06-04T03:30:00.000Z",`;

const newStr = `      "description": "Appetizers and quick bites",
      "item_count": "40",
      "created_at": "2026-06-04T03:30:00.000Z",`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Updated successfully");
} else {
    console.log("Could not find old string!");
}
