const multer = require("multer");

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROFILE_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file || !ALLOWED_MIME_TYPES.has(String(file.mimetype || "").toLowerCase())) {
      return cb(new Error("Only JPG, PNG, WEBP, or GIF images are allowed."));
    }
    return cb(null, true);
  },
});

module.exports = profileUpload;
