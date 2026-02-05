// ═══════════════════════════════════════════════════════════════════════════════════════════
// ADMIN PAYMENT GATEWAY CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════════════════

// GET Payment Gateway Settings Page
const getPaymentGatewaySettings = async (req, res) => {
  try {
    res.render("settings/admin-payment-gateway", {
      user: req.session.user,
      pageTitle: "Admin Payment Gateway Settings - ZenoPay"
    });
  } catch (error) {
    console.error("Error loading payment gateway settings:", error);
    res.status(500).send("Error loading payment gateway settings");
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

    // TODO: Implement actual gateway connection test
    // For now, simulate a successful test
    setTimeout(() => {
      res.json({
        success: true,
        message: "Gateway connection successful",
        environment: environment || "test"
      });
    }, 1500);

  } catch (error) {
    console.error("Gateway test error:", error);
    res.status(500).json({
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

    // TODO: Store configuration in database
    // For now, return success response
    res.json({
      success: true,
      message: "Payment gateway settings saved successfully",
      data: {
        apiKey: apiKey.substring(0, 10) + "...", // Masked for security
        merchantId,
        environment,
        paymentMethods,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error("Error saving gateway settings:", error);
    res.status(500).json({
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

    // Calculate total fee
    const totalFee = parseFloat(gatewayFee) + parseFloat(platformFee);

    // TODO: Update fees in database
    res.json({
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
    res.status(500).json({
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

    // TODO: Update payment method status in database
    res.json({
      success: true,
      message: `${method} payment method ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        method,
        enabled,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Error toggling payment method:", error);
    res.status(500).json({
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

    // TODO: Save advanced settings to database
    res.json({
      success: true,
      message: "Advanced settings updated successfully",
      data: {
        autoSettlement,
        settlementFrequency,
        paymentRetry,
        maxRetryAttempts,
        duplicateCheck,
        checkWindow,
        paymentTimeout,
        timeoutDuration,
        threeDSecure,
        internationalPayments,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Error updating advanced settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update advanced settings",
      error: error.message
    });
  }
};

// GET Payment Gateway Configuration
const getPaymentGatewayConfig = async (req, res) => {
  try {
    // TODO: Fetch actual configuration from database
    // For now, return mock data
    res.json({
      success: true,
      data: {
        apiKey: "test_api_key_1234567890",
        merchantId: "MERCHANT_12345",
        environment: "test",
        webhookUrl: "https://zenopay.com/webhooks/payment",
        paymentMethods: {
          upi: { enabled: true, fee: 1.5 },
          cards: { enabled: true, fee: 2.5 },
          netbanking: { enabled: false, fee: 2.5 },
          wallets: { enabled: true, fee: 1.5 },
          emi: { enabled: false, fee: 3.0 }
        },
        advancedSettings: {
          autoSettlement: true,
          settlementFrequency: "daily",
          paymentRetry: true,
          maxRetryAttempts: 3,
          duplicateCheck: true,
          checkWindow: 5,
          paymentTimeout: true,
          timeoutDuration: 30,
          threeDSecure: true,
          internationalPayments: false
        }
      }
    });

  } catch (error) {
    console.error("Error fetching gateway config:", error);
    res.status(500).json({
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
