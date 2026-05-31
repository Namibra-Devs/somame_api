const express = require('express');
const router = express.Router();
const { getNearbyVendors, createVendor, getVendorById, getMyVendorProfile, updateMyVendorProfile } = require('../controllers/vendorController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/nearby').get(getNearbyVendors);
router.route('/').post(protect, createVendor); // Protected route
router.route('/me').get(protect, getMyVendorProfile).put(protect, updateMyVendorProfile);
router.route('/:id').get(getVendorById);

module.exports = router;
