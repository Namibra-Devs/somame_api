const express = require('express');
const router = express.Router();
const { createOrder, getOrderDetails } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

// Order routes protected by JWT middleware
router.route('/').post(protect, createOrder);
router.route('/:id').get(protect, getOrderDetails);

module.exports = router;
