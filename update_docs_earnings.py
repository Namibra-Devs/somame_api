import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

earnings_docs = """
## Rider Earnings & Payouts

### Get Earnings Dashboard
- **Endpoint**: `GET /api/riders/me/earnings`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Returns today's earnings, percentage change vs yesterday, a weekly chart breakdown, and categorised earnings components.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Earnings dashboard retrieved successfully",
  "data": {
    "available_balance": "245.00",
    "today_earnings": "1200.50",
    "percentage_change_vs_yesterday": "18.00",
    "breakdown": {
      "chart_data": {
        "Mon": 180,
        "Tue": 300,
        "Wed": 240,
        "Thu": 70,
        "Fri": 210,
        "Sat": 210,
        "Sun": 180
      },
      "base_pay": 200,
      "distance_bonuses": 40,
      "tips": 2,
      "streak_bonuses": 20,
      "total": 262
    }
  }
}
```

### Request Payout
- **Endpoint**: `POST /api/riders/me/payouts`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Submits a request to withdraw funds from the available balance.
- **Body payload (JSON)**:
```json
{
  "amount": 200, // required
  "payment_method_id": 1 // required (must belong to rider)
}
```
- **Example Response**:
```json
{
  "status": "success",
  "message": "Payout requested successfully",
  "data": {
    "payout": {
      "id": 1,
      "rider_id": 2,
      "amount": "200.00",
      "status": "pending",
      "payout_method_name": "Mobile Money",
      "payout_account_info": "****234",
      "created_at": "..."
    },
    "remaining_balance": "45.00"
  }
}
```

### Get Payout History
- **Endpoint**: `GET /api/riders/me/payouts`
- **Headers**: `Authorization: Bearer <your_jwt_token>` (Must have `rider` role)
- **Description**: Returns a history of payout requests.
- **Example Response**:
```json
{
  "status": "success",
  "message": "Payout history retrieved successfully",
  "data": [
    {
      "id": 1,
      "rider_id": 2,
      "amount": "200.00",
      "status": "success",
      "payout_method_name": "Mobile Money",
      "payout_account_info": "****234",
      "created_at": "2026-06-16T09:08:00.000Z"
    }
  ]
}
```
"""

content += earnings_docs

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated API_DOCS.md successfully")
