const express = require("express");
const multer = require("multer");
const ProfileController = require("../Controllers/ProfileController");
const profileUpload = require("../Middleware/profileUpload");

const router = express.Router();

router.get("/", ProfileController.getProfile);
router.post("/update", ProfileController.updateProfile);
router.post("/photo", (req, res, next) => {
  profileUpload.single("profilePicture")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Profile image exceeds maximum size of 5 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err?.message || "Invalid profile image upload.",
    });
  });
}, ProfileController.updateProfilePhoto);
router.get("/kyc", ProfileController.getKYC);
router.post("/kyc", ProfileController.submitKYC);

module.exports = router;
