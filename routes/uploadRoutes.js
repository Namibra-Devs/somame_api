const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { upload } = require('../config/storage');
const { protect } = require('../middlewares/authMiddleware');

// Route: POST /api/upload
// Description: Upload a single image file. Requires authentication.
// The form field name for the file must be "image"
router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;
