const ZenoPayUser = require("../Models/ZenoPayUser");
const CardToken = require("../Models/CardToken");

const resolveUserIdFromSession = (req) => req?.session?.user?._id || req?.session?.user?.id || null;

const loadActivityLogModel = () => {
  const candidates = ["../Models/UserActivityLog", "../Models/ActivityLog"];

  for (const modelPath of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const model = require(modelPath);
      if (model) return model;
    } catch (error) {
      // Ignore when model does not exist
    }
  }

  return null;
};

// GET: Payment Methods Page
const getPaymentMethodsPage = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    const savedCardsDocs = await CardToken.find({ ZenoPayId: zenoPayId, status: "active" })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    const savedCards = savedCardsDocs.map((card) => ({
      id: String(card._id),
      brand: card.brand || "unknown",
      last4: card.last4 || "0000",
      cardholderName: card.cardholderName || user.FullName,
      expiryMonth: card.expiryMonth || "",
      expiryYear: card.expiryYear || "",
      isDefault: !!card.isDefault,
      provider: card.provider,
    }));

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
    const { methodId, methodType } = req.body;

    if (!methodId || !methodType) {
      return res.status(400).json({ success: false, message: 'methodId and methodType are required' });
    }

    const userId = resolveUserIdFromSession(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await ZenoPayUser.updateOne(
      { _id: userId },
      { $set: { 'paymentMethods.$[].isDefault': false } }
    );

    await ZenoPayUser.updateOne(
      { _id: userId, 'paymentMethods.methodId': methodId, 'paymentMethods.methodType': methodType },
      { $set: { 'paymentMethods.$.isDefault': true } }
    );

    res.json({
      success: true,
      message: 'Default payment method updated',
    });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    res.status(500).json({ success: false, message: "Failed to set default" });
  }
};

// POST: Remove Payment Method
const removePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.body || {};

    if (!methodId) {
      return res.status(400).json({ success: false, message: 'methodId is required' });
    }

    const userId = resolveUserIdFromSession(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await ZenoPayUser.updateOne(
      { _id: userId },
      {
        $pull: {
          paymentMethods: {
            methodId,
          },
        },
      }
    );

    res.json({
      success: true,
      message: 'Payment method removed',
    });
  } catch (error) {
    console.error("Error removing payment method:", error);
    res.status(500).json({ success: false, message: "Failed to remove method" });
  }
};

// POST: Disconnect Wallet
const disconnectWallet = async (req, res) => {
  try {
    const { walletId, methodId: bodyMethodId, methodType: bodyMethodType } = req.body || {};
    const { methodId: paramMethodId, methodType: paramMethodType } = req.params || {};
    const userId = resolveUserIdFromSession(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const methodId = bodyMethodId || paramMethodId || walletId;
    const methodType = bodyMethodType || paramMethodType || "wallet";

    if (!methodId) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const result = await ZenoPayUser.updateOne(
      { _id: userId },
      {
        $pull: {
          paymentMethods: {
            methodId: String(methodId),
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    const ActivityLogModel = loadActivityLogModel();
    if (ActivityLogModel) {
      try {
        await ActivityLogModel.create({
          userId,
          action: "payment_method_disconnected",
          methodId: String(methodId),
          methodType: String(methodType),
          at: new Date(),
        });
      } catch (logError) {
        console.warn("Activity log not saved:", logError.message);
      }
    }

    res.json({
      success: true,
      message: "Wallet disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    res.status(500).json({ success: false, message: "Failed to disconnect wallet" });
  }
};

const disconnectPaymentMethod = disconnectWallet;

module.exports = {
  getPaymentMethodsPage,
  setDefaultPaymentMethod,
  removePaymentMethod,
  disconnectWallet,
  disconnectPaymentMethod,
};
