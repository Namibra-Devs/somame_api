const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/API_DOCS.md';

let content = fs.readFileSync(path, 'utf-8');

const insertionPoint = "### Get Vendor Customers";
const newEndpoint = `### Get Vendor Analytics
- **Endpoint**: \`GET /api/vendors/me/analytics\`
- **Headers**: \`Authorization: Bearer <your_jwt_token>\` (Must have \`vendor\` role)
- **Description**: Returns analytics data over a specified date range. If no dates are provided, it defaults to the current year.
- **Query Parameters**:
  - \`start_date\`: (Optional) Start date (e.g., \`2026-01-01\`).
  - \`end_date\`: (Optional) End date (e.g., \`2026-12-31\`).
- **Example Response**:
\`\`\`json
{
  "status": "success",
  "message": "Analytics retrieved successfully",
  "data": {
    "overview": {
      "orders": 23,
      "revenue": 2300000.00,
      "avg_order_value": "100000.00",
      "new_customers": 23
    },
    "revenueOverTime": [
      { "label": "Jan", "orders": 10, "revenue": 1000000.00 },
      { "label": "Feb", "orders": 13, "revenue": 1300000.00 }
    ],
    "topItems": [
      {
        "rank": 1,
        "item": "Spring Rolls",
        "units_sold": 45,
        "revenue": 697.50,
        "avg_rating": "0.0"
      }
    ]
  }
}
\`\`\`

`;

if (content.includes(insertionPoint)) {
    content = content.replace(insertionPoint, newEndpoint + insertionPoint);
    fs.writeFileSync(path, content, 'utf-8');
    console.log("Updated successfully");
} else {
    console.log("Could not find insertion point!");
}
