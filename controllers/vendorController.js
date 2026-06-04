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

    if (!name || !lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Please provide name, lat, and lng' });
    }

    const vendor = await Vendor.create({ name, logo_url, rating, lat, lng });

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

module.exports = {
  getNearbyVendors,
  createVendor,
  getVendorById
};
