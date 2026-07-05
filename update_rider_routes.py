import re

with open('c:/xampp/htdocs/somame_api/routes/riderRoutes.js', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """const { submitRiderRegistration, getMyRiderProfile } = require('../controllers/riderController');
const { 
  getPaymentMethods, 
  addPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod 
} = require('../controllers/riderPaymentController');"""

content = content.replace(
    "const { submitRiderRegistration, getMyRiderProfile } = require('../controllers/riderController');",
    imports
)

payment_routes = """
// Payment Methods Routes
router.route('/me/payment-methods')
  .get(protect, getPaymentMethods)
  .post(protect, addPaymentMethod);

router.route('/me/payment-methods/:id')
  .put(protect, updatePaymentMethod)
  .delete(protect, deletePaymentMethod);
"""

content = content.replace(
    "module.exports = router;",
    payment_routes + "\nmodule.exports = router;"
)

with open('c:/xampp/htdocs/somame_api/routes/riderRoutes.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated riderRoutes.js successfully")
