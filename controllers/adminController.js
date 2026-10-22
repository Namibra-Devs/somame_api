const { pool } = require('../config/db');
const SystemConfig = require('../models/SystemConfig');

// @desc    Get all system configurations
// @route   GET /api/admin/configs
// @access  Private/Admin
const getConfigs = async (req, res, next) => {
  try {
    const configs = await SystemConfig.getAll();
    res.status(200).json({
      status: 'success',
      data: configs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system configurations
// @route   PUT /api/admin/configs
// @access  Private/Admin
const updateConfigs = async (req, res, next) => {
  try {
    const configs = req.body;

    if (!configs || typeof configs !== 'object' || Array.isArray(configs)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid configuration payload. Must be an object.'
      });
    }

    await SystemConfig.update(configs);
    const updatedConfigs = await SystemConfig.getAll();

    res.status(200).json({
      status: 'success',
      message: 'System configurations updated successfully',
      data: updatedConfigs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Dashboard Overview KPIs, Revenue Chart, and Recent Activity
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      usersCountRes,
      vendorsCountRes,
      ridersStatsRes,
      ordersStatsRes,
      parcelsStatsRes,
      supportStatsRes,
      revenueChartRes,
      recentOrdersRes,
      recentParcelsRes
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_users,
          COUNT(*) FILTER (WHERE role = 'customer')::int AS total_customers,
          COUNT(*) FILTER (WHERE is_active = true)::int AS active_users
        FROM users
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_vendors,
          COUNT(*) FILTER (WHERE is_open = true)::int AS open_vendors
        FROM vendors
      `),
      pool.query(`
        SELECT
          COUNT(u.id)::int AS total_riders,
          COUNT(rp.id) FILTER (WHERE rp.is_online = true)::int AS online_riders,
          COUNT(rp.id) FILTER (WHERE rp.verification_status = 'pending')::int AS pending_kyc,
          COUNT(rp.id) FILTER (WHERE rp.verification_status = 'approved')::int AS approved_riders
        FROM users u
        LEFT JOIN rider_profiles rp ON rp.user_id = u.id
        WHERE u.role = 'rider'
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_orders,
          COUNT(*) FILTER (WHERE status IN ('pending', 'accepted', 'preparing', 'out_for_delivery'))::int AS active_orders,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0)::numeric(12,2) AS food_gmv,
          COALESCE(SUM(service_fee) FILTER (WHERE status = 'delivered'), 0)::numeric(12,2) AS food_service_fees,
          COALESCE(SUM(total_amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0)::numeric(12,2) AS today_food_revenue
        FROM orders
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_parcels,
          COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_parcels,
          COUNT(*) FILTER (WHERE status IN ('pending', 'accepted', 'picked_up', 'in_transit'))::int AS active_parcels,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0)::numeric(12,2) AS parcel_gmv,
          COALESCE(SUM(total_amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0)::numeric(12,2) AS today_parcel_revenue
        FROM parcel_orders
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('open', 'in_progress'))::int AS open_cases,
          COUNT(*)::int AS total_cases
        FROM support_cases
      `),
      pool.query(`
        SELECT
          TO_CHAR(d.day, 'Dy, Mon DD') AS label,
          TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
          COALESCE(SUM(o.total_amount), 0)::numeric(12,2) AS food_revenue,
          COUNT(o.id)::int AS order_count
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS d(day)
        LEFT JOIN orders o ON DATE(o.created_at) = d.day::date AND o.status = 'delivered'
        GROUP BY d.day
        ORDER BY d.day ASC
      `),
      pool.query(`
        SELECT
          o.id,
          o.order_number,
          o.status,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.created_at,
          v.name AS vendor_name,
          TRIM(CONCAT(c.first_name, ' ', c.last_name)) AS customer_name,
          c.phone_number AS customer_phone
        FROM orders o
        LEFT JOIN vendors v ON v.id = o.vendor_id
        LEFT JOIN users c ON c.id = o.customer_id
        ORDER BY o.created_at DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          p.id,
          p.order_number,
          p.item_description,
          p.recipient_name,
          p.delivery_speed,
          p.distance_km,
          p.status,
          p.total_amount,
          p.created_at,
          TRIM(CONCAT(c.first_name, ' ', c.last_name)) AS customer_name,
          c.phone_number AS customer_phone
        FROM parcel_orders p
        LEFT JOIN users c ON c.id = p.customer_id
        ORDER BY p.created_at DESC
        LIMIT 6
      `)
    ]);

    const uStats = usersCountRes.rows[0] || {};
    const vStats = vendorsCountRes.rows[0] || {};
    const rStats = ridersStatsRes.rows[0] || {};
    const oStats = ordersStatsRes.rows[0] || {};
    const pStats = parcelsStatsRes.rows[0] || {};
    const sStats = supportStatsRes.rows[0] || {};

    const totalGmv =
      parseFloat(oStats.food_gmv || 0) + parseFloat(pStats.parcel_gmv || 0);
    const todayRevenue =
      parseFloat(oStats.today_food_revenue || 0) +
      parseFloat(pStats.today_parcel_revenue || 0);

    res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          total_users: uStats.total_users || 0,
          total_customers: uStats.total_customers || 0,
          active_users: uStats.active_users || 0,
          total_vendors: vStats.total_vendors || 0,
          open_vendors: vStats.open_vendors || 0,
          total_riders: rStats.total_riders || 0,
          online_riders: rStats.online_riders || 0,
          pending_kyc: rStats.pending_kyc || 0,
          approved_riders: rStats.approved_riders || 0,
          total_orders: oStats.total_orders || 0,
          delivered_orders: oStats.delivered_orders || 0,
          active_orders: oStats.active_orders || 0,
          total_parcels: pStats.total_parcels || 0,
          delivered_parcels: pStats.delivered_parcels || 0,
          active_parcels: pStats.active_parcels || 0,
          total_gmv: totalGmv.toFixed(2),
          today_revenue: todayRevenue.toFixed(2),
          food_service_fees: parseFloat(oStats.food_service_fees || 0).toFixed(2),
          open_support_cases: sStats.open_cases || 0
        },
        revenue_chart: revenueChartRes.rows,
        recent_orders: recentOrdersRes.rows,
        recent_parcels: recentParcelsRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors with owner info, category, and performance stats
// @route   GET /api/admin/vendors
// @access  Private/Admin
const getAdminVendors = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id,
        v.user_id,
        v.category_id,
        v.name,
        v.description,
        v.logo_url,
        v.rating,
        v.tags,
        v.is_open,
        ST_Y(v.location::geometry) AS lat,
        ST_X(v.location::geometry) AS lng,
        v.created_at,
        c.name AS category_name,
        u.first_name AS owner_first_name,
        u.last_name AS owner_last_name,
        u.phone_number AS owner_phone,
        u.email AS owner_email,
        u.is_active AS owner_is_active,
        COUNT(DISTINCT o.id)::int AS total_orders,
        COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0)::numeric(12,2) AS total_revenue,
        COUNT(DISTINCT mi.id)::int AS menu_items_count
      FROM vendors v
      LEFT JOIN categories c ON c.id = v.category_id
      LEFT JOIN users u ON u.id = v.user_id
      LEFT JOIN orders o ON o.vendor_id = v.id
      LEFT JOIN menu_items mi ON mi.vendor_id = v.id
      GROUP BY v.id, c.name, u.id
      ORDER BY v.created_at DESC
    `);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor details or status by Admin
// @route   PUT /api/admin/vendors/:id
// @access  Private/Admin
const updateAdminVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category_id,
      tags,
      is_open,
      owner_is_active,
      lat,
      lng
    } = req.body;

    const existing = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    }
    const vendor = existing.rows[0];

    let locationClause = '';
    const params = [
      name !== undefined ? name : vendor.name,
      description !== undefined ? description : vendor.description,
      category_id !== undefined ? category_id : vendor.category_id,
      tags !== undefined ? tags : vendor.tags,
      is_open !== undefined ? Boolean(is_open) : vendor.is_open,
      id
    ];

    if (lat !== undefined && lng !== undefined && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      params.push(Number(lng), Number(lat));
      locationClause = `, location = ST_SetSRID(ST_MakePoint($7, $8), 4326)`;
    }

    const updatedRes = await pool.query(
      `UPDATE vendors
       SET name = $1,
           description = $2,
           category_id = $3,
           tags = $4,
           is_open = $5,
           updated_at = CURRENT_TIMESTAMP
           ${locationClause}
       WHERE id = $6
       RETURNING *`,
      params
    );

    if (owner_is_active !== undefined && vendor.user_id) {
      await pool.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [Boolean(owner_is_active), vendor.user_id]
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Vendor updated successfully',
      data: updatedRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all riders with KYC documents, wallet balance, and delivery stats
// @route   GET /api/admin/riders
// @access  Private/Admin
const getAdminRiders = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.is_verified,
        u.is_active,
        u.rating,
        u.profile_picture,
        u.created_at,
        rp.id AS profile_id,
        rp.date_of_birth,
        rp.vehicle_type,
        rp.id_document_type,
        rp.id_front_image_url,
        rp.id_back_image_url,
        rp.license_front_image_url,
        rp.license_back_image_url,
        rp.road_worthy_image_url,
        rp.insurance_image_url,
        rp.selfie_image_url,
        COALESCE(rp.verification_status::text, 'pending') AS verification_status,
        COALESCE(rp.is_online, false) AS is_online,
        ST_Y(rp.current_location::geometry) AS lat,
        ST_X(rp.current_location::geometry) AS lng,
        COALESCE(rw.balance, 0)::numeric(12,2) AS wallet_balance,
        COALESCE(rw.total_earned, 0)::numeric(12,2) AS total_earned,
        COALESCE(rw.total_withdrawn, 0)::numeric(12,2) AS total_withdrawn,
        (
          SELECT COUNT(*)::int FROM orders o WHERE o.rider_id = u.id AND o.status = 'delivered'
        ) AS food_deliveries,
        (
          SELECT COUNT(*)::int FROM parcel_orders po WHERE po.rider_id = u.id AND po.status = 'delivered'
        ) AS parcel_deliveries
      FROM users u
      LEFT JOIN rider_profiles rp ON rp.user_id = u.id
      LEFT JOIN rider_wallets rw ON rw.rider_id = u.id
      WHERE u.role = 'rider'
      ORDER BY u.created_at DESC
    `);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a rider's KYC verification status
// @route   PATCH /api/admin/riders/:id/verify
// @access  Private/Admin
const verifyAdminRider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verification_status, is_active } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (verification_status && !validStatuses.includes(verification_status)) {
      return res.status(400).json({
        status: 'error',
        message: 'verification_status must be pending, approved, or rejected'
      });
    }

    const userCheck = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'rider'",
      [id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Rider not found' });
    }

    if (verification_status) {
      await pool.query(
        `INSERT INTO rider_profiles (user_id, verification_status)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE
         SET verification_status = EXCLUDED.verification_status,
             updated_at = CURRENT_TIMESTAMP`,
        [id, verification_status]
      );

      await pool.query(
        'UPDATE users SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [verification_status === 'approved', id]
      );
    }

    if (is_active !== undefined) {
      await pool.query(
        'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [Boolean(is_active), id]
      );
    }

    res.status(200).json({
      status: 'success',
      message: `Rider verification updated to ${verification_status || 'updated'}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers with order counts, parcel counts, and total spend
// @route   GET /api/admin/customers
// @access  Private/Admin
const getAdminCustomers = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.is_verified,
        u.is_active,
        u.profile_picture,
        u.created_at,
        COUNT(DISTINCT o.id)::int AS food_orders_count,
        COUNT(DISTINCT p.id)::int AS parcel_orders_count,
        COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'delivered'), 0)::numeric(12,2) AS food_spent,
        COALESCE(SUM(p.total_amount) FILTER (WHERE p.status = 'delivered'), 0)::numeric(12,2) AS parcel_spent,
        (
          SELECT COUNT(*)::int FROM saved_addresses sa WHERE sa.customer_id = u.id
        ) AS saved_addresses_count
      FROM users u
      LEFT JOIN orders o ON o.customer_id = u.id
      LEFT JOIN parcel_orders p ON p.customer_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    const rows = result.rows.map((r) => ({
      ...r,
      total_spent: (parseFloat(r.food_spent || 0) + parseFloat(r.parcel_spent || 0)).toFixed(2)
    }));

    res.status(200).json({
      status: 'success',
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all food orders with customer, vendor, rider, and items
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAdminOrders = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.vendor_id,
        o.rider_id,
        o.status,
        o.total_amount,
        o.discount_amount,
        o.payment_method,
        o.payment_status,
        o.rider_tip,
        o.service_fee,
        o.customer_note,
        o.created_at,
        v.name AS vendor_name,
        v.logo_url AS vendor_logo,
        TRIM(CONCAT(c.first_name, ' ', c.last_name)) AS customer_name,
        c.phone_number AS customer_phone,
        TRIM(CONCAT(r.first_name, ' ', r.last_name)) AS rider_name,
        r.phone_number AS rider_phone,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'item_name', oi.item_name,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN vendors v ON v.id = o.vendor_id
      LEFT JOIN users c ON c.id = o.customer_id
      LEFT JOIN users r ON r.id = o.rider_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, v.id, c.id, r.id
      ORDER BY o.created_at DESC
    `);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin update food order status / payment status / rider assignment
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, payment_status, rider_id } = req.body;

    const existing = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    const order = existing.rows[0];

    const updated = await pool.query(
      `UPDATE orders
       SET status = $1,
           payment_status = $2,
           rider_id = $3
       WHERE id = $4
       RETURNING *`,
      [
        status || order.status,
        payment_status || order.payment_status,
        rider_id !== undefined ? rider_id : order.rider_id,
        id
      ]
    );

    res.status(200).json({
      status: 'success',
      message: 'Order updated by Admin',
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all parcel orders with customer and rider details
// @route   GET /api/admin/parcels
// @access  Private/Admin
const getAdminParcels = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.order_number,
        p.customer_id,
        p.rider_id,
        ST_Y(p.pickup_location::geometry) AS pickup_lat,
        ST_X(p.pickup_location::geometry) AS pickup_lng,
        ST_Y(p.dropoff_location::geometry) AS dropoff_lat,
        ST_X(p.dropoff_location::geometry) AS dropoff_lng,
        p.distance_km,
        p.estimated_time_mins,
        p.item_description,
        p.item_value,
        p.item_photo_url,
        p.recipient_name,
        p.recipient_phone,
        p.delivery_speed,
        p.status,
        p.total_amount,
        p.payment_method,
        p.payment_status,
        p.created_at,
        TRIM(CONCAT(c.first_name, ' ', c.last_name)) AS customer_name,
        c.phone_number AS customer_phone,
        TRIM(CONCAT(r.first_name, ' ', r.last_name)) AS rider_name,
        r.phone_number AS rider_phone
      FROM parcel_orders p
      LEFT JOIN users c ON c.id = p.customer_id
      LEFT JOIN users r ON r.id = p.rider_id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin update parcel order status / payment status / rider assignment
// @route   PATCH /api/admin/parcels/:id/status
// @access  Private/Admin
const updateAdminParcelStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, payment_status, rider_id } = req.body;

    const existing = await pool.query('SELECT * FROM parcel_orders WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Parcel order not found' });
    }
    const parcel = existing.rows[0];

    const updated = await pool.query(
      `UPDATE parcel_orders
       SET status = $1,
           payment_status = $2,
           rider_id = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [
        status || parcel.status,
        payment_status || parcel.payment_status,
        rider_id !== undefined ? rider_id : parcel.rider_id,
        id
      ]
    );

    res.status(200).json({
      status: 'success',
      message: 'Parcel order updated by Admin',
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Vendor Payouts and Rider Payouts for Admin Finance Console
// @route   GET /api/admin/payouts
// @access  Private/Admin
const getAdminPayouts = async (req, res, next) => {
  try {
    const [vendorPayoutsRes, riderPayoutsRes] = await Promise.all([
      pool.query(`
        SELECT
          vp.id,
          vp.vendor_id,
          vp.amount,
          vp.method_label,
          vp.account_masked,
          vp.status,
          vp.reference_id,
          vp.created_at,
          v.name AS vendor_name,
          u.phone_number AS vendor_phone
        FROM vendor_payouts vp
        LEFT JOIN vendors v ON v.id = vp.vendor_id
        LEFT JOIN users u ON u.id = v.user_id
        ORDER BY vp.created_at DESC
      `),
      pool.query(`
        SELECT
          rp.id,
          rp.rider_id,
          rp.amount,
          rp.payout_method_name,
          rp.payout_account_info,
          rp.status,
          rp.reference_id,
          rp.created_at,
          TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS rider_name,
          u.phone_number AS rider_phone
        FROM rider_payouts rp
        LEFT JOIN users u ON u.id = rp.rider_id
        ORDER BY rp.created_at DESC
      `)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        vendor_payouts: vendorPayoutsRes.rows,
        rider_payouts: riderPayoutsRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update status of a vendor or rider payout
// @route   PATCH /api/admin/payouts/:type/:id
// @access  Private/Admin
const updateAdminPayoutStatus = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ status: 'error', message: 'Status is required' });
    }

    if (type === 'vendor') {
      const result = await pool.query(
        `UPDATE vendor_payouts
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Vendor payout not found' });
      }
      return res.status(200).json({
        status: 'success',
        message: 'Vendor payout status updated',
        data: result.rows[0]
      });
    }

    if (type === 'rider') {
      const result = await pool.query(
        `UPDATE rider_payouts
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Rider payout not found' });
      }
      return res.status(200).json({
        status: 'success',
        message: 'Rider payout status updated',
        data: result.rows[0]
      });
    }

    return res.status(400).json({
      status: 'error',
      message: 'Payout type must be vendor or rider'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all support cases for Admin Helpdesk
// @route   GET /api/admin/support/cases
// @access  Private/Admin
const getAdminSupportCases = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        sc.*,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS user_name,
        u.phone_number AS user_phone,
        u.role AS user_role,
        o.order_number AS food_order_number,
        po.order_number AS parcel_order_number
      FROM support_cases sc
      LEFT JOIN users u ON u.id = sc.user_id
      LEFT JOIN orders o ON o.id = sc.order_id
      LEFT JOIN parcel_orders po ON po.id = sc.parcel_order_id
      ORDER BY sc.updated_at DESC
    `);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single support case with message thread for Admin
// @route   GET /api/admin/support/cases/:id
// @access  Private/Admin
const getAdminSupportCaseDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const caseRes = await pool.query(
      `SELECT
         sc.*,
         TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS user_name,
         u.phone_number AS user_phone,
         u.email AS user_email,
         u.role AS user_role,
         o.order_number AS food_order_number,
         po.order_number AS parcel_order_number
       FROM support_cases sc
       LEFT JOIN users u ON u.id = sc.user_id
       LEFT JOIN orders o ON o.id = sc.order_id
       LEFT JOIN parcel_orders po ON po.id = sc.parcel_order_id
       WHERE sc.id = $1`,
      [id]
    );

    if (caseRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Support case not found' });
    }

    const messagesRes = await pool.query(
      `SELECT
         sm.*,
         TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS sender_name
       FROM support_messages sm
       LEFT JOIN users u ON u.id = sm.sender_id
       WHERE sm.case_id = $1
       ORDER BY sm.created_at ASC`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        ...caseRes.rows[0],
        messages: messagesRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reply to a support case
// @route   POST /api/admin/support/cases/:id/messages
// @access  Private/Admin
const replyAdminSupportCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ status: 'error', message: 'Message text is required' });
    }

    const msgRes = await pool.query(
      `INSERT INTO support_messages (case_id, sender_id, sender_type, message, is_read)
       VALUES ($1, $2, 'admin', $3, false)
       RETURNING *`,
      [id, req.user.id, String(message).trim()]
    );

    await pool.query(
      `UPDATE support_cases
       SET last_message = $1,
           last_message_at = CURRENT_TIMESTAMP,
           status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
           assigned_agent_id = COALESCE(assigned_agent_id, $2),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [String(message).trim(), req.user.id, id]
    );

    res.status(201).json({
      status: 'success',
      message: 'Admin reply sent',
      data: msgRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin update support case status or priority
// @route   PATCH /api/admin/support/cases/:id/status
// @access  Private/Admin
const updateAdminSupportCaseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const existing = await pool.query('SELECT * FROM support_cases WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Support case not found' });
    }
    const c = existing.rows[0];

    const updated = await pool.query(
      `UPDATE support_cases
       SET status = $1,
           priority = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status || c.status, priority || c.priority, id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Support case updated',
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin get all support FAQ articles (including inactive)
// @route   GET /api/admin/support/articles
// @access  Private/Admin
const getAdminSupportArticles = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM support_articles ORDER BY id DESC');
    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a support FAQ article
// @route   POST /api/admin/support/articles
// @access  Private/Admin
const createAdminSupportArticle = async (req, res, next) => {
  try {
    const { title, category, content, is_active } = req.body;
    if (!title || !category || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, category, and content are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO support_articles (title, category, content, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), category.trim(), content.trim(), is_active !== undefined ? Boolean(is_active) : true]
    );

    res.status(201).json({
      status: 'success',
      message: 'Support article created',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a support FAQ article
// @route   PUT /api/admin/support/articles/:id
// @access  Private/Admin
const updateAdminSupportArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, content, is_active } = req.body;

    const existing = await pool.query('SELECT * FROM support_articles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Support article not found' });
    }
    const art = existing.rows[0];

    const result = await pool.query(
      `UPDATE support_articles
       SET title = $1,
           category = $2,
           content = $3,
           is_active = $4
       WHERE id = $5
       RETURNING *`,
      [
        title !== undefined ? title : art.title,
        category !== undefined ? category : art.category,
        content !== undefined ? content : art.content,
        is_active !== undefined ? Boolean(is_active) : art.is_active,
        id
      ]
    );

    res.status(200).json({
      status: 'success',
      message: 'Support article updated',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a support FAQ article
// @route   DELETE /api/admin/support/articles/:id
// @access  Private/Admin
const deleteAdminSupportArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM support_articles WHERE id = $1', [id]);
    res.status(200).json({
      status: 'success',
      message: 'Support article deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfigs,
  updateConfigs,
  getDashboardStats,
  getAdminVendors,
  updateAdminVendor,
  getAdminRiders,
  verifyAdminRider,
  getAdminCustomers,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminParcels,
  updateAdminParcelStatus,
  getAdminPayouts,
  updateAdminPayoutStatus,
  getAdminSupportCases,
  getAdminSupportCaseDetails,
  replyAdminSupportCase,
  updateAdminSupportCaseStatus,
  getAdminSupportArticles,
  createAdminSupportArticle,
  updateAdminSupportArticle,
  deleteAdminSupportArticle
};
