const Merchant = require("../../Models/Merchant");
const ZenoPayUser = require("../../Models/ZenoPayUser");

const toInt = (v, fallback = 1) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toMoney = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n)
    ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "0";
};

const normalizeStatus = (merchant) => {
  const s = String(merchant.Status || "").toLowerCase();
  if (s) return s;
  return merchant.IsActive ? "active" : "suspended";
};

const merchantIdLabel = (m) => String(m.ZenoPayId || m._id);

const pickCategory = (type) => {
  const raw = String(type || "").trim();
  if (!raw) return "Other";
  const normalized = raw.toLowerCase();

  if (normalized.includes("e-commerce") || normalized.includes("ecommerce")) return "E-Commerce";
  if (normalized.includes("food") || normalized.includes("beverage")) return "Food & Beverage";
  if (normalized.includes("travel")) return "Travel";
  if (normalized.includes("health")) return "Healthcare";
  if (normalized.includes("education")) return "Education";
  if (normalized.includes("retail")) return "Retail";
  if (normalized.includes("entertainment")) return "Entertainment";
  if (normalized.includes("finance") || normalized.includes("saas")) return "Finance";
  return "Other";
};

const buildMerchantQuery = ({ search, status, category }) => {
  const query = {};

  if (status && status !== "all") {
    query.Status = status;
  }

  if (category && category !== "all") {
    query.BusinessType = { $regex: `^${String(category).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
  }

  if (search) {
    const regex = { $regex: search, $options: "i" };
    query.$or = [
      { BusinessName: regex },
      { ZenoPayId: regex },
      { BusinessWebsite: regex },
    ];
  }

  return query;
};

const enrichMerchants = async (merchants = []) => {
  if (!merchants.length) return [];

  const zenoPayIds = merchants.map((m) => m.ZenoPayId).filter(Boolean);
  const users = await ZenoPayUser.find({ ZenoPayID: { $in: zenoPayIds } })
    .select("ZenoPayID Email Mobile FullName")
    .lean();

  const userById = new Map(users.map((u) => [u.ZenoPayID, u]));

  return merchants.map((m) => {
    const owner = userById.get(m.ZenoPayId) || {};
    const status = normalizeStatus(m);
    const category = pickCategory(m.BusinessType);
    return {
      id: String(m._id),
      merchantId: merchantIdLabel(m),
      businessName: m.BusinessName || "Unnamed Merchant",
      category,
      email: owner.Email || "Not available",
      phone: owner.Mobile || "Not set",
      totalVolume: Number(m.TotalVolume || 0),
      totalVolumeText: toMoney(m.TotalVolume || 0),
      transactions: Number(m.TransactionCount || 0),
      status,
      isVerified: status === "active",
      joinedAt: m.createdAt,
      joinedAtText: m.createdAt
        ? new Date(m.createdAt).toLocaleDateString("en-IN")
        : "",
    };
  });
};

exports.merchantsList = async (req, res) => {
  try {
    const { search = "", status = "all", category = "all", page = 1 } = req.query;
    const limit = 10;
    const currentPage = toInt(page, 1);
    const skip = (currentPage - 1) * limit;

    const query = buildMerchantQuery({ search, status, category });

    const [rawMerchants, totalCount, activeCount, pendingCount, verifiedCount, totalVolumeAgg] =
      await Promise.all([
        Merchant.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Merchant.countDocuments(query),
        Merchant.countDocuments({ Status: "active" }),
        Merchant.countDocuments({ Status: "pending" }),
        Merchant.countDocuments({ Status: "active" }),
        Merchant.aggregate([
          { $match: { Status: "active" } },
          { $group: { _id: null, total: { $sum: "$TotalVolume" } } },
        ]),
      ]);

    const merchants = await enrichMerchants(rawMerchants);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    res.locals.adminPage = "merchants";
    return res.render("admin/merchants/admin-merchants", {
      merchants,
      totalCount,
      activeCount,
      pendingCount,
      verifiedCount,
      totalVolume: totalVolumeAgg[0]?.total || 0,
      currentPage,
      totalPages,
      filters: { search, status, category },
      pageTitle: "Merchants",
      title: "Merchants",
      page: "merchants",
      adminPage: "merchants",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.exportMerchants = async (req, res) => {
  try {
    const { ids, status } = req.query;
    const query = {};

    if (ids) {
      query._id = { $in: String(ids).split(",").filter(Boolean) };
    } else if (status && status !== "all") {
      query.Status = status;
    }

    const rawMerchants = await Merchant.find(query).lean();
    const merchants = await enrichMerchants(rawMerchants);

    const headers = [
      "Merchant ID",
      "Business Name",
      "Email",
      "Phone",
      "Category",
      "Status",
      "Verified",
      "Total Volume",
      "Joined",
    ];

    const rows = merchants.map((m) => [
      m.merchantId,
      m.businessName,
      m.email,
      m.phone,
      m.category,
      m.status,
      m.isVerified ? "Yes" : "No",
      m.totalVolume,
      m.joinedAtText,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="merchants-export.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.merchantDetails = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id).lean();
    if (!merchant) {
      return res.status(404).send("Merchant not found");
    }

    const owner = await ZenoPayUser.findOne({ ZenoPayID: merchant.ZenoPayId })
      .select("FullName Email Mobile Address City State")
      .lean();

    const details = {
      ...merchant,
      owner,
      normalizedStatus: normalizeStatus(merchant),
    };

    return res.render("admin/merchants/admin-merchant-details", {
      pageTitle: "Admin Merchant Details",
      currentPage: "merchants",
      page: "merchants",
      adminPage: "merchants",
      admin: req.session.user,
      merchant: details,
      stats: {
        totalTransactions: Number(merchant.TransactionCount || 0),
        totalAmount: Number(merchant.TotalVolume || 0),
        successfulTransactions: Number(merchant.TransactionCount || 0),
        failedTransactions: 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      { Status: status, IsActive: status === "active", updatedAt: new Date() },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant not found" });
    }

    return res.json({ success: true, message: `Merchant ${status} successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.verifyMerchant = async (req, res) => {
  try {
    const merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      { Status: "active", IsActive: true, verifiedAt: new Date(), updatedAt: new Date() },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    return res.json({ success: true, message: "Merchant verified successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.bulkAction = async (req, res) => {
  try {
    const merchantIds = Array.isArray(req.body.merchantIds) ? req.body.merchantIds : [];
    const action = String(req.body.action || "");

    if (!merchantIds.length) {
      return res.status(400).json({ success: false, message: "No merchants selected" });
    }

    let update = {};
    if (action === "activate") update = { Status: "active", IsActive: true };
    if (action === "suspend") update = { Status: "suspended", IsActive: false };
    if (action === "verify") update = { Status: "active", IsActive: true, verifiedAt: new Date() };

    await Merchant.updateMany(
      { _id: { $in: merchantIds } },
      { ...update, updatedAt: new Date() }
    );

    return res.json({
      success: true,
      message: `${merchantIds.length} merchant(s) updated`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteMerchant = async (req, res) => {
  try {
    const deleted = await Merchant.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Merchant not found" });
    }
    return res.json({ success: true, message: "Merchant deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
