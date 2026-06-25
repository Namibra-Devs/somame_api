import re

with open('c:/xampp/htdocs/somame_api/controllers/parcelController.js', 'r', encoding='utf-8') as f:
    content = f.read()

get_rider_deliveries_code = """
// @desc    Get rider's parcel deliveries history
// @route   GET /api/parcels/rider-history
// @access  Private/Rider
const getRiderParcelDeliveries = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }
    
    const deliveries = await ParcelOrder.findRiderDeliveries(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Rider parcel deliveries retrieved successfully',
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};
"""

content = content.replace("module.exports = {", get_rider_deliveries_code + "\nmodule.exports = {")
content = content.replace("  getParcelDetails,", "  getParcelDetails,\n  getRiderParcelDeliveries,")

with open('c:/xampp/htdocs/somame_api/controllers/parcelController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated parcelController.js successfully")
