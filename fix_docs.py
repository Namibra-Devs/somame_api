import re

path = 'c:/xampp/htdocs/somame_api/API_DOCS.md'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''      "description": "Appetizers and quick bites",
      "created_at": "2026-06-04T03:30:00.000Z",'''

new_str = '''      "description": "Appetizers and quick bites",
      "item_count": "40",
      "created_at": "2026-06-04T03:30:00.000Z",'''

if old_str in content:
    content = content.replace(old_str, new_str)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated successfully")
else:
    print("Could not find old string!")
