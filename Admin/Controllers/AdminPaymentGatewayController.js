// ═══════════════════════════════════════════════════════════════════════════════════════════
// ADMIN PAYMENT GATEWAY CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════════════════

const PaymentGatewaySettings = require("../../Models/PaymentGatewaySettings");

const normalizeMethods = (methods = {}) => {
  const base = {
    upi: { enabled: true, fee: 1.5, platformFee: 0.5 },
    cards: { enabled: true, fee: 2.5, platformFee: 0.5 },
    netbanking: { enabled: false, fee: 2.5, platformFee: 0.5 },
    wallets: { enabled: true, fee: 1.5, platformFee: 0.5 },
    emi: { enabled: false, fee: 3.0, platformFee: 0.5 },
  };

  Object.keys(base).forEach((key) => {
    if (methods[key]) {
      base[key] = {
        enabled: parseBoolean(methods[key].enabled),
        fee: Number(methods[key].fee ?? base[key].fee),
        platformFee: Number(methods[key].platformFee ?? base[key].platformFee),
      };
    }
  });

  return base;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return Boolean(value);
};

// GET Payment Gateway Settings Page
const getPaymentGatewaySettings = async (req, res) => {
  try {
    await PaymentGatewaySettings.getSettings();
    res.locals.adminPage = "settings";
    return res.render("admin/settings/admin-payment-gateway", {
      user: req.session.user,
      page: "settings",
      adminPage: "settings",
      pageTitle: "Admin Payment Gateway Settings - ZenoPay"
    });
  } catch (error) {
    console.error("Error loading payment gateway settings:", error);
    return res.status(500).send("Error loading payment gateway settings");
  }
};

// POST Test Gateway Connection
const testGatewayConnection = async (req, res) => {
  try {
    const { apiKey, secretKey, merchantId, environment } = req.body;

    // Validate required fields
    if (!apiKey || !secretKey || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Missing required credentials"
      });
    }

    const env = environment === "live" ? "live" : "test";
    return res.json({
      success: true,
      message: `Gateway credentials look valid for ${env.toUpperCase()} environment`,
      environment: env,
      checkedAt: new Date(),
    });

  } catch (error) {
    console.error("Gateway test error:", error);
    return res.status(500).json({
      success: false,
      message: "Connection test failed",
      error: error.message
    });
  }
};

// POST Save Payment Gateway Configuration
const savePaymentGatewayConfig = async (req, res) => {
  try {
    const {
      apiKey,
      secretKey,
      merchantId,
      webhookUrl,
      successUrl,
      failureUrl,
      environment,
      paymentMethods,
      transactionFees,
      advancedSettings
    } = req.body;

    // Validate required fields
    if (!apiKey || !secretKey || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Missing required configuration fields"
      });
    }

    const settings = await PaymentGatewaySettings.getSettings();

    settings.apiKey = String(apiKey).trim();
    settings.secretKey = String(secretKey).trim();
    settings.merchantId = String(merchantId).trim();
    settings.webhookUrl = String(webhookUrl || "").trim();
    settings.successUrl = String(successUrl || "").trim();
    settings.failureUrl = String(failureUrl || "").trim();
    settings.environment = environment === "live" ? "live" : "test";
    settings.paymentMethods = normalizeMethods(paymentMethods || settings.paymentMethods || {});

    if (advancedSettings && typeof advancedSettings === "object") {
      settings.advancedSettings = {
        ...settings.advancedSettings,
        ...advancedSettings,
      };
    }

    if (transactionFees && typeof transactionFees === "object") {
      Object.keys(settings.paymentMethods).forEach((method) => {
        if (transactionFees[method]) {
          settings.paymentMethods[method].fee = Number(transactionFees[method].gatewayFee ?? settings.paymentMethods[method].fee);
          settings.paymentMethods[method].platformFee = Number(transactionFees[method].platformFee ?? settings.paymentMethods[method].platformFee);
        }
      });
    }

    await settings.save();

    return res.json({
      success: true,
      message: "Payment gateway settings saved successfully",
      data: {
        apiKey: settings.apiKey ? `${settings.apiKey.substring(0, 10)}...` : "",
        merchantId: settings.merchantId,
        environment: settings.environment,
        paymentMethods: settings.paymentMethods,
        lastUpdated: settings.updatedAt,
      }
    });

  } catch (error) {
    console.error("Error saving gateway settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save settings",
      error: error.message
    });
  }
};

