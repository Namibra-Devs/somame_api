const express = require('express');
const router = express.Router();
const { submitOrderRatings } = require('../controllers/ratingController');
const { 
  createOrder, 
  getOrderDetails, 
  getCustomerOrders, 
  updateOrderStatus, 
  acceptJob, 
  declineJob,
  arriveMerchant,
  confirmPickup,
  arriveCustomer,
  confirmDelivery
} = require('../controllers/orderController');
const { validatePromo } = require('../controllers/promotionController');
const { protect } = require('../middlewares/authMiddleware');

// Order routes protected by JWT middleware
router.route('/validate-promo').post(protect, validatePromo);
router.route('/').post(protect, createOrder);
router.route('/me').get(protect, getCustomerOrders);
router.route('/:id').get(protect, getOrderDetails);
router.route('/:id/status').patch(protect, updateOrderStatus);
router.route('/:id/accept-job').post(protect, acceptJob);
router.route('/:id/decline-job').post(protect, declineJob);
router.route('/:id/arrive-merchant').post(protect, arriveMerchant);
router.route('/:id/confirm-pickup').post(protect, confirmPickup);
router.route('/:id/arrive-customer').post(protect, arriveCustomer);
router.route('/:id/confirm-delivery').post(protect, confirmDelivery);
router.route('/:id/ratings').post(protect, submitOrderRatings);

module.exports = router;
