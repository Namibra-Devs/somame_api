const fs = require('fs');
const path = 'c:/xampp/htdocs/somame_api/controllers/vendorController.js';

let content = fs.readFileSync(path, 'utf-8');

// Find the real end of getVendorCustomerDetails
const marker = `    res.status(200).json({
      status: 'success',
      message: 'Customer details retrieved successfully',
      data: {
        stats: data.stats,
        recentOrders: data.recentOrders,
        pagination: {
          total: data.totalOrdersCount,
          page,
          limit,
          totalPages: Math.ceil(data.totalOrdersCount / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};`;

if (content.includes(marker)) {
    const splitIndex = content.indexOf(marker) + marker.length;
    let validCode = content.substring(0, splitIndex);

    validCode += `

// @desc    Get analytics for a vendor
// @route   GET /api/vendors/me/analytics
const getVendorAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Only vendors can access this' });
    }

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const { start_date, end_date } = req.query;

    const data = await Vendor.getAnalytics(vendor.id, start_date, end_date);

    res.status(200).json({
      status: 'success',
      message: 'Analytics retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyVendors,
  searchVendors,
  createVendor,
  getVendorById,
  getMyVendorProfile,
  updateMyVendorProfile,
  getVendorDashboard,
  getVendorCustomers,
  getVendorCustomerDetails,
  getVendorAnalytics
};
`;
    fs.writeFileSync(path, validCode, 'utf-8');
    console.log("Fixed vendorController.js");
} else {
    console.log("Marker not found in file.");
}
