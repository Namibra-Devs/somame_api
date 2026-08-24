const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const docsToAdd = `### Get Vendor Notifications
- **Endpoint**: \`GET /api/vendors/me/notifications\`
- **Headers**: \`Authorization: Bearer <your_vendor_jwt_token>\`
- **Description**: Returns the notification preferences for the logged-in vendor.
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Notification preferences retrieved successfully",
  "data": {
    "in_app_notifications": true,
    "email_notifications": true,
    "sms_notifications": true
  }
}
\`\`\`

### Update Vendor Notifications
- **Endpoint**: \`PUT /api/vendors/me/notifications\`
- **Headers**: \`Authorization: Bearer <your_vendor_jwt_token>\`
- **Description**: Updates the notification preferences for the logged-in vendor.
- **Body payload (JSON)**:
\`\`\`json
{
  "in_app_notifications": true,
  "email_notifications": false,
  "sms_notifications": true
}
\`\`\`
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Notification preferences updated successfully",
  "data": {
    "in_app_notifications": true,
    "email_notifications": false,
    "sms_notifications": true
  }
}
\`\`\`

`;

// First remove any existing duplicates we might have added
content = content.replace(/### Get Vendor Notifications[\s\S]*?### Get Vendor Dashboard Statistics/g, '### Get Vendor Dashboard Statistics');

// Then add it freshly
content = content.replace('### Get Vendor Dashboard Statistics', docsToAdd + '### Get Vendor Dashboard Statistics');

// Also, the user mentioned some content are gone. Let's make sure email/phone_number and description are present.
if (!content.includes('"email": "vendor@somame.com"')) {
    // apply fix_docs10 and fix_docs9 logic here
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

    content = content.replace(
      '"lat": 5.6150,',
      '"lat": 5.6150,\n  "email": "vendor@somame.com",\n  "phone_number": "+2335555555",'
    );

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
}

fs.writeFileSync(path, content, 'utf-8');
console.log('API_DOCS.md updated perfectly');
