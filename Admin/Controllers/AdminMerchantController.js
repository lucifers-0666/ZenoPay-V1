const Merchant = require("../../Models/Merchant");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const TransactionHistory = require("../../Models/TransactionHistory");

// GET All Merchants
const getAllMerchants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { BusinessName: { $regex: search, $options: "i" } },
        { ZenoPayId: { $regex: search, $options: "i" } },
        { BusinessWebsite: { $regex: search, $options: "i" } },
        { Email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.Status = status;
    }

    // Get merchants
    const merchants = await Merchant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("ZenoPayId", "-Password")
      .lean();

    const total = await Merchant.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    if (req.query.api === "true") {
      return res.json({
        success: true,
        data: merchants,
        pagination: { currentPage: page, totalPages, total, limit },
      });
    }

    res.render("merchants/admin-merchant-management", {
      pageTitle: "Merchant Management",
      currentPage: "merchants",
      admin: req.session.user,
      merchants,
      pagination: {
        page,
        limit,
        totalPages,
        total,
      },
      search,
      status,
    });
  } catch (error) {
    console.error("Get all merchants error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET Pending Merchants
const getPendingMerchants = async (req, res) => {
  try {
    const pendingMerchants = await Merchant.find({ IsActive: false })
      .sort({ createdAt: -1 })
      .populate("ZenoPayId", "FullName Email Mobile");

    res.render("merchants/admin-merchant-approvals", {
      pageTitle: "Admin Merchant Approvals",
      currentPage: "merchants",
      admin: req.session.user,
      merchants: pendingMerchants,
    });
  } catch (error) {
    console.error("Get pending merchants error:", error);
    res.status(500).send("Error loading pending merchants");
  }
};

// GET Merchant Details
const getMerchantDetails = async (req, res) => {
  try {
    const merchantId = req.params.id;
    
    const merchant = await Merchant.findById(merchantId)
      .populate("ZenoPayId", "FullName Email Mobile Address City State");

    if (!merchant) {
      return res.status(404).send("Merchant not found");
    }

    // Get merchant transaction stats
    // This assumes you have a merchantId field in TransactionHistory
    // You may need to adjust based on your schema
    const transactionStats = {
      totalTransactions: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
    };

    res.render("merchants/admin-merchant-details", {
      pageTitle: "Admin Merchant Details",
      currentPage: "merchants",
      admin: req.session.user,
      merchant,
      stats: transactionStats,
    });
  } catch (error) {
    console.error("Get merchant details error:", error);
    res.status(500).send("Error loading merchant details");
  }
};

// Approve Merchant
const approveMerchant = async (req, res) => {
  try {
    const merchantId = req.params.id;
    
    await Merchant.findByIdAndUpdate(merchantId, {
      $set: { IsActive: true },
    });

    res.json({ success: true, message: "Merchant approved successfully" });
  } catch (error) {
    console.error("Approve merchant error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject Merchant
const rejectMerchant = async (req, res) => {
  try {
    const merchantId = req.params.id;
    const { reason } = req.body;
    
    await Merchant.findByIdAndDelete(merchantId);

    // You may want to notify the merchant about rejection
    
    res.json({ success: true, message: "Merchant rejected successfully" });
  } catch (error) {
    console.error("Reject merchant error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Suspend Merchant
const suspendMerchant = async (req, res) => {
  try {
    const merchantId = req.params.id;
    
    await Merchant.findByIdAndUpdate(merchantId, {
      $set: { IsActive: false },
    });

    res.json({ success: true, message: "Merchant suspended successfully" });
  } catch (error) {
    console.error("Suspend merchant error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Revoke API Keys
const revokeApiKeys = async (req, res) => {
  try {
    const merchantId = req.params.id;
    
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return res.status(404).json({ success: false, error: "Merchant not found" });
    }

    // Generate new API keys
    merchant.generateApiKey();
    await merchant.save();

    res.json({ 
      success: true, 
      message: "API keys revoked and regenerated successfully",
      newApiKey: merchant.ApiKey,
    });
  } catch (error) {
    console.error("Revoke API keys error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllMerchants,
  getPendingMerchants,
  getMerchantDetails,
  approveMerchant,
  rejectMerchant,
  suspendMerchant,
  revokeApiKeys,
};
