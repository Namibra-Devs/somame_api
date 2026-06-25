import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

old_arrive_merchant = """      "id": 1,
      "status": "arrived_at_vendor"
    }
  }"""

new_arrive_merchant = """      "id": 1,
      "status": "arrived_at_vendor",
      "vendor_name": "KFC Accra",
      "vendor_address": "Rowi Junction"
    }
  }"""

content = content.replace(old_arrive_merchant, new_arrive_merchant)

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated API_DOCS.md successfully")
