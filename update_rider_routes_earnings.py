import re

with open('c:/xampp/htdocs/somame_api/routes/riderRoutes.js', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """const { 
  getEarningsDashboard, 
  getPayoutHistory, 
  requestPayout 
} = require('../controllers/riderEarningsController');"""

content = content.replace(
    "const { \n  getPaymentMethods,",
    imports + "\nconst { \n  getPaymentMethods,"
)

earning_routes = """
// Earnings & Payout Routes
router.route('/me/earnings')
  .get(protect, getEarningsDashboard);

router.route('/me/payouts')
  .get(protect, getPayoutHistory)
  .post(protect, requestPayout);
"""

content = content.replace(
    "module.exports = router;",
    earning_routes + "\nmodule.exports = router;"
)

with open('c:/xampp/htdocs/somame_api/routes/riderRoutes.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated riderRoutes.js successfully")
