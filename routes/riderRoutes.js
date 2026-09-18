const express = require('express');
const router = express.Router();
const { submitRiderRegistration, getMyRiderProfile } = require('../controllers/riderController');
const { 
  getEarningsDashboard, 
  getPayoutHistory, 
  requestPayout 
} = require('../controllers/riderEarningsController');
const { 
  getPaymentMethods, 
  addPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod 
} = require('../controllers/riderPaymentController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../config/storage');

const riderDocsUpload = upload.fields([
  { name: 'id_front', maxCount: 1 },
  { name: 'id_back', maxCount: 1 },
  { name: 'license_front', maxCount: 1 },
  { name: 'license_back', maxCount: 1 },
  { name: 'road_worthy', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

router.route('/register')
  .post(protect, riderDocsUpload, submitRiderRegistration);

router.route('/me')
  .get(protect, getMyRiderProfile);


// Payment Methods Routes
router.route('/me/payment-methods')
  .get(protect, getPaymentMethods)
  .post(protect, addPaymentMethod);

router.route('/me/payment-methods/:id')
  .put(protect, updatePaymentMethod)
  .delete(protect, deletePaymentMethod);


// Earnings & Payout Routes
router.route('/me/earnings')
  .get(protect, getEarningsDashboard);

router.route('/me/payouts')
  .get(protect, getPayoutHistory)
  .post(protect, requestPayout);

module.exports = router;
