const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

// Replace "description": "Appetizers and quick bites", followed by whitespace and "created_at"
const regex = /"description": "Appetizers and quick bites",\r?\n\s*"created_at":/g;

if (regex.test(content)) {
    content = content.replace(regex, `"description": "Appetizers and quick bites",\n      "item_count": "40",\n      "created_at":`);
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Updated successfully");
} else {
    console.log("Could not find regex match!");
}
