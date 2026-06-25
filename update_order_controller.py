import re

with open('c:/xampp/htdocs/somame_api/controllers/orderController.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_methods = """
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

    const updatedOrder = await Order.updateStatus(orderId, 'arrived_at_vendor');

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

    res.status(200).json({
      status: 'success',
      message: 'Delivery confirmed successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};
"""

content = content.replace("module.exports = {", new_methods + "\nmodule.exports = {")
content = content.replace("  declineJob", "  declineJob,\n  arriveMerchant,\n  confirmPickup,\n  arriveCustomer,\n  confirmDelivery")

with open('c:/xampp/htdocs/somame_api/controllers/orderController.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated orderController.js successfully")
