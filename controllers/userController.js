const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get logged in user profile
// @route   GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({ status: 'success', message: 'User profile retrieved successfully', data: user });
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

    res.status(200).json({ status: 'success', message: 'User profile updated successfully', data: user });
  } catch (error) {
    if (error.code === '23505') { // unique violation for email
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }
    next(error);
  }
};

// @desc    Update logged in user password
// @route   PUT /api/users/password
const updatePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ status: 'error', message: 'Please provide both old and new passwords' });
    }

    const authData = await User.getAuthDataById(req.user.id);
    
    // Verify old password
    const isMatch = await bcrypt.compare(old_password, authData.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Incorrect old password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const new_password_hash = await bcrypt.hash(new_password, salt);

    await User.updatePassword(req.user.id, new_password_hash);

    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user active status (Admin only)
// @route   PATCH /api/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
    }

    const { is_active } = req.body;
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ status: 'error', message: 'is_active must be a boolean' });
    }

    const user = await User.updateUserStatus(req.params.id, is_active);

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.status(200).json({ status: 'success', message: 'User status updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  updateUserStatus
};
