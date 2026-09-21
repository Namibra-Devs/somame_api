const RiderProfile = require('../models/RiderProfile');
const User = require('../models/User');
const RiderSession = require('../models/RiderSession');
const RiderEarning = require('../models/RiderEarning');
const { deleteFileFromMinio } = require('../config/storage');

// @desc    Submit rider registration/profile
// @route   POST /api/riders/register
// @access  Private (Rider)
const submitRiderRegistration = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Only users with the rider role can register a rider profile' });
    }

    let {
      first_name,
      last_name,
      date_of_birth,
      vehicle_type,
      id_document_type,
      id_front_image_url,
      id_back_image_url,
      license_front_image_url,
      license_back_image_url,
      road_worthy_image_url,
      insurance_image_url,
      selfie_image_url
    } = req.body;

    if (req.files) {
      if (req.files['id_front']) id_front_image_url = req.files['id_front'][0].location;
      if (req.files['id_back']) id_back_image_url = req.files['id_back'][0].location;
      if (req.files['license_front']) license_front_image_url = req.files['license_front'][0].location;
      if (req.files['license_back']) license_back_image_url = req.files['license_back'][0].location;
      if (req.files['road_worthy']) road_worthy_image_url = req.files['road_worthy'][0].location;
      if (req.files['insurance']) insurance_image_url = req.files['insurance'][0].location;
      if (req.files['selfie']) selfie_image_url = req.files['selfie'][0].location;
    }

    // Basic Validation
    if (!first_name || !last_name) {
      return res.status(400).json({ status: 'error', message: 'First name and last name are required' });
    }

    if (!vehicle_type || !['motorbike', 'car'].includes(vehicle_type)) {
      return res.status(400).json({ status: 'error', message: 'Valid vehicle type is required (motorbike or car)' });
    }

    if (!id_document_type || !['ghana_card', 'passport'].includes(id_document_type)) {
      return res.status(400).json({ status: 'error', message: 'Valid ID document type is required (ghana_card or passport)' });
    }

    // 1. Update User table with first and last name
    await User.updateProfile(userId, { first_name, last_name });

    // Fetch existing profile to delete old images if they have changed
    const existingProfile = await RiderProfile.findByUserId(userId);
    if (existingProfile) {
      const imageFields = [
        'id_front_image_url', 'id_back_image_url', 'license_front_image_url',
        'license_back_image_url', 'road_worthy_image_url', 'insurance_image_url',
        'selfie_image_url'
      ];
      
      const incomingData = {
        id_front_image_url, id_back_image_url, license_front_image_url,
        license_back_image_url, road_worthy_image_url, insurance_image_url,
        selfie_image_url
      };

      for (const field of imageFields) {
        if (incomingData[field] && existingProfile[field] && incomingData[field] !== existingProfile[field]) {
          await deleteFileFromMinio(existingProfile[field]);
        }
      }
    }

    // 2. Upsert Rider Profile
    const profileData = {
      user_id: userId,
      date_of_birth,
      vehicle_type,
      id_document_type,
      id_front_image_url,
      id_back_image_url,
      license_front_image_url,
      license_back_image_url,
      road_worthy_image_url,
      insurance_image_url,
      selfie_image_url,
      verification_status: 'pending' // Reset to pending if they update docs
    };

    const profile = await RiderProfile.createOrUpdate(profileData);

    res.status(200).json({
      status: 'success',
      message: 'Rider registration submitted successfully. Your profile is pending verification.',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in rider profile
// @route   GET /api/riders/me
// @access  Private (Rider)
const getMyRiderProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const profile = await RiderProfile.findByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Rider profile not found. Please complete registration.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Rider profile retrieved successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update online/offline status
// @route   PUT /api/riders/me/status
// @access  Private (Rider)
const updateStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const { is_online } = req.body;
    if (typeof is_online !== 'boolean') {
      return res.status(400).json({ status: 'error', message: 'is_online must be a boolean' });
    }

    const profile = await RiderProfile.updateStatus(req.user.id, is_online);

    if (is_online) {
      await RiderSession.startSession(req.user.id);
    } else {
      await RiderSession.endSession(req.user.id);
    }

    res.status(200).json({
      status: 'success',
      message: `Rider is now ${is_online ? 'online' : 'offline'}`,
      data: { is_online: profile.is_online }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update rider location
// @route   PUT /api/riders/me/location
// @access  Private (Rider)
const updateLocation = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ status: 'error', message: 'lat and lng are required' });
    }

    const profile = await RiderProfile.updateLocation(req.user.id, lat, lng);
    
    // We could also push to tracking_history here if they are on an active delivery

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Rider Home Summary
// @route   GET /api/riders/me/home
// @access  Private (Rider)
const getHomeSummary = async (req, res, next) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Riders only' });
    }

    const riderId = req.user.id;
    
    // 1. Get Earnings for today
    const earnings = await RiderEarning.getTodayEarnings(riderId);
    
    // 2. Get Deliveries Count for today
    const deliveriesCount = await RiderEarning.getTodayDeliveriesCount(riderId);
    
    // 3. Get Online Time (minutes)
    const totalOnlineMinutes = await RiderSession.getTodayOnlineMinutes(riderId);
    
    // Format minutes to "Xh Ymin"
    const hours = Math.floor(totalOnlineMinutes / 60);
    const minutes = totalOnlineMinutes % 60;
    const onlineTimeStr = `${hours}h ${minutes}min`;

    // 4. Get Current Status
    const profile = await RiderProfile.findByUserId(riderId);

    res.status(200).json({
      status: 'success',
      message: "Today's summary retrieved successfully",
      data: {
        is_online: profile ? profile.is_online : false,
        today_summary: {
          earning: parseFloat(earnings),
          deliveries: deliveriesCount,
          online_time: onlineTimeStr,
          online_time_minutes: totalOnlineMinutes
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRiderRegistration,
  getMyRiderProfile,
  updateStatus,
  updateLocation,
  getHomeSummary
};
