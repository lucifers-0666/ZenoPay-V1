const Merchant = require("../Models/Merchant");
const ZenoPayUser = require("../Models/ZenoPayUser");

// Get API Key Management Page
const getApiKeyPage = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";

    // Check if merchant already exists
    const merchant = await Merchant.findOne({ ZenoPayId: zenoPayId });

    res.render("create-api-key", {
      pageTitle: "API Integration",
      currentPage: "api-key",
      user: req.session.user,
      qrCode: req.session.qrCode || null,
      isLoggedIn: true,
      merchant: merchant,
      hasMerchant: !!merchant,
    });
  } catch (error) {
    console.error("Error fetching merchant data:", error);
    res.status(500).render("create-api-key", {
      pageTitle: "API Integration",
      currentPage: "api-key",
      user: req.session.user,
      qrCode: req.session.qrCode || null,
      isLoggedIn: true,
      merchant: null,
      hasMerchant: false,
      error: "Failed to load merchant data",
    });
  }
};

// Create/Register Merchant
const registerMerchant = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";

    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({ ZenoPayId: zenoPayId });
    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: "You are already registered as a merchant",
      });
    }

    // Create new merchant
    const merchant = new Merchant({
      ZenoPayId: zenoPayId,
      BusinessName: businessName,
      BusinessType: businessType,
      BusinessWebsite: businessWebsite,
      BusinessDescription: businessDescription,
    });

    // Generate API keys
    merchant.generateApiKey();

    await merchant.save();

    res.json({
      success: true,
      message: "Merchant registered successfully",
      merchant: {
        businessName: merchant.BusinessName,
        apiKey: merchant.ApiKey,
        secretKey: merchant.SecretKey,
      },
    });
  } catch (error) {
    console.error("Error registering merchant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register merchant",
      error: error.message,
    });
  }
};

// Regenerate API Keys
const regenerateApiKeys = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";

    const merchant = await Merchant.findOne({ ZenoPayId: zenoPayId });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    await merchant.regenerateApiKey();

    res.json({
      success: true,
      message: "API keys regenerated successfully",
      apiKey: merchant.ApiKey,
      secretKey: merchant.SecretKey,
    });
  } catch (error) {
    console.error("Error regenerating API keys:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate API keys",
    });
  }
};

// Update Merchant Settings
const updateMerchantSettings = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const { webhookUrl, callbackUrl, allowedDomains } = req.body;

    const merchant = await Merchant.findOne({ ZenoPayId: zenoPayId });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    if (webhookUrl !== undefined) merchant.WebhookUrl = webhookUrl;
    if (callbackUrl !== undefined) merchant.CallbackUrl = callbackUrl;
    if (allowedDomains !== undefined) {
      merchant.AllowedDomains = Array.isArray(allowedDomains)
        ? allowedDomains
        : allowedDomains.split(",").map((d) => d.trim());
    }

    await merchant.save();

    res.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating merchant settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

// Get Merchant Statistics
const getMerchantStats = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";

    const merchant = await Merchant.findOne({ ZenoPayId: zenoPayId });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    res.json({
      success: true,
      stats: {
        transactionCount: merchant.TransactionCount,
        totalVolume: merchant.TotalVolume,
        lastTransactionDate: merchant.LastTransactionDate,
        status: merchant.Status,
      },
    });
  } catch (error) {
    console.error("Error fetching merchant stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

module.exports = {
  getApiKeyPage,
  registerMerchant,
  regenerateApiKeys,
  updateMerchantSettings,
  getMerchantStats,
};
