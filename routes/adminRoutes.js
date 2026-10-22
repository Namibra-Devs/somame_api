const express = require('express');
const router = express.Router();
const {
  getConfigs,
  updateConfigs,
  getDashboardStats,
  getAdminVendors,
  updateAdminVendor,
  getAdminRiders,
  verifyAdminRider,
  getAdminCustomers,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminParcels,
  updateAdminParcelStatus,
  getAdminPayouts,
  updateAdminPayoutStatus,
  getAdminSupportCases,
  getAdminSupportCaseDetails,
  replyAdminSupportCase,
  updateAdminSupportCaseStatus,
  getAdminSupportArticles,
  createAdminSupportArticle,
  updateAdminSupportArticle,
  deleteAdminSupportArticle
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

// System Configurations
router
  .route('/configs')
  .get(getConfigs)
  .put(protect, admin, updateConfigs);

// Admin Dashboard Overview
router.get('/dashboard', protect, admin, getDashboardStats);

// Vendors Management
router.get('/vendors', protect, admin, getAdminVendors);
router.put('/vendors/:id', protect, admin, updateAdminVendor);

// Riders & KYC Verification
router.get('/riders', protect, admin, getAdminRiders);
router.patch('/riders/:id/verify', protect, admin, verifyAdminRider);

// Customers Directory
router.get('/customers', protect, admin, getAdminCustomers);

// Orders & Parcel Dispatch
router.get('/orders', protect, admin, getAdminOrders);
router.patch('/orders/:id/status', protect, admin, updateAdminOrderStatus);
router.get('/parcels', protect, admin, getAdminParcels);
router.patch('/parcels/:id/status', protect, admin, updateAdminParcelStatus);

// Payouts & Finance
router.get('/payouts', protect, admin, getAdminPayouts);
router.patch('/payouts/:type/:id', protect, admin, updateAdminPayoutStatus);

// Support Helpdesk & FAQ Articles
router.get('/support/cases', protect, admin, getAdminSupportCases);
router.get('/support/cases/:id', protect, admin, getAdminSupportCaseDetails);
router.post('/support/cases/:id/messages', protect, admin, replyAdminSupportCase);
router.patch('/support/cases/:id/status', protect, admin, updateAdminSupportCaseStatus);

router
  .route('/support/articles')
  .get(protect, admin, getAdminSupportArticles)
  .post(protect, admin, createAdminSupportArticle);

router
  .route('/support/articles/:id')
  .put(protect, admin, updateAdminSupportArticle)
  .delete(protect, admin, deleteAdminSupportArticle);

module.exports = router;
