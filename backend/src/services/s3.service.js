// backend/src/services/s3.service.js
const { S3Client } = require('@aws-sdk/client-s3');
const multer       = require('multer');
const multerS3     = require('multer-s3');
 
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
 
// Multer middleware that streams directly to S3
// Use in route: router.post('/listings', upload.array('images', 5), controller.create)
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Unique filename: listings/1735689600000-photo.jpg
      cb(null, `listings/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB max per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});
 
module.exports = { upload, s3 };
