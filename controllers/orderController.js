const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const MenuItem = require('../models/MenuItem');

// @desc    Create a new order transaction
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { vendor_id, rider_id, items, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, delivery_location } = req.body;
    
    // Fetch customer_id from the authenticated user token
    const customer_id = req.user.id;

    if (!customer_id || !vendor_id || !items || items.length === 0 || !total_amount || !payment_method) {
      return res.status(400).json({ status: 'error', message: 'Missing required order fields' });
    }

    // Validate Vendor
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    }

    // Validate Rider
    if (rider_id) {
      const rider = await User.findById(rider_id);
      if (!rider || rider.role !== 'rider') {
        return res.status(400).json({ status: 'error', message: 'Invalid rider_id provided' });
      }
    }

    // Validate Menu Items and Calculate Subtotal securely
    let calculated_subtotal = 0;
    for (let i = 0; i < items.length; i++) {
      const payloadItem = items[i];
      if (!payloadItem.item_id) {
        return res.status(400).json({ status: 'error', message: 'All items must include an item_id' });
      }
      
      const dbItem = await MenuItem.findById(payloadItem.item_id);
      if (!dbItem || dbItem.vendor_id !== vendor_id) {
        return res.status(400).json({ status: 'error', message: `Invalid item_id: ${payloadItem.item_id}` });
      }
      if (!dbItem.is_in_stock) {
        return res.status(400).json({ status: 'error', message: `Item is out of stock: ${dbItem.name}` });
      }

      // Overwrite frontend price/name with secure backend data
      payloadItem.price = dbItem.price;
      payloadItem.item_name = dbItem.name;
      
      calculated_subtotal += parseFloat(dbItem.price) * parseInt(payloadItem.quantity);
    }

    // Validate Promotion
    if (promotion_id) {
      const promotion = await Promotion.findById(promotion_id);
      if (!promotion) {
        return res.status(404).json({ status: 'error', message: 'Promotion not found' });
      }
      if (promotion.vendor_id !== vendor_id) {
        return res.status(400).json({ status: 'error', message: 'Promotion does not belong to this vendor' });
      }
      if (!promotion.is_active) {
        return res.status(400).json({ status: 'error', message: 'Promotion is no longer active' });
      }
      if (new Date() > new Date(promotion.expires_at)) {
        return res.status(400).json({ status: 'error', message: 'Promotion has expired' });
      }
    }

    // Generate a unique order tracking number
    const order_number = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // Let the Order model handle the database transaction
    const result = await Order.createWithItems({
      order_number, customer_id, vendor_id, rider_id, items, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, delivery_location
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

// @desc    Get all orders for the logged-in customer
// @route   GET /api/orders/me
const getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const orders = await Order.findByCustomerId(customerId);
    
    res.status(200).json({
      status: 'success',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  getCustomerOrders
};