// POST Update Transaction Fees
const updateTransactionFees = async (req, res) => {
  try {
    const { paymentMethod, gatewayFee, platformFee } = req.body;

    // Validate input
    if (!paymentMethod || gatewayFee === undefined || platformFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fee information"
      });
    }

    const settings = await PaymentGatewaySettings.getSettings();
    if (!settings.paymentMethods?.[paymentMethod]) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    settings.paymentMethods[paymentMethod].fee = parseFloat(gatewayFee);
    settings.paymentMethods[paymentMethod].platformFee = parseFloat(platformFee);
    await settings.save();

    // Calculate total fee
    const totalFee = parseFloat(gatewayFee) + parseFloat(platformFee);

    return res.json({
      success: true,
      message: "Transaction fees updated successfully",
      data: {
        paymentMethod,
        gatewayFee: parseFloat(gatewayFee),
        platformFee: parseFloat(platformFee),
        totalFee: totalFee.toFixed(2)
      }
    });

  } catch (error) {
    console.error("Error updating transaction fees:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update fees",
      error: error.message
    });
  }
};

// POST Toggle Payment Method
const togglePaymentMethod = async (req, res) => {
  try {
    const { method, enabled } = req.body;

    if (!method) {
      return res.status(400).json({
        success: false,
        message: "Payment method not specified"
      });
    }

    const settings = await PaymentGatewaySettings.getSettings();
    if (!settings.paymentMethods?.[method]) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    settings.paymentMethods[method].enabled = parseBoolean(enabled);
    await settings.save();

    return res.json({
      success: true,
      message: `${method} payment method ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        method,
        enabled: parseBoolean(enabled),
        updatedAt: settings.updatedAt,
      }
    });

  } catch (error) {
    console.error("Error toggling payment method:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle payment method",
      error: error.message
    });
  }
};

// POST Update Advanced Settings
const updateAdvancedSettings = async (req, res) => {
  try {
    const {
      autoSettlement,
      settlementFrequency,
      paymentRetry,
      maxRetryAttempts,
      duplicateCheck,
      checkWindow,
      paymentTimeout,
      timeoutDuration,
      threeDSecure,
      internationalPayments
    } = req.body;

    const settings = await PaymentGatewaySettings.getSettings();
    settings.advancedSettings = {
      ...settings.advancedSettings,
      autoSettlement: parseBoolean(autoSettlement),
      settlementFrequency: settlementFrequency || settings.advancedSettings.settlementFrequency,
      paymentRetry: parseBoolean(paymentRetry),
      maxRetryAttempts: Number(maxRetryAttempts ?? settings.advancedSettings.maxRetryAttempts),
      duplicateCheck: parseBoolean(duplicateCheck),
      checkWindow: Number(checkWindow ?? settings.advancedSettings.checkWindow),
      paymentTimeout: parseBoolean(paymentTimeout),
      timeoutDuration: Number(timeoutDuration ?? settings.advancedSettings.timeoutDuration),
      threeDSecure: parseBoolean(threeDSecure),
      internationalPayments: parseBoolean(internationalPayments),
    };
    await settings.save();

    return res.json({
      success: true,
      message: "Advanced settings updated successfully",
      data: {
        ...settings.advancedSettings,
        updatedAt: settings.updatedAt,
      }
    });

  } catch (error) {
    console.error("Error updating advanced settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update advanced settings",
      error: error.message
    });
  }
};

// GET Payment Gateway Configuration
const getPaymentGatewayConfig = async (req, res) => {
  try {
    const settings = await PaymentGatewaySettings.getSettings();
    return res.json({
      success: true,
      data: {
        apiKey: settings.apiKey || "",
        secretKey: settings.secretKey || "",
        merchantId: settings.merchantId || "",
        environment: settings.environment || "test",
        webhookUrl: settings.webhookUrl || "",
        successUrl: settings.successUrl || "",
        failureUrl: settings.failureUrl || "",
        paymentMethods: settings.paymentMethods || {},
        advancedSettings: settings.advancedSettings || {},
      }
    });

  } catch (error) {
    console.error("Error fetching gateway config:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch configuration",
      error: error.message
    });
  }
};

module.exports = {
  getPaymentGatewaySettings,
  testGatewayConnection,
  savePaymentGatewayConfig,
  updateTransactionFees,
  togglePaymentMethod,
  updateAdvancedSettings,
  getPaymentGatewayConfig
};
