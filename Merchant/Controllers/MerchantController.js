/**
 * Merchant Controller
 * Handles all merchant dashboard operations
 */

const Merchant = require("../../Models/Merchant");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const TransactionHistory = require("../../Models/TransactionHistory");
const Order = require("../../Models/Order");
const crypto = require("crypto");

// ============ DASHBOARD CONTROLLER ============

const getDashboard = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId }).lean();

    if (!merchant) {
      return res.status(404).json({ success: false, error: "Merchant not found" });
    }

    // Get dashboard overview
    const stats = await getDashboardStats(userId);
    
    res.render("merchant/dashboard", {
      pageTitle: "Merchant Dashboard",
      merchant,
      stats,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDashboardStats = async (userId) => {
  try {
    const merchant = await Merchant.findOne({ UserID: userId });
    const merchantId = merchant?._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    return {
      todayRevenue: await calculateRevenue(merchantId, today),
      monthlyRevenue: await calculateRevenue(merchantId, thisMonth),
      totalTransactions: await TransactionHistory.countDocuments({
        MerchantID: merchantId,
      }),
      totalCustomers: await TransactionHistory.distinct("SenderID", {
        MerchantID: merchantId,
      }).then((ids) => ids.length),
      totalOrders: await Order.countDocuments({ MerchantID: merchantId }),
      // TODO: Payout model missing — implement when Payout feature is built
      pendingPayouts: 0,
      // TODO: Dispute model missing — implement when Dispute feature is built
      openDisputes: 0,
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return {};
  }
};

// ============ TRANSACTIONS ============

const getTransactions = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await TransactionHistory.find({
      MerchantID: merchant._id,
    })
      .sort({ TransactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("SenderID", "ZenoPayID FullName Email")
      .lean();

    const total = await TransactionHistory.countDocuments({
      MerchantID: merchant._id,
    });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: page,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTransactionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });

    const transaction = await TransactionHistory.findOne({
      _id: id,
      MerchantID: merchant._id,
    })
      .populate("SenderID", "ZenoPayID FullName Email")
      .populate("ReceiverID", "ZenoPayID FullName Email");

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, error: "Transaction not found" });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Get transaction details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const refundTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });

    const transaction = await TransactionHistory.findOneAndUpdate(
      {
        _id: id,
        MerchantID: merchant._id,
      },
      {
        Status: "refunded",
        RefundReason: reason,
        RefundDate: new Date(),
      },
      { new: true }
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, error: "Transaction not found" });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Refund transaction error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ SALES & REVENUE ============

