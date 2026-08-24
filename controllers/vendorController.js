const Vendor = require('../models/Vendor');
const User = require('../models/User');

// @desc    Get nearby vendors
// @route   GET /api/vendors/nearby
const getNearbyVendors = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters

    if (!lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Please provide lat and lng query parameters' });
    }

    const vendors = await Vendor.getNearby(lat, lng, radius);

    res.status(200).json({
      status: 'success',
      message: 'Nearby vendors retrieved successfully',
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search and filter vendors
// @route   GET /api/vendors/search
const searchVendors = async (req, res, next) => {
  try {
    const { q, is_open, category_id, lat, lng, radius, sort } = req.query;

    const vendors = await Vendor.search({ q, is_open, category_id, lat, lng, radius, sort });

    res.status(200).json({
      status: 'success',
      message: 'Vendors retrieved successfully',
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a vendor
// @route   POST /api/vendors
const createVendor = async (req, res, next) => {
  try {
    const { name, description, logo_url, rating, tags, lat, lng } = req.body;
    const user_id = req.user.id; // Extract from JWT middleware
    const user_role = req.user.role;

    if (user_role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Only users with the vendor role can create a vendor profile' });
    }

    if (!name || !lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Please provide name, lat, and lng' });
    }

    const vendor = await Vendor.create({ user_id, name, description, logo_url, rating, tags, lat, lng });

    res.status(201).json({
      status: 'success',
      message: 'Vendor profile created successfully',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
const getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Vendor details retrieved successfully',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in vendor profile
// @route   GET /api/vendors/me
const getMyVendorProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    const vendor = await Vendor.findByUserId(req.user.id);

    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found. Please create one.' });
    }

    res.status(200).json({ status: 'success', message: 'Vendor profile retrieved successfully', data: vendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged in vendor profile
// @route   PUT /api/vendors/me
const updateMyVendorProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    const { name, description, category_id, logo_url, tags, lat, lng, is_open, address, email, phone_number } = req.body;

    const vendor = await Vendor.updateByUserId(req.user.id, { name, description, category_id, logo_url, tags, lat, lng, is_open, address });

    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found. Please create one first.' });
    }

    if (email || phone_number) {
      await User.updateProfile(req.user.id, { email, phone_number });
    }

    // Re-fetch to get merged user contact details
    const updatedVendor = await Vendor.findByUserId(req.user.id);

    res.status(200).json({ status: 'success', message: 'Vendor profile updated successfully', data: updatedVendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics for a vendor
// @route   GET /api/vendors/me/dashboard
// @access  Private/Vendor
const getVendorDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Only vendors can access this' });
    }

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const stats = await Vendor.getDashboardStats(vendor.id);

    res.status(200).json({
      status: 'success',
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of customers for vendor
// @route   GET /api/vendors/me/customers
const getVendorCustomers = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Only vendors can access this' });
    }

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const { search, date_filter } = req.query;
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const data = await Vendor.getCustomers(vendor.id, search, date_filter, limit, offset);

    res.status(200).json({
      status: 'success',
      message: 'Customers retrieved successfully',
      data: data.customers,
      pagination: {
        total: data.totalCount,
        page,
        limit,
        totalPages: Math.ceil(data.totalCount / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a specific customer for vendor
// @route   GET /api/vendors/me/customers/:id
const getVendorCustomerDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Only vendors can access this' });
    }

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const customerId = req.params.id;
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const data = await Vendor.getCustomerDetails(vendor.id, customerId, limit, offset);

    if (!data || !data.stats.id) {
      return res.status(404).json({ status: 'error', message: 'Customer not found or has no orders with you' });
    }

    res.status(200).json({
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
};

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
