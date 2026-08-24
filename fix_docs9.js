const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

// Update POST /api/vendors
content = content.replace(
  '"name": "KFC Accra", // Store name',
  '"name": "KFC Accra", // Store name\n  "description": "Best fried chicken in town", // Store description'
);

// Update PUT /api/vendors/me
content = content.replace(
  '"name": "KFC East Legon",',
  '"name": "KFC East Legon",\n  "description": "Best fried chicken in town",'
);

// Add description to vendor responses (e.g., example response for POST /api/vendors)
content = content.replace(
  '"name": "KFC Accra",\n      "logo_url":',
  '"name": "KFC Accra",\n      "description": "Best fried chicken in town",\n      "logo_url":'
);

// Add description to GET /api/vendors/me response
content = content.replace(
  '"name": "KFC Accra",\n    "logo_url":',
  '"name": "KFC Accra",\n    "description": "Best fried chicken in town",\n    "logo_url":'
);

// Add description to PUT /api/vendors/me response
content = content.replace(
  '"name": "KFC East Legon",\n    "logo_url":',
  '"name": "KFC East Legon",\n    "description": "Best fried chicken in town",\n    "logo_url":'
);

fs.writeFileSync(path, content, 'utf-8');
console.log('API_DOCS.md updated with description');
