const express = require("express");
const router = express.Router();

const MerchantController = require("../Controllers/MerchantController");
const merchantUpload = require("../Middleware/merchantUpload");
const { isAuthenticatedApi } = require("../Middleware/authGuards");

// Merchant tools in user app
router.get("/create-api-key", MerchantController.getApiKeyPage);
router.post(
	"/api/merchant/register",
	isAuthenticatedApi,
	merchantUpload.fields([
		{ name: "gstCertificate", maxCount: 1 },
		{ name: "panCard", maxCount: 1 },
		{ name: "bankStatement", maxCount: 1 },
		{ name: "businessLicense", maxCount: 1 },
	]),
	MerchantController.registerMerchant
);
router.post("/api/merchant/regenerate-keys", isAuthenticatedApi, MerchantController.regenerateApiKeys);
router.post("/api/merchant/settings", isAuthenticatedApi, MerchantController.updateMerchantSettings);
router.get("/api/merchant/stats", isAuthenticatedApi, MerchantController.getMerchantStats);

module.exports = router;
