const Order = require('../models/Order');
const Delivery = require('../models/Delivery');

// @desc    Create a new order transaction
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { vendor_id, rider_id, items, total_amount, payment_method, delivery_location } = req.body;
    
    // Fetch customer_id from the authenticated user token
    const customer_id = req.user.id;

    if (!customer_id || !vendor_id || !items || items.length === 0 || !total_amount || !payment_method) {
      return res.status(400).json({ status: 'error', message: 'Missing required order fields' });
    }

    // Let the Order model handle the database transaction
    const result = await Order.createWithItems({
      customer_id, vendor_id, rider_id, items, total_amount, payment_method, delivery_location
    });

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
const getOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const items = await Order.getItemsByOrderId(orderId);
    const delivery = await Delivery.findByOrderId(orderId);

    res.status(200).json({
      status: 'success',
      data: {
        ...order,
        items,
        delivery: delivery || null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderDetails
};
