const express = require('express');
const router = express.Router();
const { getNearbyVendors, searchVendors, createVendor, getVendorById, getMyVendorProfile, updateMyVendorProfile } = require('../controllers/vendorController');
const { protect } = require('../middlewares/authMiddleware');

const { 
  createMenuCategory, getMyMenuCategories, updateMenuCategory, deleteMenuCategory,
  createMenuItem, getMyMenuItems, updateMenuItem, deleteMenuItem, getVendorMenu 
} = require('../controllers/menuController');

router.route('/search').get(searchVendors);
router.route('/nearby').get(getNearbyVendors);
router.route('/').post(protect, createVendor); // Protected route

// Vendor Profile
router.route('/me').get(protect, getMyVendorProfile).put(protect, updateMyVendorProfile);

// Menu Management (Vendor specific)
router.route('/me/menu-categories')
  .post(protect, createMenuCategory)
  .get(protect, getMyMenuCategories);
router.route('/me/menu-categories/:id')
  .put(protect, updateMenuCategory)
  .delete(protect, deleteMenuCategory);

router.route('/me/menu-items')
  .post(protect, createMenuItem)
  .get(protect, getMyMenuItems);
router.route('/me/menu-items/:id')
  .put(protect, updateMenuItem)
  .delete(protect, deleteMenuItem);

// Public vendor routes
router.route('/:id').get(getVendorById);
router.route('/:id/menu').get(getVendorMenu);

module.exports = router;
