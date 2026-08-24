const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

// Update PUT /api/vendors/me
content = content.replace(
  '"lat": 5.6150,',
  '"lat": 5.6150,\n  "email": "vendor@somame.com",\n  "phone_number": "+2335555555",'
);

// Add email and phone_number to vendor responses
content = content.replace(
  /"rating": 4\.5,\n      "tags": "fast food, chicken, local",/g,
  '"rating": 4.5,\n      "tags": "fast food, chicken, local",\n      "email": "vendor@somame.com",\n      "phone_number": "+2335555555",'
);

content = content.replace(
  /"rating": 4\.5,\n    "tags": "fast food, chicken, local",/g,
  '"rating": 4.5,\n    "tags": "fast food, chicken, local",\n    "email": "vendor@somame.com",\n    "phone_number": "+2335555555",'
);

content = content.replace(
  /"rating": 4\.6,\n    "tags": "drinks, continental",/g,
  '"rating": 4.6,\n    "tags": "drinks, continental",\n    "email": "vendor@somame.com",\n    "phone_number": "+2335555555",'
);

content = content.replace(
  /"rating": 4\.6,\n      "tags": "drinks, continental",/g,
  '"rating": 4.6,\n      "tags": "drinks, continental",\n      "email": "vendor@somame.com",\n      "phone_number": "+2335555555",'
);

fs.writeFileSync(path, content, 'utf-8');
console.log('API_DOCS.md updated with email and phone_number');
