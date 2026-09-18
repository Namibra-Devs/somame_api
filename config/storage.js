const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

// Configure S3 client for MinIO
const s3Config = new S3Client({
  region: 'us-east-1', // Required by AWS SDK but ignored by MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  endpoint: `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  forcePathStyle: true, // Required for MinIO
});

const upload = multer({
  storage: multerS3({
    s3: s3Config,
    bucket: process.env.MINIO_BUCKET || 'somame',
    acl: 'public-read', // Ensure the bucket policy supports public access
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Generate a unique filename using timestamp and a random string, preserving original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'uploads/' + uniqueSuffix + ext);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    // Check file type
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: Images Only! (jpeg, jpg, png, webp, gif)'));
  }
});

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

const deleteFileFromMinio = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const bucket = process.env.MINIO_BUCKET || 'somame';
    
    // We need to extract the object key from the full URL.
    // E.g., http://localhost:9000/somame/uploads/1628100123456.png -> uploads/1628100123456.png
    // The bucket name is part of the URL path in MinIO
    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname; // e.g., /somame/uploads/1628100123456.png
    
    // Split by bucket name and remove leading slash
    const parts = pathname.split(`/${bucket}/`);
    if (parts.length < 2) {
      console.log('Could not extract key from URL:', fileUrl);
      return;
    }
    
    const key = parts[1]; // e.g., uploads/1628100123456.png

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Config.send(command);
    console.log(`Successfully deleted ${key} from MinIO`);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
  }
};

module.exports = {
  upload,
  deleteFileFromMinio
};
