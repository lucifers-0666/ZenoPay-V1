const express = require("express");
const router = express.Router();

const MerchantController = require("../Controllers/MerchantController");

// Merchant tools in user app
router.get("/create-api-key", MerchantController.getApiKeyPage);
router.post("/api/merchant/register", MerchantController.registerMerchant);
router.post("/api/merchant/regenerate-keys", MerchantController.regenerateApiKeys);
router.post("/api/merchant/settings", MerchantController.updateMerchantSettings);
router.get("/api/merchant/stats", MerchantController.getMerchantStats);

module.exports = router;
