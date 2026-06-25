const express = require('express');
const router = express.Router();
const { 
  calculateFare, 
  createParcelOrder, 
  getMyParcels, 
  getParcelDetails,
  acceptJob,
  declineJob,
  getRiderParcelDeliveries
} = require('../controllers/parcelController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/calculate-fare').post(calculateFare);

// Protected routes (Customer or Rider)
router.route('/').post(protect, createParcelOrder);
router.route('/me').get(protect, getMyParcels);
router.route('/rider-history').get(protect, getRiderParcelDeliveries);
router.route('/:id').get(protect, getParcelDetails);
router.route('/:id/accept-job').post(protect, acceptJob);
router.route('/:id/decline-job').post(protect, declineJob);

module.exports = router;
