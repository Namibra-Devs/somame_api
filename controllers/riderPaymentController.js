const RiderPaymentMethod = require('../models/RiderPaymentMethod');

// @desc    Get logged in rider's payment methods
// @route   GET /api/riders/me/payment-methods
// @access  Private (Rider)
const getPaymentMethods = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const paymentMethods = await RiderPaymentMethod.findByRiderId(req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Rider payment methods retrieved successfully',
      data: paymentMethods
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new payment method
// @route   POST /api/riders/me/payment-methods
// @access  Private (Rider)
const addPaymentMethod = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const { provider, account_name, account_number, bank_name, branch, is_default } = req.body;

    if (!provider || !['bank', 'momo'].includes(provider)) {
      return res.status(400).json({ status: 'error', message: 'Valid provider (bank or momo) is required' });
    }

    if (!account_number) {
      return res.status(400).json({ status: 'error', message: 'account_number is required' });
    }

    if (provider === 'bank') {
      if (!bank_name || !account_name || !branch) {
        return res.status(400).json({ status: 'error', message: 'bank_name, account_name, and branch are required for bank accounts' });
      }
    } else if (provider === 'momo') {
      // For momo, account_name might be optional in UI but good to have
      // Wait, in our schema, account_name is NOT NULL. 
      // If UI only sends phone number, we can use rider name or a placeholder or require it.
      if (!account_name) {
        return res.status(400).json({ status: 'error', message: 'account_name is required' });
      }
    }

    const newPaymentMethod = await RiderPaymentMethod.create({
      rider_id: req.user.id,
      provider,
      account_name,
      account_number,
      bank_name: provider === 'bank' ? bank_name : null,
      branch: provider === 'bank' ? branch : null,
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

// @desc    Update a payment method
// @route   PUT /api/riders/me/payment-methods/:id
// @access  Private (Rider)
const updatePaymentMethod = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const paymentId = req.params.id;
    const method = await RiderPaymentMethod.findById(paymentId);

    if (!method || method.rider_id !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Payment method not found' });
    }

    // Prepare update data
    const updateData = {};
    if (req.body.provider) updateData.provider = req.body.provider;
    
    // Determine provider for validation (either new one or existing one)
    const activeProvider = updateData.provider || method.provider;

    if (req.body.account_name !== undefined) updateData.account_name = req.body.account_name;
    if (req.body.account_number !== undefined) updateData.account_number = req.body.account_number;
    
    // Enforce fields based on provider type
    if (activeProvider === 'bank') {
      if (req.body.bank_name !== undefined) updateData.bank_name = req.body.bank_name;
      if (req.body.branch !== undefined) updateData.branch = req.body.branch;
    } else if (activeProvider === 'momo') {
      // If it's momo, enforce bank fields to be null
      updateData.bank_name = null;
      updateData.branch = null;
    }

    if (req.body.is_default !== undefined) updateData.is_default = req.body.is_default;


    const updatedMethod = await RiderPaymentMethod.update(paymentId, updateData);

    res.status(200).json({
      status: 'success',
      message: 'Payment method updated successfully',
      data: updatedMethod
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a payment method
// @route   DELETE /api/riders/me/payment-methods/:id
// @access  Private (Rider)
const deletePaymentMethod = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const paymentId = req.params.id;
    const method = await RiderPaymentMethod.findById(paymentId);

    if (!method || method.rider_id !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Payment method not found' });
    }

    await RiderPaymentMethod.delete(paymentId);

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
  updatePaymentMethod,
  deletePaymentMethod
};
