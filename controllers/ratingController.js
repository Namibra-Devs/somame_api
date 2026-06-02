const Order = require('../models/Order');
const Rating = require('../models/Rating');

// @desc    Submit ratings for a vendor and/or rider for a specific order
// @route   POST /api/orders/:id/ratings
const submitOrderRatings = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const customerId = req.user.id;
    const { vendor_rating, vendor_comment, rider_rating, rider_comment } = req.body;

    // Validate that at least one rating is provided
    if (!vendor_rating && !rider_rating) {
      return res.status(400).json({ status: 'error', message: 'At least one rating (vendor or rider) must be provided' });
    }

    // Validate rating limits
    if (vendor_rating && (vendor_rating < 1 || vendor_rating > 5)) {
      return res.status(400).json({ status: 'error', message: 'Vendor rating must be between 1 and 5' });
    }
    if (rider_rating && (rider_rating < 1 || rider_rating > 5)) {
      return res.status(400).json({ status: 'error', message: 'Rider rating must be between 1 and 5' });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Verify ownership
    if (order.customer_id !== customerId) {
      return res.status(403).json({ status: 'error', message: 'You can only rate your own orders' });
    }

    // Verify order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ status: 'error', message: 'You can only rate an order after it has been delivered' });
    }

    // Save ratings to the DB
    await Rating.submitRatings({
      orderId,
      customerId,
      vendorId: order.vendor_id,
      vendorRating: vendor_rating,
      vendorComment: vendor_comment,
      riderId: order.rider_id,
      riderRating: rider_rating,
      riderComment: rider_comment
    });

    res.status(201).json({
      status: 'success',
      message: 'Ratings submitted successfully'
    });
  } catch (error) {
    if (error.constraint === 'unique_order_target_rating') {
       return res.status(400).json({ status: 'error', message: 'You have already rated this order' });
    }
    next(error);
  }
};

module.exports = {
  submitOrderRatings
};
