const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "public", "Uploads", "merchant-docs");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeBase = (path.basename(file.originalname || "document", ext) || "document")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40);
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(String(file.mimetype || "").toLowerCase())) {
    return cb(new Error("Only PDF, JPG, JPEG and PNG files are allowed"));
  }
  return cb(null, true);
};

const merchantUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = merchantUpload;
