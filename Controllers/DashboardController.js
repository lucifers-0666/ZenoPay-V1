const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const ZenoPayUser = require("../Models/ZenoPayUser");
const Wallet = require("../Models/Wallet");
const Transaction = require("../Models/Transaction");

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

const getSessionZenoPayId = (req) =>
  req.session?.user?.ZenoPayID ||
  req.session?.user?.ZenoPayId ||
  req.session?.user?.zenoPayId ||
  null;

const buildWalletId = (userId) => `WL-${String(userId)}`;

const getDashboard = async (req, res) => {
  try {
    if (req.session?.isLoggedIn && req.session?.user?.Role === "admin") {
      return res.redirect("/admin/dashboard");
    }

    const zenoPayId = getSessionZenoPayId(req);

    // FIX: Read user & isLoggedIn from session directly (res.locals already set
    // by app.js middleware, but we pass explicitly to avoid any layout override).
    const sessionUser = req.session?.user || null;
    const isLoggedIn = !!(sessionUser && req.session?.isLoggedIn);

    let accounts = [];
    let transactions = [];
    let recentTransactions = [];
    let walletBalance = 0;
    let monthTransactionCount = 0;
    let monthSuccessRate = 98.4;

    if (zenoPayId) {
      accounts = await BankAccount.find({ ZenoPayId: zenoPayId }).lean();

      const walletOwner = await ZenoPayUser.findOne({
        $or: [{ ZenoPayID: zenoPayId }, { userId: zenoPayId }],
      })
        .select("_id")
        .lean();

      if (walletOwner?._id) {
        const wallet = await Wallet.findOneAndUpdate(
          { userId: walletOwner._id },
          {
            $setOnInsert: {
              walletId: buildWalletId(walletOwner._id),
              userId: walletOwner._id,
              balance: 0,
              currency: "INR",
              isActive: true,
            },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();

        walletBalance = Number(wallet?.balance || 0);

        const walletTx = await Transaction.find({ userId: walletOwner._id })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        recentTransactions = walletTx.map((tx) => ({
          description: tx.description,
          amount: Number(tx.amount || 0),
          createdAt: new Date(tx.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: ["receive", "topup", "refund"].includes(tx.type) ? "credit" : "debit",
          status: tx.status === "completed" ? "success" : tx.status,
        }));
      }

      if (!walletBalance) {
        walletBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.Balance), 0);
      }

      const accountNumbers = accounts.map((a) => a.AccountNumber);
      if (accountNumbers.length) {
        transactions = await TransactionHistory.find({
          $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } },
          ],
        })
          .sort({ TransactionTime: -1 })
          .limit(8)
          .lean();

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthTransactions = await TransactionHistory.find({
          $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } },
          ],
          TransactionTime: { $gte: monthStart },
        })
          .select("Status")
          .lean();

        monthTransactionCount = monthTransactions.length;
        if (monthTransactionCount > 0) {
          const successCount = monthTransactions.filter(
            (tx) => String(tx.Status || "").toLowerCase() === "success"
          ).length;
          monthSuccessRate = Number(((successCount / monthTransactionCount) * 100).toFixed(1));
        }
      }
    }

    const activeUsersCount = await ZenoPayUser.countDocuments({
      $or: [{ AccountStatus: { $exists: false } }, { AccountStatus: { $ne: "Inactive" } }],
    });

    const totalProcessedResult = await TransactionHistory.aggregate([
      { $match: { Status: "success" } },
      { $group: { _id: null, totalAmount: { $sum: "$Amount" } } },
    ]);

    const totalProcessed = toNumber(totalProcessedResult?.[0]?.totalAmount);
    const processedCr = Number((totalProcessed / 10000000).toFixed(2));

    const stats = {
      activeUsers: activeUsersCount || 10000,
      processed: processedCr || 500,
      uptime: 99.9,
      settlementTime: 2,
      countriesSupported: 22,
    };

    return res.render("dashboard", {
      pageTitle: "Dashboard",
      currentPage: "dashboard",
      // FIX: use sessionUser so header.ejs always gets the correct user object
      user: sessionUser,
      isLoggedIn: isLoggedIn,
      accounts,
      transactions,
      recentTransactions,
      walletBalance,
      monthTransactionCount,
      monthSuccessRate,
      qrCode: req.session.qrCode || null,
      stats,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

module.exports = { getDashboard };
