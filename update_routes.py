import re

with open('c:/xampp/htdocs/somame_api/routes/parcelRoutes.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const { \n  calculateFare, \n  createParcelOrder, \n  getMyParcels, \n  getParcelDetails,\n  acceptJob,\n  declineJob\n}",
    "const { \n  calculateFare, \n  createParcelOrder, \n  getMyParcels, \n  getParcelDetails,\n  acceptJob,\n  declineJob,\n  getRiderParcelDeliveries\n}"
)

content = content.replace(
    "router.route('/me').get(protect, getMyParcels);",
    "router.route('/me').get(protect, getMyParcels);\nrouter.route('/rider-history').get(protect, getRiderParcelDeliveries);"
)

with open('c:/xampp/htdocs/somame_api/routes/parcelRoutes.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('c:/xampp/htdocs/somame_api/routes/orderRoutes.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "  confirmDelivery\n}",
    "  confirmDelivery,\n  getRiderFoodDeliveries\n}"
)

content = content.replace(
    "router.route('/me').get(protect, getCustomerOrders);",
    "router.route('/me').get(protect, getCustomerOrders);\nrouter.route('/rider-history').get(protect, getRiderFoodDeliveries);"
)

with open('c:/xampp/htdocs/somame_api/routes/orderRoutes.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated routes successfully")
