const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const MenuItem = require('../models/MenuItem');
const RiderWallet = require('../models/RiderWallet');
const RiderEarning = require('../models/RiderEarning');
const SystemConfig = require('../models/SystemConfig');

// @desc    Create a new order transaction
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { vendor_id, rider_id, items, total_amount, promotion_id, discount_amount, rider_tip, estimated_delivery_time, customer_note, payment_method, delivery_location, delivery_address } = req.body;
    
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

    // Fetch order service fee
    const configs = await SystemConfig.getAll();
    const service_fee = configs.order_service_fee || 2.00;

    // Add service fee to total amount
    const final_total_amount = parseFloat(total_amount) + service_fee;

    // Generate a unique order tracking number
    const order_number = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // Let the Order model handle the database transaction
    const result = await Order.createWithItems({
      order_number,
      customer_id,
      vendor_id,
      rider_id,
      status: 'pending',
      total_amount: final_total_amount,
      promotion_id,
      discount_amount,
      rider_tip,
      service_fee,
      estimated_delivery_time,
      customer_note,
      payment_method,
      items,
      delivery_location,
      delivery_address
    });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
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
      message: 'Order details retrieved successfully',
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
      message: 'Customer orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for the logged-in vendor
// @route   GET /api/vendors/me/orders
const getVendorOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const vendor = await Vendor.findByUserId(userId);
    
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found for this user' });
    }

    const orders = await Order.findByVendorId(vendor.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Vendor orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ status: 'error', message: 'Status is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const role = req.user.role;
    const userId = req.user.id;

    // Authorization checks
    if (role === 'vendor') {
      const vendor = await Vendor.findByUserId(userId);
      if (!vendor || order.vendor_id !== vendor.id) {
        return res.status(403).json({ status: 'error', message: 'Not authorized to update this order' });
      }
      if (!['accepted', 'preparing'].includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Vendors can only update status to "accepted" or "preparing"' });
      }
    } else if (role === 'rider') {
      if (order.rider_id !== userId) {
        return res.status(403).json({ status: 'error', message: 'Not authorized to update this order' });
      }
      if (!['out_for_delivery', 'delivered'].includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Riders can only update status to "out_for_delivery" or "delivered"' });
      }
    } else if (role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update order status' });
    }

    const updatedOrder = await Order.updateStatus(orderId, status);
    
    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

const JobDecline = require('../models/JobDecline');

// @desc    Accept an unassigned job (Targeted Dispatch)
// @route   POST /api/orders/:id/accept-job
const acceptJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can accept jobs' });
    }

    const orderId = req.params.id;
    const riderId = req.user.id;
    const { lat, lng } = req.body; // Rider's current location

    if (!lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'lat and lng are required to accept a job' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (order.rider_id) {
      return res.status(400).json({ status: 'error', message: 'Order has already been assigned to a rider' });
    }

    const updatedOrder = await Order.assignRider(orderId, riderId, lat, lng);
    if (!updatedOrder) {
      return res.status(400).json({ status: 'error', message: 'Failed to assign rider. Job might have been taken.' });
    }

    // Initialize delivery tracking
    const delivery = await Delivery.create(orderId, riderId, lat, lng);

    res.status(200).json({
      status: 'success',
      message: 'Job accepted successfully',
      data: { order: updatedOrder, delivery }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline an unassigned job (Targeted Dispatch)
// @route   POST /api/orders/:id/decline-job
const declineJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can decline jobs' });
    }

    const orderId = req.params.id;
    const riderId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    await JobDecline.recordDecline(order.order_number, riderId);

    res.status(200).json({
      status: 'success',
      message: 'Job declined successfully'
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Rider marks arrival at vendor
// @route   POST /api/orders/:id/arrive-merchant
const arriveMerchant = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can update delivery statuses' });
    }

    const orderId = req.params.id;
    const riderId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.rider_id !== riderId) return res.status(403).json({ status: 'error', message: 'You are not assigned to this order' });

    const updatedOrder = await Order.arriveMerchant(orderId);

    res.status(200).json({
      status: 'success',
      message: 'Rider arrived at merchant',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rider confirms pickup (uploads photo, vendor confirms OTP on their end)
// @route   POST /api/orders/:id/confirm-pickup
const confirmPickup = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can update delivery statuses' });
    }

    const orderId = req.params.id;
    const riderId = req.user.id;
    const { proof_image_url } = req.body;

    if (!proof_image_url) {
      return res.status(400).json({ status: 'error', message: 'Proof image is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.rider_id !== riderId) return res.status(403).json({ status: 'error', message: 'You are not assigned to this order' });

    const updatedOrder = await Order.confirmPickup(orderId, proof_image_url);

    res.status(200).json({
      status: 'success',
      message: 'Pickup confirmed. Proceed to customer.',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rider marks arrival at customer
// @route   POST /api/orders/:id/arrive-customer
const arriveCustomer = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can update delivery statuses' });
    }

    const orderId = req.params.id;
    const riderId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.rider_id !== riderId) return res.status(403).json({ status: 'error', message: 'You are not assigned to this order' });

    const updatedOrder = await Order.updateStatus(orderId, 'arrived_at_customer');

    res.status(200).json({
      status: 'success',
      message: 'Rider arrived at customer',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rider confirms delivery with customer OTP
// @route   POST /api/orders/:id/confirm-delivery
const confirmDelivery = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can update delivery statuses' });
    }

    const orderId = req.params.id;
    const riderId = req.user.id;
    const { delivery_otp } = req.body;

    if (!delivery_otp) {
      return res.status(400).json({ status: 'error', message: 'Delivery OTP is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    if (order.rider_id !== riderId) return res.status(403).json({ status: 'error', message: 'You are not assigned to this order' });

    if (order.delivery_otp !== delivery_otp) {
      return res.status(400).json({ status: 'error', message: 'Invalid delivery OTP' });
    }

    const updatedOrder = await Order.updateStatus(orderId, 'delivered');

    // Fetch configs
    const configs = await SystemConfig.getAll();
    const basePay = configs.rider_base_pay || 10.00;
    const distanceBonus = configs.rider_distance_bonus || 2.00;
    
    // Calculate Earnings
    const tip = parseFloat(updatedOrder.rider_tip || 0);
    const totalAmount = basePay + distanceBonus + tip;

    // Record Earning
    await RiderEarning.create({
      rider_id: riderId,
      order_id: orderId,
      parcel_order_id: null,
      earning_type: 'delivery',
      base_pay: basePay,
      distance_bonus: distanceBonus,
      tip: tip,
      amount: totalAmount
    });

    // Update Wallet
    await RiderWallet.addEarning(riderId, totalAmount);

    res.status(200).json({
      status: 'success',
      message: 'Delivery confirmed successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get rider's food deliveries history
// @route   GET /api/orders/rider-history
// @access  Private/Rider
const getRiderFoodDeliveries = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }
    
    const deliveries = await Order.findRiderDeliveries(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Rider food deliveries retrieved successfully',
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  getCustomerOrders,
  getVendorOrders,
  updateOrderStatus,
  acceptJob,
  declineJob,
  arriveMerchant,
  confirmPickup,
  arriveCustomer,
  confirmDelivery,
  getRiderFoodDeliveries
};
