const express = require('express');
const router = express.Router();
const { getNearbyVendors, searchVendors, createVendor, getVendorById, getMyVendorProfile, updateMyVendorProfile, getVendorNotifications, updateVendorNotifications, getVendorDashboard, getVendorCustomers, getVendorCustomerDetails, getVendorAnalytics, getVendorOperatingHours, updateVendorOperatingHours } = require('../controllers/vendorController');
const { protect } = require('../middlewares/authMiddleware');

const { 
  createMenuCategory, getMyMenuCategories, updateMenuCategory, deleteMenuCategory,
  createMenuItem, getMyMenuItems, getMenuItemDetails, updateMenuItem, deleteMenuItem, getVendorMenu 
} = require('../controllers/menuController');

const {
  createPromotion, getMyPromotions, updatePromotion, deletePromotion
} = require('../controllers/promotionController');

router.route('/search').get(searchVendors);
router.route('/nearby').get(getNearbyVendors);
router.route('/').post(protect, createVendor); // Protected route

// Vendor Profile and Dashboard
router.route('/me').get(protect, getMyVendorProfile).put(protect, updateMyVendorProfile);
router.route('/me/dashboard').get(protect, getVendorDashboard);
router.route('/me/analytics').get(protect, getVendorAnalytics);
router.route('/me/customers').get(protect, getVendorCustomers);
router.route('/me/customers/:id').get(protect, getVendorCustomerDetails);
router.route('/me/notifications').get(protect, getVendorNotifications).put(protect, updateVendorNotifications);
router.route('/me/operating-hours').get(protect, getVendorOperatingHours).put(protect, updateVendorOperatingHours);

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
  .get(protect, getMenuItemDetails)
  .put(protect, updateMenuItem)
  .delete(protect, deleteMenuItem);

// Promotions Management (Vendor specific)
router.route('/me/promotions')
  .post(protect, createPromotion)
  .get(protect, getMyPromotions);
router.route('/me/promotions/:id')
  .put(protect, updatePromotion)
  .delete(protect, deletePromotion);

// Public vendor routes
router.route('/:id').get(getVendorById);
router.route('/:id/menu').get(getVendorMenu);

const { getVendorOrders, getOrderDetails } = require('../controllers/orderController');
router.route('/me/orders').get(protect, getVendorOrders);
router.route('/me/orders/:id').get(protect, getOrderDetails);

module.exports = router;
