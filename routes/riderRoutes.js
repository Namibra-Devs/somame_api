const express = require('express');
const router = express.Router();
const { submitRiderRegistration, getMyRiderProfile } = require('../controllers/riderController');
const { 
  getPaymentMethods, 
  addPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod 
} = require('../controllers/riderPaymentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/register')
  .post(protect, submitRiderRegistration);

router.route('/me')
  .get(protect, getMyRiderProfile);


// Payment Methods Routes
router.route('/me/payment-methods')
  .get(protect, getPaymentMethods)
  .post(protect, addPaymentMethod);

router.route('/me/payment-methods/:id')
  .put(protect, updatePaymentMethod)
  .delete(protect, deletePaymentMethod);

module.exports = router;
