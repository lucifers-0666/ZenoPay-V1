const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const ZenoPayUser = require("../Models/ZenoPayUser");

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

const getDashboard = async (req, res) => {
  try {
    const zenoPayId = getSessionZenoPayId(req);

    let accounts = [];
    let transactions = [];
    let walletBalance = 0;
    let monthTransactionCount = 0;
    let monthSuccessRate = 98.4;

    if (zenoPayId) {
      accounts = await BankAccount.find({ ZenoPayId: zenoPayId }).lean();
      walletBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.Balance), 0);

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
          const successCount = monthTransactions.filter((tx) => String(tx.Status || "").toLowerCase() === "success").length;
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
      user: req.session.user || null,
      accounts,
      transactions,
      walletBalance,
      monthTransactionCount,
      monthSuccessRate,
      qrCode: req.session.qrCode || null,
      isLoggedIn: req.session.isLoggedIn || false,
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
