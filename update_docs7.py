import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

old_confirm_pickup = """      "customer_first_name": "John",
      "customer_last_name": "Doe",
      "customer_phone": "+233201234567"
    }
  }"""

new_confirm_pickup = """      "customer_first_name": "John",
      "customer_last_name": "Doe",
      "customer_phone": "+233201234567",
      "vendor_phone": "+233541234567",
      "distance_to_customer_km": 2.3,
      "estimated_time_to_customer_mins": 7
    }
  }"""

content = content.replace(old_confirm_pickup, new_confirm_pickup)

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated API_DOCS.md successfully")
