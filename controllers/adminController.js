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
      return res.status(400).json({ status: 'error', message: 'Invalid configuration payload. Must be an object.' });
    }

    await SystemConfig.update(configs);
    
    // Fetch updated
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

module.exports = {
  getConfigs,
  updateConfigs
};
