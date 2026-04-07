const Beneficiary = require("../Models/Beneficiary");
const ZenoPayUser = require("../Models/ZenoPayUser");

const getSessionUserId = (req) => req.session?.user?._id || null;

const formatBeneficiary = (row) => ({
  _id: String(row._id),
  name: row.name,
  email: row.email,
  phone: row.phone || "",
  accountNumber: row.accountNumber || "",
  nickname: row.nickname || "",
  avatar: row.avatar || (row.name?.[0] || "U").toUpperCase(),
  isActive: Boolean(row.isActive),
  createdAt: row.createdAt,
});

const getBeneficiaries = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const beneficiaries = await Beneficiary.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      beneficiaries: beneficiaries.map(formatBeneficiary),
    });
  } catch (error) {
    console.error("[Beneficiary] Failed to load beneficiaries:", error);
    return res.status(500).json({ success: false, message: "Failed to load beneficiaries" });
  }
};

const getBeneficiariesPage = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const isGuestPreview = process.env.NODE_ENV !== "production" && !userId;

    if (!userId && !isGuestPreview) {
      return res.redirect("/login");
    }

    const beneficiaries = userId
      ? await Beneficiary.find({ userId, isActive: true })
        .sort({ createdAt: -1 })
        .lean()
      : [];

    return res.render("beneficiaries", {
      pageTitle: "Beneficiaries - ZenoPay",
      currentPage: "beneficiaries",
      user: req.session.user || { FullName: "Guest Preview", ZenoPayID: "ZP-PREVIEW" },
      qrCode: req.session.qrCode || null,
      isLoggedIn: !!userId,
      readOnlyPreview: isGuestPreview,
      beneficiaries: beneficiaries.map(formatBeneficiary),
      hasBeneficiaries: beneficiaries.length > 0,
    });
  } catch (error) {
    console.error("[Beneficiary] Failed to load beneficiaries page:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const addBeneficiary = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const email = String(req.body?.email || "").trim().toLowerCase();
    const nickname = String(req.body?.nickname || "").trim();

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const targetUser = await ZenoPayUser.findOne({
      $or: [{ Email: email }, { email }],
    }).lean();

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "No ZenoPay user found with this email" });
    }

    if (String(targetUser._id) === String(userId)) {
      return res.status(400).json({ success: false, message: "You cannot add yourself as a beneficiary" });
    }

    const alreadySaved = await Beneficiary.findOne({ userId, email, isActive: true }).lean();
    if (alreadySaved) {
      return res.status(409).json({ success: false, message: "Already in your beneficiaries" });
    }

    const name = String(targetUser.FullName || targetUser.name || targetUser.Email || email).trim();
    const phone = String(targetUser.Mobile || targetUser.phone || "").trim();
    const accountNumber = String(targetUser.ZenoPayID || targetUser.userId || "").trim();
    const avatar = (name?.charAt(0) || "U").toUpperCase();

    const created = await Beneficiary.create({
      userId,
      name,
      email,
      phone,
      accountNumber,
      nickname,
      avatar,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Beneficiary added",
      beneficiary: formatBeneficiary(created.toObject()),
    });
  } catch (error) {
    console.error("[Beneficiary] Failed to add beneficiary:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Already in your beneficiaries" });
    }
    return res.status(500).json({ success: false, message: "Failed to add beneficiary" });
  }
};

const deleteBeneficiary = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const beneficiaryId = String(req.params?.id || "").trim();
    if (!beneficiaryId) {
      return res.status(400).json({ success: false, message: "Beneficiary id is required" });
    }

    const deleted = await Beneficiary.findOneAndDelete({
      _id: beneficiaryId,
      userId,
    }).lean();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Beneficiary not found" });
    }

    return res.json({ success: true, message: "Beneficiary removed" });
  } catch (error) {
    console.error("[Beneficiary] Failed to delete beneficiary:", error);
    return res.status(500).json({ success: false, message: "Failed to remove beneficiary" });
  }
};

const searchBeneficiary = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const q = String(req.query?.q || "").trim();
    if (!q) {
      return getBeneficiaries(req, res);
    }

    const regex = new RegExp(q, "i");
    const beneficiaries = await Beneficiary.find({
      userId,
      isActive: true,
      $or: [{ name: regex }, { email: regex }],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      beneficiaries: beneficiaries.map(formatBeneficiary),
    });
  } catch (error) {
    console.error("[Beneficiary] Failed to search beneficiaries:", error);
    return res.status(500).json({ success: false, message: "Search failed" });
  }
};

module.exports = {
  getBeneficiariesPage,
  getBeneficiaries,
  addBeneficiary,
  deleteBeneficiary,
  searchBeneficiary,
};
