const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updatePassword, updateUserStatus } = require('../controllers/userController');
const { getAddresses, addAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { getPaymentMethods, addPaymentMethod, setDefaultPaymentMethod, deletePaymentMethod } = require('../controllers/paymentMethodController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.route('/password')
  .put(protect, updatePassword);

// Saved Addresses routes
router.route('/me/addresses')
  .get(protect, getAddresses)
  .post(protect, addAddress);

router.route('/me/addresses/:id')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

// Payment Methods routes
router.route('/me/payment-methods')
  .get(protect, getPaymentMethods)
  .post(protect, addPaymentMethod);

router.route('/me/payment-methods/:id')
  .delete(protect, deletePaymentMethod);

router.route('/me/payment-methods/:id/default')
  .put(protect, setDefaultPaymentMethod);

// Admin only route
router.route('/:id/status')
  .patch(protect, updateUserStatus);

module.exports = router;
