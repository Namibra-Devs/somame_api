const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const regexCreate = /  "price": 15\.50,\r?\n  "size": "Regular",/g;
const replacementCreate = `  "sizes": [
    { "size": "Small", "price": 10.00 },
    { "size": "Regular", "price": 15.50 }
  ],`;

if (regexCreate.test(content)) {
    content = content.replace(regexCreate, replacementCreate);
} else {
    console.log("Could not find regex match for Create!");
}

const regexUpdate = /  "price": 18\.00,\r?\n  "is_in_stock": false/g;
const replacementUpdate = `  "sizes": [
    { "size": "Small", "price": 12.00 },
    { "size": "Regular", "price": 18.00 }
  ],
  "is_in_stock": false`;

if (regexUpdate.test(content)) {
    content = content.replace(regexUpdate, replacementUpdate);
} else {
    console.log("Could not find regex match for Update!");
}

fs.writeFileSync(path, content, 'utf-8');
console.log("Updated successfully");
