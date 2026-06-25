const ParcelOrder = require('../models/ParcelOrder');
const SystemConfig = require('../models/SystemConfig');
const crypto = require('crypto');

const generateOrderNumber = () => {
  return 'PAR-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
};

// @desc    Calculate parcel fare
// @route   POST /api/parcels/calculate-fare
// @access  Private/Customer
const calculateFare = async (req, res, next) => {
  try {
    const { distance_km, delivery_speed } = req.body;

    if (!distance_km || distance_km <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid distance_km is required' });
    }

    if (!['standard', 'express'].includes(delivery_speed)) {
      return res.status(400).json({ status: 'error', message: 'Invalid delivery_speed' });
    }

    // Fetch pricing configs
    const configs = await SystemConfig.getAll();
    const baseFare = configs.parcel_base_fare || 10.00;
    const perKmFee = configs.parcel_per_km_fee || 2.50;
    const serviceFee = configs.parcel_service_fee || 5.00;
    const expressMultiplier = configs.parcel_express_multiplier || 1.50;

    // Calculate total amount
    let totalAmount = baseFare + (distance_km * perKmFee) + serviceFee;
    
    if (delivery_speed === 'express') {
      totalAmount = totalAmount * expressMultiplier;
    }

    // Estimate time (rough estimate: 3 mins per km + 10 mins pickup)
    const estimatedTimeMins = Math.ceil(10 + (distance_km * 3));

    res.status(200).json({
      status: 'success',
      message: 'Fare calculated successfully',
      data: {
        distance_km,
        delivery_speed,
        base_fare: baseFare.toFixed(2),
        distance_fare: (distance_km * perKmFee).toFixed(2),
        service_fee: serviceFee.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        estimated_time_mins: estimatedTimeMins
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create parcel order
// @route   POST /api/parcels
// @access  Private/Customer
const createParcelOrder = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const {
      pickup_location,
      dropoff_location,
      distance_km,
      item_description,
      item_value,
      item_photo_url,
      recipient_name,
      recipient_phone,
      delivery_speed,
      payment_method
    } = req.body;

    // Validation
    if (!pickup_location || !pickup_location.lat || !pickup_location.lng) {
      return res.status(400).json({ status: 'error', message: 'pickup_location is required' });
    }
    if (!dropoff_location || !dropoff_location.lat || !dropoff_location.lng) {
      return res.status(400).json({ status: 'error', message: 'dropoff_location is required' });
    }
    if (!distance_km || !item_description || !item_value || !recipient_name || !recipient_phone || !payment_method) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Re-calculate the exact fare on the backend to prevent tampering
    const configs = await SystemConfig.getAll();
    const baseFare = configs.parcel_base_fare || 10.00;
    const perKmFee = configs.parcel_per_km_fee || 2.50;
    const serviceFee = configs.parcel_service_fee || 5.00;
    const expressMultiplier = configs.parcel_express_multiplier || 1.50;

    let totalAmount = baseFare + (distance_km * perKmFee) + serviceFee;
    if (delivery_speed === 'express') {
      totalAmount = totalAmount * expressMultiplier;
    }

    const estimatedTimeMins = Math.ceil(10 + (distance_km * 3));

    const order_number = generateOrderNumber();

    const orderData = {
      order_number,
      customer_id: customerId,
      pickup_location,
      dropoff_location,
      distance_km,
      estimated_time_mins: estimatedTimeMins,
      item_description,
      item_value,
      item_photo_url,
      recipient_name,
      recipient_phone,
      delivery_speed: delivery_speed || 'standard',
      total_amount: totalAmount,
      payment_method
    };

    const newOrder = await ParcelOrder.create(orderData);

    res.status(201).json({
      status: 'success',
      message: 'Parcel order created successfully',
      data: newOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's parcel orders
// @route   GET /api/parcels/me
// @access  Private/Customer
const getMyParcels = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const parcels = await ParcelOrder.findByCustomerId(customerId);

    res.status(200).json({
      status: 'success',
      message: 'Parcels retrieved successfully',
      data: parcels
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get parcel details
// @route   GET /api/parcels/:id
// @access  Private
const getParcelDetails = async (req, res, next) => {
  try {
    const parcelId = req.params.id;
    const parcel = await ParcelOrder.findById(parcelId);

    if (!parcel) {
      return res.status(404).json({ status: 'error', message: 'Parcel order not found' });
    }

    // Verify ownership or access
    if (req.user.role === 'customer' && parcel.customer_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }
    if (req.user.role === 'rider' && parcel.rider_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Parcel details retrieved successfully',
      data: parcel
    });
  } catch (error) {
    next(error);
  }
};

const JobDecline = require('../models/JobDecline');
const ParcelDelivery = require('../models/ParcelDelivery');

// @desc    Accept an unassigned parcel job (Targeted Dispatch)
// @route   POST /api/parcels/:id/accept-job
const acceptJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can accept jobs' });
    }

    const parcelId = req.params.id;
    const riderId = req.user.id;
    const { lat, lng } = req.body; // Rider's current location

    if (!lat || !lng) {
      return res.status(400).json({ status: 'error', message: 'lat and lng are required to accept a job' });
    }

    const parcel = await ParcelOrder.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({ status: 'error', message: 'Parcel order not found' });
    }

    if (parcel.rider_id) {
      return res.status(400).json({ status: 'error', message: 'Parcel has already been assigned to a rider' });
    }

    const updatedParcel = await ParcelOrder.assignRider(parcelId, riderId);
    if (!updatedParcel) {
      return res.status(400).json({ status: 'error', message: 'Failed to assign rider. Job might have been taken.' });
    }

    // Initialize delivery tracking
    const delivery = await ParcelDelivery.create(parcelId, riderId, lat, lng);

    res.status(200).json({
      status: 'success',
      message: 'Parcel job accepted successfully',
      data: { parcel: updatedParcel, delivery }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline an unassigned parcel job (Targeted Dispatch)
// @route   POST /api/parcels/:id/decline-job
const declineJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Only riders can decline jobs' });
    }

    const parcelId = req.params.id;
    const riderId = req.user.id;

    const parcel = await ParcelOrder.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({ status: 'error', message: 'Parcel order not found' });
    }

    await JobDecline.recordDecline(parcel.order_number, riderId);

    res.status(200).json({
      status: 'success',
      message: 'Parcel job declined successfully'
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get rider's parcel deliveries history
// @route   GET /api/parcels/rider-history
// @access  Private/Rider
const getRiderParcelDeliveries = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }
    
    const deliveries = await ParcelOrder.findRiderDeliveries(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Rider parcel deliveries retrieved successfully',
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateFare,
  createParcelOrder,
  getMyParcels,
  getParcelDetails,
  getRiderParcelDeliveries,
  acceptJob,
  declineJob
};
