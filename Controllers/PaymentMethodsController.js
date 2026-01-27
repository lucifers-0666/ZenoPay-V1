const ZenoPayUser = require("../Models/ZenoPayUser");

// GET: Payment Methods Page
const getPaymentMethodsPage = async (req, res) => {
  try {
    // TEMPORARY: Bypass auth for design review
    if (!req.session.isLoggedIn || !req.session.user) {
      req.session.isLoggedIn = true;
      req.session.user = { ZenoPayID: "ZP-DEMO2024" };
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    // Mock payment methods data (replace with database queries)
    const savedCards = [
      {
        id: "card_1",
        brand: "visa",
        last4: "4242",
        cardholderName: user.FullName,
        expiryMonth: "12",
        expiryYear: "2026",
        isDefault: true,
      },
      {
        id: "card_2",
        brand: "mastercard",
        last4: "5555",
        cardholderName: user.FullName,
        expiryMonth: "08",
        expiryYear: "2025",
        isDefault: false,
      },
    ];

    const savedBankAccounts = [
      {
        id: "bank_1",
        bankName: "HDFC Bank",
        accountNumber: "XXXX1234",
        accountType: "Savings",
        isVerified: true,
        isDefault: false,
      },
      {
        id: "bank_2",
        bankName: "ICICI Bank",
        accountNumber: "XXXX5678",
        accountType: "Checking",
        isVerified: true,
        isDefault: false,
      },
    ];

    const connectedWallets = [
      {
        id: "wallet_1",
        name: "Google Pay",
        type: "google_pay",
        email: user.Email,
        isConnected: true,
      },
      {
        id: "wallet_2",
        name: "Apple Pay",
        type: "apple_pay",
        isConnected: false,
      },
    ];

    res.render("payment-methods", {
      pageTitle: "Payment Methods",
      isLoggedIn: true,
      user,
      savedCards,
      savedBankAccounts,
      connectedWallets,
    });
  } catch (error) {
    console.error("Error loading payment methods page:", error);
    res.status(500).send("Unable to load Payment Methods page");
  }
};

// POST: Set Default Payment Method
const setDefaultPaymentMethod = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { methodId, methodType } = req.body;

    if (!methodId || !methodType) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // TODO: Update database to set default payment method
    // For now, just acknowledge
    res.json({
      success: true,
      message: `${methodType} set as default`,
      methodId,
    });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    res.status(500).json({ success: false, message: "Failed to set default" });
  }
};

// POST: Remove Payment Method
const removePaymentMethod = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { methodId, methodType } = req.body;

    if (!methodId || !methodType) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // TODO: Remove from database
    // For now, just acknowledge
    res.json({
      success: true,
      message: `${methodType} removed successfully`,
      methodId,
    });
  } catch (error) {
    console.error("Error removing payment method:", error);
    res.status(500).json({ success: false, message: "Failed to remove method" });
  }
};

// POST: Disconnect Wallet
const disconnectWallet = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { walletId } = req.body;

    if (!walletId) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // TODO: Disconnect wallet in database
    res.json({
      success: true,
      message: "Wallet disconnected successfully",
      walletId,
    });
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    res.status(500).json({ success: false, message: "Failed to disconnect wallet" });
  }
};

module.exports = {
  getPaymentMethodsPage,
  setDefaultPaymentMethod,
  removePaymentMethod,
  disconnectWallet,
};
