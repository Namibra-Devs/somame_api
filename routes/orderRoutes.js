const express = require('express');
const router = express.Router();
const { getNearbyVendors, createOrder, getOrderDetails } = require('../controllers/orderController');

// Vendor routes (Mapped here as part of the order API phase)
router.get('/vendors/nearby', getNearbyVendors);

// Order routes
router.post('/orders', createOrder);
router.get('/orders/:id', getOrderDetails);

module.exports = router;
