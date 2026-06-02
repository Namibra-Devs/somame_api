const express = require('express');
const router = express.Router();
const { getConfigs, updateConfigs } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/configs')
  .get(getConfigs) // Public or protected depending on needs, but let's say public to calculate fares on frontend? No, the calculation is done on backend. 
  .put(protect, admin, updateConfigs); // Protected admin route

module.exports = router;
