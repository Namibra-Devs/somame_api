const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const docsToAdd = `
### Get Vendor Notifications
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

content = content.replace(
  '### Get Vendor Dashboard Statistics',
  docsToAdd + '\n### Get Vendor Dashboard Statistics'
);

fs.writeFileSync(path, content, 'utf-8');
console.log('API_DOCS.md updated with notifications endpoints');
