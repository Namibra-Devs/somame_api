const User = require('../models/User');

// @desc    Get logged in user profile
// @route   GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged in user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, email } = req.body;

    const user = await User.updateProfile(req.user.id, { first_name, last_name, email });
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    if (error.code === '23505') { // unique violation for email
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
