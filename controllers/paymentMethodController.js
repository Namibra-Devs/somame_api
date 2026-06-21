const PaymentMethod = require('../models/PaymentMethod');

// @desc    Get logged in user's payment methods
// @route   GET /api/users/me/payment-methods
// @access  Private (Customer)
const getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.findByCustomerId(req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Payment methods retrieved successfully',
      data: paymentMethods
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new payment method
// @route   POST /api/users/me/payment-methods
// @access  Private (Customer)
const addPaymentMethod = async (req, res, next) => {
  try {
    const { provider, account_name, account_number, expiry_date, is_default } = req.body;

    if (!provider || !account_name || !account_number) {
      return res.status(400).json({ status: 'error', message: 'Provider, account_name, and account_number are required' });
    }

    if (!['momo', 'card', 'namibrapay'].includes(provider)) {
      return res.status(400).json({ status: 'error', message: 'Invalid payment provider' });
    }

    let finalAccountNumber = account_number;

    // For cards, validate expiry_date and mask the card number
    if (provider === 'card') {
      if (!expiry_date) {
        return res.status(400).json({ status: 'error', message: 'expiry_date is required for cards' });
      }
      
      // Basic check for MM/YY
      const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
      if (!expiryRegex.test(expiry_date)) {
        return res.status(400).json({ status: 'error', message: 'expiry_date must be in MM/YY format' });
      }

      // Mask all but last 4 digits for security
      const cleanNumber = account_number.replace(/\s+/g, '').replace(/-/g, '');
      if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        return res.status(400).json({ status: 'error', message: 'Invalid card number' });
      }
      const last4 = cleanNumber.slice(-4);
      finalAccountNumber = '*'.repeat(12) + last4;
    } else {
      // For momo and namibrapay, account_number is the phone number. 
      // We can store it as is, maybe strip spaces.
      finalAccountNumber = account_number.replace(/\s+/g, '');
    }

    const newPaymentMethod = await PaymentMethod.create({
      customer_id: req.user.id,
      provider,
      account_name,
      account_number: finalAccountNumber,
      expiry_date: provider === 'card' ? expiry_date : null,
      is_default
    });

    res.status(201).json({
      status: 'success',
      message: 'Payment method added successfully',
      data: newPaymentMethod
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set a payment method as default
// @route   PUT /api/users/me/payment-methods/:id/default
// @access  Private (Customer)
const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const paymentId = req.params.id;

    const method = await PaymentMethod.findById(paymentId);
    if (!method || method.customer_id !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Payment method not found' });
    }

    const updatedMethod = await PaymentMethod.setAsDefault(paymentId, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Default payment method updated successfully',
      data: updatedMethod
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a payment method
// @route   DELETE /api/users/me/payment-methods/:id
// @access  Private (Customer)
const deletePaymentMethod = async (req, res, next) => {
  try {
    const paymentId = req.params.id;

    const isDeleted = await PaymentMethod.delete(paymentId, req.user.id);
    
    if (!isDeleted) {
      return res.status(404).json({ status: 'error', message: 'Payment method not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod
};
