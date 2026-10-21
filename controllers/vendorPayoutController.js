const { pool } = require('../config/db');
const Vendor = require('../models/Vendor');
const VendorPaymentMethod = require('../models/VendorPaymentMethod');
const VendorPayout = require('../models/VendorPayout');

let tablesInitialized = false;

const ensureVendorPayoutTables = async () => {
  if (tablesInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_payment_methods (
      id SERIAL PRIMARY KEY,
      vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL CHECK (provider IN ('momo', 'bank')),
      network_or_bank VARCHAR(100) NOT NULL,
      account_name VARCHAR(255) NOT NULL,
      account_number VARCHAR(255) NOT NULL,
      branch VARCHAR(255),
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vendor_payment_methods_vendor_id ON vendor_payment_methods(vendor_id);

    CREATE TABLE IF NOT EXISTS vendor_payouts (
      id SERIAL PRIMARY KEY,
      vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      amount DECIMAL(12, 2) NOT NULL,
      payment_method_id INTEGER REFERENCES vendor_payment_methods(id) ON DELETE SET NULL,
      method_label VARCHAR(100) NOT NULL,
      account_masked VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'Paid',
      reference_id VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
  `);
  tablesInitialized = true;
};

// Ensure tables exist when module loads
ensureVendorPayoutTables().catch(() => {});

const maskAccount = (num = '', prefixLen = 4) => {
  const clean = String(num).replace(/\s+/g, '');
  if (clean.length <= 3) return clean;
  return `${'*'.repeat(Math.max(prefixLen, clean.length - 3))}${clean.slice(-3)}`;
};

// @desc    Get vendor earnings, period breakdown, payout settings & payout history
// @route   GET /api/vendors/me/earnings
// @access  Private (Vendor)
const getVendorEarnings = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    await ensureVendorPayoutTables();

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const { period = 'monthly', start_date, end_date } = req.query;

    let dateCondition = '';
    const queryParams = [vendor.id];

    if (period === 'weekly') {
      dateCondition = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'monthly') {
      dateCondition = "AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)";
    } else if (period === 'yearly') {
      dateCondition = "AND date_trunc('year', created_at) = date_trunc('year', CURRENT_DATE)";
    } else if (period === 'custom' && start_date && end_date) {
      dateCondition = 'AND DATE(created_at) >= $2 AND DATE(created_at) <= $3';
      queryParams.push(start_date, end_date);
    }

    const [allTimeRes, periodRes, payouts, paymentMethods] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_gross,
                COALESCE(SUM(service_fee), 0) AS total_service_fee
         FROM orders
         WHERE vendor_id = $1 AND status = 'delivered'`,
        [vendor.id]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS period_gross,
                COALESCE(SUM(service_fee), 0) AS period_service_fee,
                COUNT(id) AS order_count
         FROM orders
         WHERE vendor_id = $1 AND status = 'delivered' ${dateCondition}`,
        queryParams
      ),
      VendorPayout.findByVendorId(vendor.id),
      VendorPaymentMethod.findByVendorId(vendor.id)
    ]);

    const allTimeGross = parseFloat(allTimeRes.rows[0]?.total_gross || 0);
    const allTimeCommission = +(allTimeGross * 0.15).toFixed(2);
    const allTimeServiceFee = parseFloat(allTimeRes.rows[0]?.total_service_fee || 0);
    const allTimeNet = Math.max(0, +(allTimeGross - allTimeCommission - allTimeServiceFee).toFixed(2));

    const totalWithdrawn = payouts
      .filter((row) => row.status !== 'Failed')
      .reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);

    const availableBalance = Math.max(0, +(allTimeNet - totalWithdrawn).toFixed(2));

    const grossRevenue = parseFloat(periodRes.rows[0]?.period_gross || 0);
    const orderCount = parseInt(periodRes.rows[0]?.order_count || 0, 10);
    const commissionAmount = +(grossRevenue * 0.15).toFixed(2);
    const deliveryFeesAmount = parseFloat(periodRes.rows[0]?.period_service_fee || 0);
    const netPayout = Math.max(
      0,
      +(grossRevenue - commissionAmount - deliveryFeesAmount).toFixed(2)
    );

    const deliveryFeesPct =
      grossRevenue > 0 ? -Math.round((deliveryFeesAmount / grossRevenue) * 100) : 0;
    const netPayoutPct =
      grossRevenue > 0 ? Math.round((netPayout / grossRevenue) * 100) : 0;

    res.status(200).json({
      status: 'success',
      message: 'Vendor earnings retrieved successfully',
      data: {
        available_balance: availableBalance,
        total_earned: allTimeNet,
        total_withdrawn: +totalWithdrawn.toFixed(2),
        breakdown: {
          order_count: orderCount,
          gross_revenue: grossRevenue,
          commission_rate: 15,
          commission_amount: commissionAmount,
          commission_pct: grossRevenue > 0 ? -15 : 0,
          delivery_fees: deliveryFeesAmount,
          delivery_fees_pct: deliveryFeesPct,
          net_payout: netPayout,
          net_payout_pct: netPayoutPct
        },
        payment_methods: paymentMethods,
        payout_history: payouts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor payment methods
// @route   GET /api/vendors/me/payment-methods
// @access  Private (Vendor)
const getVendorPaymentMethods = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    await ensureVendorPayoutTables();
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const methods = await VendorPaymentMethod.findByVendorId(vendor.id);
    res.status(200).json({
      status: 'success',
      message: 'Vendor payment methods retrieved successfully',
      data: methods
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update a vendor payout method
// @route   POST /api/vendors/me/payment-methods
// @access  Private (Vendor)
const saveVendorPaymentMethod = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    await ensureVendorPayoutTables();
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const {
      id,
      provider,
      network_or_bank,
      bank_name,
      account_name,
      account_number,
      branch,
      is_default
    } = req.body;

    if (!provider || !['momo', 'bank'].includes(provider)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid provider (momo or bank) is required'
      });
    }

    if (!account_name || !account_number) {
      return res.status(400).json({
        status: 'error',
        message: 'account_name and account_number are required'
      });
    }

    const resolvedNetworkOrBank =
      network_or_bank || bank_name || (provider === 'bank' ? 'Bank Transfer' : 'MTN Mobile Money');

    let savedMethod;
    if (id) {
      savedMethod = await VendorPaymentMethod.update(id, vendor.id, {
        provider,
        network_or_bank: resolvedNetworkOrBank,
        account_name,
        account_number,
        branch: provider === 'bank' ? branch || null : null,
        is_default
      });
    } else {
      savedMethod = await VendorPaymentMethod.create({
        vendor_id: vendor.id,
        provider,
        network_or_bank: resolvedNetworkOrBank,
        account_name,
        account_number,
        branch: provider === 'bank' ? branch || null : null,
        is_default
      });
    }

    res.status(id ? 200 : 201).json({
      status: 'success',
      message: id ? 'Payout method updated successfully' : 'Payout method added successfully',
      data: savedMethod
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vendor payout method by ID
// @route   PUT /api/vendors/me/payment-methods/:id
// @access  Private (Vendor)
const updateVendorPaymentMethod = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    await ensureVendorPayoutTables();
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const existing = await VendorPaymentMethod.findById(req.params.id);
    if (!existing || existing.vendor_id !== vendor.id) {
      return res.status(404).json({ status: 'error', message: 'Payment method not found' });
    }

    const updated = await VendorPaymentMethod.update(req.params.id, vendor.id, req.body);

    res.status(200).json({
      status: 'success',
      message: 'Payout method updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vendor payout method
// @route   DELETE /api/vendors/me/payment-methods/:id
// @access  Private (Vendor)
const deleteVendorPaymentMethod = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    await ensureVendorPayoutTables();
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const deleted = await VendorPaymentMethod.delete(req.params.id, vendor.id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Payment method not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Payout method deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor payout history
// @route   GET /api/vendors/me/payouts
// @access  Private (Vendor)
const getVendorPayoutHistory = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    await ensureVendorPayoutTables();
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const payouts = await VendorPayout.findByVendorId(vendor.id);
    res.status(200).json({
      status: 'success',
      message: 'Vendor payout history retrieved successfully',
      data: payouts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a vendor payout
// @route   POST /api/vendors/me/payouts
// @access  Private (Vendor)
const requestVendorPayout = async (req, res, next) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Vendors only' });
    }

    await ensureVendorPayoutTables();
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });
    }

    const { amount, payment_method_id } = req.body;
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter a valid payout amount'
      });
    }

    if (!payment_method_id) {
      return res.status(400).json({
        status: 'error',
        message: 'payment_method_id is required'
      });
    }

    const chosenMethod = await VendorPaymentMethod.findById(payment_method_id);
    if (!chosenMethod || chosenMethod.vendor_id !== vendor.id) {
      return res.status(404).json({
        status: 'error',
        message: 'Selected payout method not found'
      });
    }

    await client.query('BEGIN');

    // Calculate current available balance inside transaction
    const allTimeRes = await client.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_gross,
              COALESCE(SUM(service_fee), 0) AS total_service_fee
       FROM orders
       WHERE vendor_id = $1 AND status = 'delivered'`,
      [vendor.id]
    );
    const allTimeGross = parseFloat(allTimeRes.rows[0]?.total_gross || 0);
    const allTimeCommission = +(allTimeGross * 0.15).toFixed(2);
    const allTimeServiceFee = parseFloat(allTimeRes.rows[0]?.total_service_fee || 0);
    const allTimeNet = Math.max(
      0,
      +(allTimeGross - allTimeCommission - allTimeServiceFee).toFixed(2)
    );

    const totalWithdrawn = await VendorPayout.getTotalWithdrawn(vendor.id, client);
    const availableBalance = Math.max(0, +(allTimeNet - totalWithdrawn).toFixed(2));

    if (numericAmount > availableBalance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient available balance for this payout request'
      });
    }

    const finalMethodLabel =
      chosenMethod.network_or_bank ||
      (chosenMethod.provider === 'momo' ? 'Mobile Money' : 'Bank Transfer');
    const finalAccountMasked = maskAccount(
      chosenMethod.account_number,
      chosenMethod.provider === 'bank' ? 7 : 4
    );
    const referenceId = `PAY-${Date.now().toString(36).toUpperCase()}`;

    const createdPayout = await VendorPayout.create(
      {
        vendor_id: vendor.id,
        amount: numericAmount,
        payment_method_id: chosenMethod.id,
        method_label: finalMethodLabel,
        account_masked: finalAccountMasked,
        status: 'Paid',
        reference_id: referenceId
      },
      client
    );

    await client.query('COMMIT');

    const remainingBalance = Math.max(0, +(availableBalance - numericAmount).toFixed(2));

    res.status(201).json({
      status: 'success',
      message: 'Payout processed successfully',
      data: {
        payout: createdPayout,
        remaining_balance: remainingBalance
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getVendorEarnings,
  getVendorPaymentMethods,
  saveVendorPaymentMethod,
  updateVendorPaymentMethod,
  deleteVendorPaymentMethod,
  getVendorPayoutHistory,
  requestVendorPayout
};
