const mongoose = require("mongoose");
const Wallet = require("../../Models/Wallet");

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[,₹\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === "object" && typeof value.toString === "function") {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toTitle = (value = "") => {
  const text = String(value || "").toLowerCase();
  if (!text) return "Active";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatRelativeTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-IN");
};

const mapWallet = (wallet) => {
  const user = wallet.userId || {};
  const statusRaw = String(wallet.status || "active").toLowerCase();

  return {
    _id: wallet._id,
    walletId: wallet.walletId || String(wallet._id),
    user: {
      name: user.name || user.FullName || "Unknown",
      email: user.email || user.Email || "—",
    },
    balance: toNumber(wallet.balance),
    totalCredit: toNumber(wallet.totalCredit),
    totalDebit: toNumber(wallet.totalDebit),
    status: statusRaw,
    statusLabel: toTitle(statusRaw),
    lastTransaction: formatRelativeTime(wallet.lastTransaction || wallet.updatedAt || wallet.createdAt),
    currentBalanceText: `₹${toNumber(wallet.balance).toLocaleString("en-IN")}`,
  };
};

const walletsList = async (req, res) => {
  try {
    res.locals.adminPage = "wallets";
    res.locals.pageTitle = "Wallet Management";

    const [walletDocs, totalWallets, activeWallets, frozenWallets, balanceStats] = await Promise.all([
      Wallet.find()
        .populate("userId", "name email FullName Email")
        .sort({ createdAt: -1 })
        .lean(),
      Wallet.countDocuments(),
      Wallet.countDocuments({ status: "active" }),
      Wallet.countDocuments({ status: "frozen" }),
      Wallet.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: "$balance" },
          },
        },
      ]),
    ]);

    const wallets = walletDocs.map(mapWallet);
    const totalBalance = toNumber(balanceStats?.[0]?.totalBalance);

    res.render("admin/wallets/admin-wallets", {
      page: "wallets",
      title: "Wallet Management",
      wallets,
      totalWallets,
      activeWallets,
      frozenWallets,
      totalBalance,
      admin: req.session.user,
      user: req.session.user,
    });
  } catch (err) {
    console.error("walletsList error:", err);
    res.status(500).send("Server Error");
  }
};

const walletDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const wallet = await Wallet.findById(id).populate("userId", "name email phone createdAt FullName Email Mobile RegistrationDate");

    if (!wallet) {
      return res.status(404).render("admin/404");
    }

    // If a wallet transaction model/path is not yet available in this codebase,
    // keep transactions empty to avoid runtime errors.
    const transactions = [];

    res.locals.adminPage = "wallets";
    res.locals.pageTitle = "Wallet Details";

    res.render("admin/wallets/admin-wallet-details", {
      wallet,
      transactions,
      pageTitle: "Wallet Details",
    });
  } catch (err) {
    console.error("walletDetails error:", err);
    res.status(500).send("Server Error");
  }
};

const updateWalletStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    let newStatus;
    if (action === "freeze") newStatus = "frozen";
    if (action === "unfreeze") newStatus = "active";
    if (action === "suspend") newStatus = "suspended";

    if (!newStatus) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const wallet = await Wallet.findByIdAndUpdate(
      id,
      { status: newStatus, updatedAt: new Date() },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    return res.json({
      success: true,
      status: newStatus,
      message: `Wallet ${newStatus} successfully`,
    });
  } catch (err) {
    console.error("updateWalletStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const adjustWalletBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, reason, note } = req.body;

    const adjustAmount = Number(amount);
    if (!type || !adjustAmount || Number.isNaN(adjustAmount) || adjustAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const wallet = await Wallet.findById(id);
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    const currentBalance = toNumber(wallet.balance);
    const currentCredit = toNumber(wallet.totalCredit);
    const currentDebit = toNumber(wallet.totalDebit);

    if (type === "credit") {
      wallet.balance = currentBalance + adjustAmount;
      wallet.totalCredit = currentCredit + adjustAmount;
    } else if (type === "debit") {
      if (currentBalance < adjustAmount) {
        return res.status(400).json({ success: false, message: "Insufficient balance" });
      }
      wallet.balance = currentBalance - adjustAmount;
      wallet.totalDebit = currentDebit + adjustAmount;
    } else {
      return res.status(400).json({ success: false, message: "Invalid adjustment type" });
    }

    wallet.lastTransaction = new Date();
    wallet.updatedAt = new Date();
    await wallet.save();

    return res.json({
      success: true,
      newBalance: toNumber(wallet.balance),
      reason: reason || "",
      note: note || "",
      message: "Balance adjusted successfully",
    });
  } catch (err) {
    console.error("adjustWalletBalance error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const bulkWalletAction = async (req, res) => {
  try {
    const { walletIds, action } = req.body;

    if (!walletIds || !Array.isArray(walletIds) || walletIds.length === 0) {
      return res.status(400).json({ success: false, message: "No wallets selected" });
    }

    let newStatus;
    if (action === "freeze") newStatus = "frozen";
    if (action === "suspend") newStatus = "suspended";

    if (!newStatus) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    await Wallet.updateMany(
      { _id: { $in: walletIds } },
      { status: newStatus, updatedAt: new Date() }
    );

    return res.json({
      success: true,
      message: `${walletIds.length} wallet(s) ${newStatus} successfully`,
      count: walletIds.length,
    });
  } catch (err) {
    console.error("bulkWalletAction error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const exportWallets = async (req, res) => {
  try {
    const { ids } = req.query;
    let query = {};

    if (ids) {
      const idArray = String(ids)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      query = { _id: { $in: idArray } };
    }

    const wallets = await Wallet.find(query)
      .populate("userId", "name email FullName Email")
      .lean();

    const headers = [
      "Wallet ID",
      "User Name",
      "Email",
      "Balance",
      "Total Credit",
      "Total Debit",
      "Status",
      "Created At",
    ];

    const rows = wallets.map((w) => {
      const user = w.userId || {};
      return [
        w.walletId || w._id,
        user.name || user.FullName || "Unknown",
        user.email || user.Email || "",
        toNumber(w.balance),
        toNumber(w.totalCredit),
        toNumber(w.totalDebit),
        w.status || "",
        w.createdAt ? new Date(w.createdAt).toLocaleDateString("en-IN") : "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="wallets-export.csv"');
    return res.send(csv);
  } catch (err) {
    console.error("exportWallets error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetWalletBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findByIdAndUpdate(
      req.params.id,
      { balance: 0, updatedAt: new Date() },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    return res.json({ success: true, message: "Balance reset to ₹0 successfully" });
  } catch (err) {
    console.error("resetWalletBalance error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  walletsList,
  walletDetails,
  updateWalletStatus,
  adjustWalletBalance,
  bulkWalletAction,
  exportWallets,
  resetWalletBalance,
};
