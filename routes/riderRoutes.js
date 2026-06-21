const express = require('express');
const router = express.Router();
const { submitRiderRegistration, getMyRiderProfile } = require('../controllers/riderController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/register')
  .post(protect, submitRiderRegistration);

router.route('/me')
  .get(protect, getMyRiderProfile);

module.exports = router;
