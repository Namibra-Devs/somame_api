const RiderProfile = require('../models/RiderProfile');
const User = require('../models/User');

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

    const {
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

module.exports = {
  submitRiderRegistration,
  getMyRiderProfile
};
