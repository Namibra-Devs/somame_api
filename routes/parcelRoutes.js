const express = require('express');
const router = express.Router();
const { 
  calculateFare, 
  createParcelOrder, 
  getMyParcels, 
  getParcelDetails 
} = require('../controllers/parcelController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/calculate-fare').post(calculateFare);

// Protected routes (Customer or Rider)
router.route('/').post(protect, createParcelOrder);
router.route('/me').get(protect, getMyParcels);
router.route('/:id').get(protect, getParcelDetails);

module.exports = router;
