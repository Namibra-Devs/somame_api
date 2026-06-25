import re

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'r', encoding='utf-8') as f:
    content = f.read()

old_accept_food = """      "vendor_name": "PIZZA HUB ADENTA",
      "vendor_phone": "+233541234567",
      "vendor_lat": 5.6050,
      "vendor_lng": -0.1880"""

new_accept_food = """      "vendor_name": "PIZZA HUB ADENTA",
      "vendor_phone": "+233541234567",
      "vendor_address": "Rowi Junction",
      "vendor_lat": 5.6050,
      "vendor_lng": -0.1880,
      "distance_to_vendor_km": 1.5,
      "estimated_time_to_vendor_mins": 5"""

content = content.replace(old_accept_food, new_accept_food)

with open('c:/xampp/htdocs/somame_api/API_DOCS.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated API_DOCS.md successfully")
