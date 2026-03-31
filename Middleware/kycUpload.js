const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/kyc directory exists
const kyc_dir = path.join(__dirname, "../public/uploads/kyc");
if (!fs.existsSync(kyc_dir)) {
  fs.mkdirSync(kyc_dir, { recursive: true });
}

// Configure storage for KYC documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, kyc_dir);
  },
  filename: (req, file, cb) => {
    const userId = req.session?.user?.ZenoPayID || req.user?._id || "unknown";
    const timestamp = Date.now();
    
    // Determine file type based on fieldname
    let fileType = file.fieldname; // panCardImage, aadhaarFrontImage, aadhaarBackImage
    
    // Generate filename: userId_panCardImage_1234567890.jpg
    const filename = `${userId}_${fileType}_${timestamp}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, filename);
  },
});

// File filter to accept only JPG/PNG
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png"];
  const allowedExtensions = [".jpg", ".jpeg", ".png"];
  
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG and PNG are allowed."), false);
  }
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Invalid file extension. Only .jpg, .jpeg, and .png are allowed."), false);
  }
  
  cb(null, true);
};

// Create multer upload instance for KYC
const kycUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
});

// Middleware to handle KYC file uploads
const uploadKYC = (req, res, next) => {
  // Handle 3 file uploads: panCardImage, aadhaarFrontImage, aadhaarBackImage
  kycUpload.fields([
    { name: "panCardImage", maxCount: 1 },
    { name: "aadhaarFrontImage", maxCount: 1 },
    { name: "aadhaarBackImage", maxCount: 1 },
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "FILE_TOO_LARGE") {
        return res.status(400).json({ success: false, message: "File too large. Maximum size is 2MB." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: "Too many files uploaded." });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    
    // Check if all required files are present
    if (!req.files?.panCardImage || !req.files?.aadhaarFrontImage || !req.files?.aadhaarBackImage) {
      // Clean up uploaded files if validation fails
      const files = [
        ...(req.files?.panCardImage || []),
        ...(req.files?.aadhaarFrontImage || []),
        ...(req.files?.aadhaarBackImage || []),
      ];
      
      files.forEach((file) => {
        if (file.path) {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        }
      });
      
      return res.status(400).json({ 
        success: false, 
        message: "All three documents are required: PAN card, Aadhaar front, and Aadhaar back." 
      });
    }
    
    next();
  });
};

module.exports = uploadKYC;
