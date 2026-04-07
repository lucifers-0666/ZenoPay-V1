const Payout = require("../../Models/Payout");
const Wallet = require("../../Models/Wallet");
const ZenoPayUser = require("../../Models/ZenoPayUser");

const getMerchantOwnerByZenoPayId = async (zenoPayId) => {
  return ZenoPayUser.findOne({
    $or: [{ ZenoPayID: zenoPayId }, { userId: zenoPayId }],
  }).lean();
};

const getPendingPayoutsPage = async (req, res) => {
  try {
    const payouts = await Payout.find({ status: { $in: ["pending", "processing"] } })
      .sort({ requestedAt: -1 })
      .populate("merchantId")
      .lean();

    const merchantIds = [...new Set(payouts.map((p) => p.merchantId?.ZenoPayId).filter(Boolean))];
    const owners = await ZenoPayUser.find({
      $or: [
        { ZenoPayID: { $in: merchantIds } },
        { userId: { $in: merchantIds } },
      ],
    }).select("ZenoPayID userId FullName Email").lean();

    const ownerById = new Map();
    owners.forEach((o) => {
      if (o.ZenoPayID) ownerById.set(o.ZenoPayID, o);
      if (o.userId) ownerById.set(o.userId, o);
    });

    const rows = payouts.map((p) => {
      const merchant = p.merchantId || {};
      const owner = ownerById.get(merchant.ZenoPayId) || {};
      return {
        ...p,
        merchantName: merchant.BusinessName || "-",
        merchantIdLabel: merchant.ZenoPayId || "-",
        merchantEmail: owner.Email || "-",
      };
    });

    return res.render("admin/payouts", {
      pageTitle: "Pending Payouts",
      payouts: rows,
      success: req.query.success || "",
      error: req.query.error || "",
    });
  } catch (error) {
    console.error("[AdminPayout] get pending payouts error:", error);
    return res.status(500).render("admin/payouts", {
      pageTitle: "Pending Payouts",
      payouts: [],
      success: "",
      error: "Unable to load payouts",
    });
  }
};

const approvePayout = async (req, res) => {
  try {
    const { payoutId } = req.params;

    const payout = await Payout.findById(payoutId).populate("merchantId");
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (!["pending", "processing"].includes(payout.status)) {
      return res.status(400).json({ success: false, message: "Only pending/processing payouts can be approved" });
    }

    payout.status = "completed";
    payout.processedAt = new Date();
    payout.transactionRef = `PAYOUT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await payout.save();

    return res.json({ success: true, message: "Payout approved", transactionRef: payout.transactionRef });
  } catch (error) {
    console.error("[AdminPayout] approve error:", error);
    return res.status(500).json({ success: false, message: "Failed to approve payout" });
  }
};

const rejectPayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const rejectionReason = String(req.body?.rejectionReason || req.body?.reason || "").trim();

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const payout = await Payout.findById(payoutId).populate("merchantId");
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (!["pending", "processing"].includes(payout.status)) {
      return res.status(400).json({ success: false, message: "Only pending/processing payouts can be rejected" });
    }

    const merchant = payout.merchantId;
    const owner = merchant ? await getMerchantOwnerByZenoPayId(merchant.ZenoPayId) : null;
    const wallet = owner ? await Wallet.findOne({ userId: owner._id }) : null;

    if (!wallet) {
      return res.status(400).json({ success: false, message: "Merchant wallet not found for refund" });
    }

    wallet.balance = Number((Number(wallet.balance || 0) + Number(payout.amount || 0)).toFixed(2));
    await wallet.save();

    payout.status = "rejected";
    payout.rejectionReason = rejectionReason;
    payout.processedAt = new Date();
    await payout.save();

    return res.json({ success: true, message: "Payout rejected and refunded" });
  } catch (error) {
    console.error("[AdminPayout] reject error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject payout" });
  }
};

module.exports = {
  getPendingPayoutsPage,
  approvePayout,
  rejectPayout,
};
