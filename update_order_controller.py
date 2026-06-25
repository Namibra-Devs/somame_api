import re

with open('c:/xampp/htdocs/somame_api/controllers/orderController.js', 'r', encoding='utf-8') as f:
    content = f.read()

get_rider_deliveries_code = """
// @desc    Get rider's food deliveries history
// @route   GET /api/orders/rider-history
// @access  Private/Rider
const getRiderFoodDeliveries = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }
    
    const deliveries = await Order.findRiderDeliveries(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Rider food deliveries retrieved successfully',
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};
"""

content = content.replace("module.exports = {", get_rider_deliveries_code + "\nmodule.exports = {")
content = content.replace("  confirmDelivery", "  confirmDelivery,\n  getRiderFoodDeliveries")

with open('c:/xampp/htdocs/somame_api/controllers/orderController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated orderController.js successfully")
