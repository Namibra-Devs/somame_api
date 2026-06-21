const Promotion = require('../models/Promotion');
const Vendor = require('../models/Vendor');

// @desc    Create a promotion code
// @route   POST /api/vendors/me/promotions
const createPromotion = async (req, res, next) => {
  try {
    const { code, discount_type, discount_value, min_order_subtotal, max_discount_limit, applicable_to, expires_at, is_active } = req.body;
    
    if (!code || !discount_type || discount_value === undefined || !expires_at) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const promotion = await Promotion.create({
      vendor_id: vendor.id, code, discount_type, discount_value, min_order_subtotal, max_discount_limit, applicable_to, expires_at, is_active
    });

    res.status(201).json({ status: 'success', message: 'Promotion created successfully', data: promotion });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'Promotion code already exists for your vendor' });
    }
    next(error);
  }
};

// @desc    Get all promotions for vendor
// @route   GET /api/vendors/me/promotions
const getMyPromotions = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const promotions = await Promotion.findByVendorId(vendor.id);
    res.status(200).json({ status: 'success', message: 'Promotions retrieved successfully', data: promotions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a promotion
// @route   PUT /api/vendors/me/promotions/:id
const updatePromotion = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const { code, discount_type, discount_value, min_order_subtotal, max_discount_limit, applicable_to, expires_at, is_active } = req.body;

    const promotion = await Promotion.update(req.params.id, vendor.id, {
      code, discount_type, discount_value, min_order_subtotal, max_discount_limit, applicable_to, expires_at, is_active
    });

    if (!promotion) return res.status(404).json({ status: 'error', message: 'Promotion not found' });

    res.status(200).json({ status: 'success', message: 'Promotion updated successfully', data: promotion });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'Promotion code already exists for your vendor' });
    }
    next(error);
  }
};

// @desc    Delete a promotion
// @route   DELETE /api/vendors/me/promotions/:id
const deletePromotion = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const isDeleted = await Promotion.delete(req.params.id, vendor.id);
    if (!isDeleted) return res.status(404).json({ status: 'error', message: 'Promotion not found' });

    res.status(200).json({ status: 'success', message: 'Promotion deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate and apply a promo code
// @route   POST /api/orders/validate-promo
const validatePromo = async (req, res, next) => {
  try {
    const { vendor_id, code, subtotal, items = [] } = req.body;
    
    if (!vendor_id || !code || subtotal === undefined) {
      return res.status(400).json({ status: 'error', message: 'Missing vendor_id, code, or subtotal' });
    }

    const promotion = await Promotion.findByVendorAndCode(vendor_id, code);
    if (!promotion) return res.status(404).json({ status: 'error', message: 'Invalid promotion code' });

    if (!promotion.is_active) {
      return res.status(400).json({ status: 'error', message: 'Promotion code is inactive' });
    }

    const now = new Date();
    if (new Date(promotion.expires_at) < now) {
      return res.status(400).json({ status: 'error', message: 'Promotion code has expired' });
    }

    if (parseFloat(subtotal) < parseFloat(promotion.min_order_subtotal)) {
      return res.status(400).json({ status: 'error', message: `Minimum subtotal of ${promotion.min_order_subtotal} required` });
    }

    // Filter items based on applicable_to
    let applicableSubtotal = 0;
    const applicableTo = typeof promotion.applicable_to === 'string' ? JSON.parse(promotion.applicable_to) : promotion.applicable_to;
    
    if (applicableTo.type === 'all') {
      applicableSubtotal = parseFloat(subtotal);
    } else {
      // Calculate subtotal of only applicable items
      for (const item of items) {
        let isApplicable = false;
        if (applicableTo.type === 'category' && applicableTo.ids.includes(item.menu_category_id)) {
          isApplicable = true;
        } else if (applicableTo.type === 'item' && applicableTo.ids.includes(item.id)) {
          isApplicable = true;
        }
        
        if (isApplicable) {
          applicableSubtotal += (parseFloat(item.price) * (item.quantity || 1));
        }
      }
    }

    if (applicableSubtotal <= 0) {
      return res.status(400).json({ status: 'error', message: 'Promotion does not apply to any items in your cart' });
    }

    let discountAmount = 0;
    if (promotion.discount_type === 'percentage') {
      discountAmount = applicableSubtotal * (parseFloat(promotion.discount_value) / 100);
      if (promotion.max_discount_limit && discountAmount > parseFloat(promotion.max_discount_limit)) {
        discountAmount = parseFloat(promotion.max_discount_limit);
      }
    } else if (promotion.discount_type === 'fixed') {
      discountAmount = parseFloat(promotion.discount_value);
      if (discountAmount > applicableSubtotal) {
        discountAmount = applicableSubtotal; // Cant discount more than the items cost
      }
    }

    // round to 2 decimals
    discountAmount = Math.round(discountAmount * 100) / 100;

    res.status(200).json({
      status: 'success',
      message: 'Promo code applied successfully',
      data: {
        promotion_id: promotion.id,
        code: promotion.code,
        discount_type: promotion.discount_type,
        discount_amount: discountAmount,
        original_subtotal: parseFloat(subtotal),
        new_subtotal: parseFloat(subtotal) - discountAmount
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPromotion,
  getMyPromotions,
  updatePromotion,
  deletePromotion,
  validatePromo
};