const getSalesReport = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });
    const period = req.query.period || "month"; // day, week, month, year

    const transactions = await TransactionHistory.find({
      MerchantID: merchant._id,
      Status: "completed",
    })
      .sort({ TransactionDate: -1 })
      .lean();

    // Group by period
    const grouped = groupByPeriod(transactions, period);

    res.json({
      success: true,
      data: grouped,
      period,
    });
  } catch (error) {
    console.error("Get sales report error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });

    const analytics = {
      totalRevenue: await calculateRevenue(merchant._id),
      averageTransaction: await calculateAverageTransaction(merchant._id),
      transactionCount: await TransactionHistory.countDocuments({
        MerchantID: merchant._id,
      }),
      customerCount: await getUniqueCustomers(merchant._id),
      topProducts: await getTopProducts(merchant._id),
      paymentMethods: await getPaymentMethodStats(merchant._id),
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const exportSalesReport = async (req, res) => {
  try {
    const { format } = req.body; // csv, pdf, excel
    res.json({
      success: true,
      message: `Sales report exported as ${format}`,
    });
  } catch (error) {
    console.error("Export report error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ CUSTOMERS ============

const getCustomers = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const customerIds = await TransactionHistory.distinct("SenderID", {
      MerchantID: merchant._id,
    });

    const customers = await ZenoPayUser.find({ _id: { $in: customerIds } })
      .select("-Password")
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: customers,
      pagination: {
        currentPage: page,
        total: customerIds.length,
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await ZenoPayUser.findById(id).select("-Password").lean();

    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Get customer details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const blockCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const customer = await ZenoPayUser.findByIdAndUpdate(
      id,
      {
        BlockedMerchants: {
          $push: { merchantId: req.session.user._id, reason, date: new Date() },
        },
      },
      { new: true }
    );

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Block customer error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const unblockCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await ZenoPayUser.findByIdAndUpdate(
      id,
      {
        $pull: { BlockedMerchants: { merchantId: req.session.user._id } },
      },
      { new: true }
    );

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Unblock customer error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ PRODUCTS ============

const getProducts = async (req, res) => {
  // TODO: Product feature removed - not applicable to ZenoPay wallet
  return res.status(501).json({ message: "Feature not available" });
};

const createProduct = async (req, res) => {
  // TODO: Product feature removed - not applicable to ZenoPay wallet
  return res.status(501).json({ message: "Feature not available" });
};

const getProductDetails = async (req, res) => {
  // TODO: Product feature removed - not applicable to ZenoPay wallet
  return res.status(501).json({ message: "Feature not available" });
};

const updateProduct = async (req, res) => {
  // TODO: Product feature removed - not applicable to ZenoPay wallet
  return res.status(501).json({ message: "Feature not available" });
};

const deleteProduct = async (req, res) => {
  // TODO: Product feature removed - not applicable to ZenoPay wallet
  return res.status(501).json({ message: "Feature not available" });
};

// ============ ORDERS ============

const getOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });

    const orders = await Order.find({ MerchantID: merchant._id })
      .sort({ CreatedDate: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("Items.ProductID")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { Status: status, UpdatedDate: new Date() },
      { new: true }
    );

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const refundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        Status: "refunded",
        RefundReason: reason,
        RefundDate: new Date(),
      },
      { new: true }
    );

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Refund order error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ DISPUTES ============

const getDisputes = async (req, res) => {
  // TODO: Dispute model missing — implement when Dispute feature is built
  return res.status(501).json({
    success: false,
    error: "Dispute feature is not available yet (model missing)",
  });
};

const getDisputeDetails = async (req, res) => {
  // TODO: Dispute model missing — implement when Dispute feature is built
  return res.status(501).json({
    success: false,
    error: "Dispute feature is not available yet (model missing)",
  });
};

const respondToDispute = async (req, res) => {
  // TODO: Dispute model missing — implement when Dispute feature is built
  return res.status(501).json({
    success: false,
    error: "Dispute feature is not available yet (model missing)",
  });
};

const appealDispute = async (req, res) => {
  // TODO: Dispute model missing — implement when Dispute feature is built
  return res.status(501).json({
    success: false,
    error: "Dispute feature is not available yet (model missing)",
  });
};

// ============ PAYOUTS ============

const getPayouts = async (req, res) => {
  // TODO: Payout model missing — implement when Payout feature is built
  return res.status(501).json({
    success: false,
    error: "Payout feature is not available yet (model missing)",
  });
};

const requestPayout = async (req, res) => {
  // TODO: Payout model missing — implement when Payout feature is built
  return res.status(501).json({
    success: false,
    error: "Payout feature is not available yet (model missing)",
  });
};

const getPayoutDetails = async (req, res) => {
  // TODO: Payout model missing — implement when Payout feature is built
  return res.status(501).json({
    success: false,
    error: "Payout feature is not available yet (model missing)",
  });
};

// ============ API KEYS ============

const getAPIKeys = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId })
      .select("APIKey APISecret")
      .lean();

    res.json({
      success: true,
      data: {
        apiKey: merchant.APIKey ? merchant.APIKey.substring(0, 10) + "..." : null,
        hasSecret: !!merchant.APISecret,
      },
    });
  } catch (error) {
    console.error("Get API keys error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateAPIKey = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId });

    const apiKey = crypto.randomBytes(32).toString("hex");
    const apiSecret = crypto.randomBytes(64).toString("hex");

    merchant.APIKey = apiKey;
    merchant.APISecret = apiSecret;
    merchant.KeyGeneratedDate = new Date();

    await merchant.save();

    res.json({
      success: true,
      data: { apiKey, apiSecret },
      message: "Store your API secret safely. You won't see it again!",
    });
  } catch (error) {
    console.error("Generate API key error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const revokeAPIKey = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOneAndUpdate(
      { UserID: userId },
      { APIKey: null, APISecret: null },
      { new: true }
    );

    res.json({ success: true, message: "API keys revoked" });
  } catch (error) {
    console.error("Revoke API key error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const regenerateAPIKey = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const apiKey = crypto.randomBytes(32).toString("hex");
    const apiSecret = crypto.randomBytes(64).toString("hex");

    const merchant = await Merchant.findOneAndUpdate(
      { UserID: userId },
      {
        APIKey: apiKey,
        APISecret: apiSecret,
        KeyGeneratedDate: new Date(),
      },
      { new: true }
    );

    res.json({
      success: true,
      data: { apiKey, apiSecret },
    });
  } catch (error) {
    console.error("Regenerate API key error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ SETTINGS ============

const getSettings = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId }).lean();

    res.json({ success: true, data: merchant });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const updates = req.body;

    const merchant = await Merchant.findOneAndUpdate(
      { UserID: userId },
      updates,
      { new: true }
    );

    res.json({ success: true, data: merchant });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateBankDetails = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { accountNumber, ifscCode, accountHolder } = req.body;

    const merchant = await Merchant.findOneAndUpdate(
      { UserID: userId },
      {
        BankAccount: {
          AccountNumber: accountNumber,
          IfscCode: ifscCode,
          AccountHolder: accountHolder,
        },
      },
      { new: true }
    );

    res.json({ success: true, data: merchant });
  } catch (error) {
    console.error("Update bank details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCommissionSettings = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { commissionPercentage, autoWithdrawal } = req.body;

    const merchant = await Merchant.findOneAndUpdate(
      { UserID: userId },
      {
        CommissionPercentage: commissionPercentage,
        AutoWithdrawal: autoWithdrawal,
      },
      { new: true }
    );

    res.json({ success: true, data: merchant });
  } catch (error) {
    console.error("Update commission settings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { emailNotifications, smsNotifications, pushNotifications } = req.body;

    const merchant = await Merchant.findOneAndUpdate(
      { UserID: userId },
      {
        Notifications: {
          Email: emailNotifications,
          SMS: smsNotifications,
          Push: pushNotifications,
        },
      },
      { new: true }
    );

    res.json({ success: true, data: merchant });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ REPORTS ============

const getReports = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateReport = async (req, res) => {
  try {
    res.json({ success: true, message: "Report generated" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const exportReport = async (req, res) => {
  try {
    res.json({ success: true, message: "Report exported" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ WEBHOOKS ============

const getWebhooks = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const merchant = await Merchant.findOne({ UserID: userId })
      .select("Webhooks")
      .lean();

    res.json({ success: true, data: merchant.Webhooks || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createWebhook = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { url, events } = req.body;

    const webhook = {
      id: crypto.randomBytes(16).toString("hex"),
      url,
      events,
      createdDate: new Date(),
      active: true,
    };

    const merchant = await Merchant.findOneAndUpdate(
      { UserID: userId },
      { $push: { Webhooks: webhook } },
      { new: true }
    );

    res.json({ success: true, data: webhook });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const testWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    res.json({ success: true, message: "Webhook test sent" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { id } = req.params;

    await Merchant.findOneAndUpdate(
      { UserID: userId },
      { $pull: { Webhooks: { id } } }
    );

    res.json({ success: true, message: "Webhook deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ HELPER FUNCTIONS ============

async function calculateRevenue(merchantId, fromDate = null) {
  let query = { MerchantID: merchantId, Status: "completed" };
  if (fromDate) {
    query.TransactionDate = { $gte: fromDate };
  }

  const transactions = await TransactionHistory.find(query);
  return transactions.reduce((sum, tx) => sum + (tx.Amount || 0), 0);
}

async function calculateAverageTransaction(merchantId) {
  const transactions = await TransactionHistory.find({
    MerchantID: merchantId,
  });
  if (transactions.length === 0) return 0;
  const total = transactions.reduce((sum, tx) => sum + (tx.Amount || 0), 0);
  return Math.round(total / transactions.length);
}

async function getUniqueCustomers(merchantId) {
  const customers = await TransactionHistory.distinct("SenderID", {
    MerchantID: merchantId,
  });
  return customers.length;
}

async function getTopProducts(merchantId) {
  return [];
}

async function getPaymentMethodStats(merchantId) {
  return {};
}

function groupByPeriod(transactions, period) {
  const grouped = {};
  // Group logic here
  return grouped;
}

module.exports = {
  getDashboard,
  getDashboardStats,
  getTransactions,
  getTransactionDetails,
  refundTransaction,
  getSalesReport,
  getSalesAnalytics,
  exportSalesReport,
  getCustomers,
  getCustomerDetails,
  blockCustomer,
  unblockCustomer,
  getProducts,
  createProduct,
  getProductDetails,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  refundOrder,
  getDisputes,
  getDisputeDetails,
  respondToDispute,
  appealDispute,
  getPayouts,
  requestPayout,
  getPayoutDetails,
  getAPIKeys,
  generateAPIKey,
  revokeAPIKey,
  regenerateAPIKey,
  getSettings,
  updateSettings,
  updateBankDetails,
  updateCommissionSettings,
  updateNotificationSettings,
  getReports,
  generateReport,
  exportReport,
  getWebhooks,
  createWebhook,
  testWebhook,
  deleteWebhook,
  getChartData: async (req, res) => {
    try {
      res.json({ success: true, data: {} });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
