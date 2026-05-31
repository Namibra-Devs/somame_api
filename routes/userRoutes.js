const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updatePassword, updateUserStatus } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.route('/password')
  .put(protect, updatePassword);

// Admin only route
router.route('/:id/status')
  .patch(protect, updateUserStatus);

module.exports = router;
