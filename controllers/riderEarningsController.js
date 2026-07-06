const { pool } = require('../config/db');
const RiderWallet = require('../models/RiderWallet');
const RiderEarning = require('../models/RiderEarning');
const RiderPayout = require('../models/RiderPayout');
const RiderPaymentMethod = require('../models/RiderPaymentMethod');

// @desc    Get rider earnings dashboard data
// @route   GET /api/riders/me/earnings
// @access  Private (Rider)
const getEarningsDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const riderId = req.user.id;
    const wallet = await RiderWallet.getWallet(riderId);

    const todayEarnings = await RiderEarning.getTodayEarnings(riderId);
    const yesterdayEarnings = await RiderEarning.getYesterdayEarnings(riderId);
    
    let percentageChange = 0;
    if (parseFloat(yesterdayEarnings) > 0) {
      percentageChange = ((parseFloat(todayEarnings) - parseFloat(yesterdayEarnings)) / parseFloat(yesterdayEarnings)) * 100;
    } else if (parseFloat(todayEarnings) > 0) {
      percentageChange = 100;
    }

    const weeklyStats = await RiderEarning.getWeeklyBreakdown(riderId);
    
    // Format daily chart data
    const chartData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    let totalBasePay = 0;
    let totalDistanceBonus = 0;
    let totalTip = 0;
    let totalStreakBonus = 0;
    let totalWeeklyEarnings = 0;

    const dayMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

    weeklyStats.forEach(stat => {
      const dayName = dayMap[stat.day_of_week];
      if (dayName) {
        chartData[dayName] = parseFloat(stat.total_amount);
      }
      totalBasePay += parseFloat(stat.total_base_pay || 0);
      totalDistanceBonus += parseFloat(stat.total_distance_bonus || 0);
      totalTip += parseFloat(stat.total_tip || 0);
      totalStreakBonus += parseFloat(stat.total_streak_bonus || 0);
      totalWeeklyEarnings += parseFloat(stat.total_amount || 0);
    });

    res.status(200).json({
      status: 'success',
      message: 'Earnings dashboard retrieved successfully',
      data: {
        available_balance: wallet.balance,
        today_earnings: todayEarnings,
        percentage_change_vs_yesterday: percentageChange.toFixed(2),
        breakdown: {
          chart_data: chartData,
          base_pay: totalBasePay,
          distance_bonuses: totalDistanceBonus,
          tips: totalTip,
          streak_bonuses: totalStreakBonus,
          total: totalWeeklyEarnings
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payout history
// @route   GET /api/riders/me/payouts
// @access  Private (Rider)
const getPayoutHistory = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const payouts = await RiderPayout.findByRiderId(req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Payout history retrieved successfully',
      data: payouts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a payout
// @route   POST /api/riders/me/payouts
// @access  Private (Rider)
const requestPayout = async (req, res, next) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const { amount, payment_method_id } = req.body;
    const payoutAmount = parseFloat(amount);

    if (!payoutAmount || payoutAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid payout amount' });
    }

    if (!payment_method_id) {
      return res.status(400).json({ status: 'error', message: 'payment_method_id is required' });
    }

    // Verify payment method belongs to rider
    const paymentMethod = await RiderPaymentMethod.findById(payment_method_id);
    if (!paymentMethod || paymentMethod.rider_id !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Payment method not found' });
    }

    await client.query('BEGIN');

    // Deduct from wallet (this will throw if insufficient balance)
    let updatedWallet;
    try {
      updatedWallet = await RiderWallet.deductForPayout(req.user.id, payoutAmount, client);
    } catch (err) {
      if (err.message === 'Insufficient balance') {
        return res.status(400).json({ status: 'error', message: 'Insufficient balance for payout' });
      }
      throw err;
    }

    // Prepare payout account info for caching
    let payoutAccountInfo = paymentMethod.account_number;
    let payoutMethodName = paymentMethod.provider; // 'momo' or 'bank'
    if (paymentMethod.provider === 'bank') {
      payoutMethodName = paymentMethod.bank_name;
      // mask account number, e.g. ABSA *******098
      if (payoutAccountInfo.length > 4) {
        payoutAccountInfo = '*'.repeat(payoutAccountInfo.length - 4) + payoutAccountInfo.slice(-4);
      }
    } else if (paymentMethod.provider === 'momo') {
      payoutMethodName = 'Mobile Money';
      // mask phone number
      if (payoutAccountInfo.length > 4) {
        payoutAccountInfo = '*'.repeat(payoutAccountInfo.length - 4) + payoutAccountInfo.slice(-4);
      }
    }

    const payoutData = {
      rider_id: req.user.id,
      amount: payoutAmount,
      payment_method_id,
      payout_method_name: payoutMethodName,
      payout_account_info: payoutAccountInfo
    };

    const payout = await RiderPayout.create(payoutData, client);

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Payout requested successfully',
      data: {
        payout,
        remaining_balance: updatedWallet.balance
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
  getEarningsDashboard,
  getPayoutHistory,
  requestPayout
};
