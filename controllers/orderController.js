const { pool } = require('../config/db');

// @desc    Get nearby vendors
// @route   GET /api/vendors/nearby
const getNearbyVendors = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters

    if (!lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'Please provide lat and lng query parameters' });
    }

    // Using ST_DistanceSphere for finding nearby vendors.
    // PostGIS assumes Longitude (X) then Latitude (Y) for ST_MakePoint.
    const query = `
      SELECT id, name, logo_url, rating, 
             ST_Y(location::geometry) as lat, 
             ST_X(location::geometry) as lng,
             ST_DistanceSphere(location::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance
      FROM vendors
      WHERE ST_DistanceSphere(location::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)) <= $3
      ORDER BY distance ASC;
    `;

    const result = await pool.query(query, [lng, lat, radius]);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new order transaction
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { customer_id, vendor_id, rider_id, items, total_amount, payment_method, delivery_location } = req.body;

    if (!customer_id || !vendor_id || !items || items.length === 0 || !total_amount || !payment_method) {
      return res.status(400).json({ status: 'error', message: 'Missing required order fields' });
    }

    await client.query('BEGIN');

    // 1. Insert into orders table
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, vendor_id, rider_id, status, total_amount, payment_method) 
       VALUES ($1, $2, $3, 'pending', $4, $5) RETURNING *`,
      [customer_id, vendor_id, rider_id || null, total_amount, payment_method]
    );
    const order = orderResult.rows[0];

    // 2. Insert into order_items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, item_name, quantity, price) VALUES ($1, $2, $3, $4)`,
        [order.id, item.item_name, item.quantity, item.price]
      );
    }

    // 3. Initialize an entry in deliveries if a rider is already assigned
    let delivery = null;
    if (rider_id && delivery_location) {
      const deliveryResult = await client.query(
        `INSERT INTO deliveries (order_id, rider_id, current_location) 
         VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)) RETURNING *`,
        [order.id, rider_id, delivery_location.lng, delivery_location.lat]
      );
      delivery = deliveryResult.rows[0];
    }

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      data: {
        order,
        delivery
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
const getOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    // 1. Get the order
    const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    const order = orderResult.rows[0];

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // 2. Get order items
    const itemsResult = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
    
    // 3. Get active delivery details if available
    const deliveryResult = await pool.query(
      `SELECT id, rider_id, updated_at, 
              ST_Y(current_location::geometry) as lat, 
              ST_X(current_location::geometry) as lng 
       FROM deliveries WHERE order_id = $1`, 
      [orderId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        ...order,
        items: itemsResult.rows,
        delivery: deliveryResult.rows[0] || null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyVendors,
  createOrder,
  getOrderDetails
};
