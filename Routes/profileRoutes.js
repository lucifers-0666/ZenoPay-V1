const express = require("express");
const ProfileController = require("../Controllers/ProfileController");

const router = express.Router();

router.get("/", ProfileController.getProfile);
router.post("/update", ProfileController.updateProfile);
router.get("/kyc", ProfileController.getKYC);
router.post("/kyc", ProfileController.submitKYC);

module.exports = router;
