const Vendor = require('../models/Vendor');

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
    const { name, logo_url, rating, lat, lng } = req.body;
    const user_id = req.user.id; // Extract from JWT middleware
    const user_role = req.user.role;

    if (user_role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Only users with the vendor role can create a vendor profile' });
    }

    if (!name || !lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Please provide name, lat, and lng' });
    }

    const vendor = await Vendor.create({ user_id, name, logo_url, rating, lat, lng });

    res.status(201).json({
      status: 'success',
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

    res.status(200).json({ status: 'success', data: vendor });
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

    const { name, category_id, logo_url, lat, lng, is_open } = req.body;

    const vendor = await Vendor.updateByUserId(req.user.id, { name, category_id, logo_url, lat, lng, is_open });

    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found. Please create one first.' });
    }

    res.status(200).json({ status: 'success', data: vendor });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyVendors,
  createVendor,
  getVendorById,
  getMyVendorProfile,
  updateMyVendorProfile
};
