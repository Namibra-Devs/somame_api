// @desc    Upload an image
// @route   POST /api/upload
// @access  Private (or Public depending on how you want it, normally we protect this)
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Please upload a file' });
    }

    // req.file will contain the location (URL) returned by MinIO/S3
    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        url: req.file.location, // This is the S3 object URL
        key: req.file.key // The path within the bucket
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage
};
