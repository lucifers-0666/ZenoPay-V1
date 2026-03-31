const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const Wallet = require("../Models/Wallet");
const WalletTransaction = require("../Models/Transaction");
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

const normalizeAccountNumber = (value = "") => String(value || "").replace(/\D/g, "");

const parseStatus = (value = "") => {
  const status = String(value || "").toLowerCase();
  if (status.includes("success") || status.includes("complete")) return "success";
  if (status.includes("fail") || status.includes("declin")) return "failed";
  return "pending";
};

const toDisplayDateTime = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const getDashboard = async (req, res) => {
  try {
    const zenoPayId = getSessionZenoPayId(req);

    // FIX: Read user & isLoggedIn from session directly (res.locals already set
    // by app.js middleware, but we pass explicitly to avoid any layout override).
    const sessionUser = req.session?.user || null;
    const isLoggedIn = !!(sessionUser && req.session?.isLoggedIn);
    const sessionUserId = sessionUser?._id || req.session?.userId || null;

    let accounts = [];
    let bankTransactions = [];
    let walletTransactions = [];
    let recentTransactions = [];
    let walletBalance = 0;
    let monthTransactionCount = 0;
    let monthSuccessRate = 98.4;
    let monthBankTransactionCount = 0;
    let monthBankSuccessCount = 0;
    let monthWalletTransactionCount = 0;
    let monthWalletSuccessCount = 0;

    if (zenoPayId) {
      accounts = await BankAccount.find({ ZenoPayId: zenoPayId }).lean();

      const accountNumbers = accounts.map((a) => a.AccountNumber);
      const normalizedAccountSet = new Set(
        accountNumbers.map((accountNo) => normalizeAccountNumber(accountNo)).filter(Boolean)
      );

      if (accountNumbers.length) {
        bankTransactions = await TransactionHistory.find({
          $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } },
          ],
        })
          .sort({ TransactionTime: -1 })
          .limit(8)
          .lean();

        if (!bankTransactions.length && normalizedAccountSet.size > 0) {
          const candidates = await TransactionHistory.find({})
            .sort({ TransactionTime: -1 })
            .limit(100)
            .lean();

          bankTransactions = candidates.filter((txn) => {
            const senderNorm = normalizeAccountNumber(txn?.SenderAccountNumber);
            const receiverNorm = normalizeAccountNumber(txn?.ReceiverAccountNumber);
            return normalizedAccountSet.has(senderNorm) || normalizedAccountSet.has(receiverNorm);
          });
        }

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthBankTransactions = await TransactionHistory.find({
          $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } },
          ],
          TransactionTime: { $gte: monthStart },
        })
          .select("Status")
          .lean();

        monthBankTransactionCount = monthBankTransactions.length;
        monthBankSuccessCount = monthBankTransactions.filter(
          (tx) => parseStatus(tx.Status) === "success"
        ).length;
      }
    }

    if (sessionUserId) {
      const [walletDoc, latestWalletTransactions, monthWalletTransactions] = await Promise.all([
        Wallet.findOne({ userId: sessionUserId, isActive: true }).lean(),
        WalletTransaction.find({ userId: sessionUserId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        (() => {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          return WalletTransaction.find({
            userId: sessionUserId,
            createdAt: { $gte: monthStart },
          })
            .select("status")
            .lean();
        })(),
      ]);

      walletTransactions = latestWalletTransactions || [];

      if (walletDoc) {
        walletBalance = toNumber(walletDoc.balance);
      } else {
        walletBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.Balance), 0);
      }

      monthWalletTransactionCount = monthWalletTransactions.length;

      monthWalletSuccessCount = monthWalletTransactions.filter(
        (tx) => parseStatus(tx.status) === "success"
      ).length;
    } else {
      walletBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.Balance), 0);
    }

    monthTransactionCount = monthBankTransactionCount + monthWalletTransactionCount;
    if (monthTransactionCount > 0) {
      monthSuccessRate = Number(
        (((monthBankSuccessCount + monthWalletSuccessCount) / monthTransactionCount) * 100).toFixed(1)
      );
    }

    const accountNumbersSet = new Set(
      (accounts || [])
        .map((account) => normalizeAccountNumber(account.AccountNumber))
        .filter(Boolean)
    );

    const mappedBankTransactions = (bankTransactions || []).map((tx) => {
      const isCredit = accountNumbersSet.has(normalizeAccountNumber(tx.ReceiverAccountNumber));
      return {
        source: "bank",
        type: isCredit ? "credit" : "debit",
        status: parseStatus(tx.Status),
        amount: toNumber(tx.Amount),
        description: isCredit
          ? `Received from ${tx.SenderHolderName || "Bank transfer"}`
          : `Sent to ${tx.ReceiverHolderName || "Bank transfer"}`,
        date: toDisplayDateTime(tx.TransactionTime),
        createdAt: new Date(tx.TransactionTime || Date.now()),
      };
    });

    const mappedWalletTransactions = (walletTransactions || []).map((tx) => {
      const txType = String(tx.type || "").toLowerCase();
      const isCredit = txType === "topup" || txType === "receive" || txType === "refund";
      return {
        source: "wallet",
        type: isCredit ? "credit" : "debit",
        status: parseStatus(tx.status),
        amount: toNumber(tx.amount),
        description: tx.description || (isCredit ? "Wallet credit" : "Wallet debit"),
        date: toDisplayDateTime(tx.createdAt),
        createdAt: new Date(tx.createdAt || Date.now()),
      };
    });

    recentTransactions = [...mappedWalletTransactions, ...mappedBankTransactions]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);

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

    const pinSuccessMessageRaw = String(req.query?.pinSuccess || "").trim();
    const pinSuccessMessage = pinSuccessMessageRaw
      ? pinSuccessMessageRaw.slice(0, 120)
      : null;

    return res.render("dashboard", {
      pageTitle: "Dashboard",
      currentPage: "dashboard",
      // FIX: use sessionUser so header.ejs always gets the correct user object
      user: sessionUser,
      isLoggedIn: isLoggedIn,
      accounts,
      transactions: recentTransactions,
      recentTransactions,
      walletBalance,
      monthTransactionCount,
      monthSuccessRate,
      qrCode: req.session.qrCode || null,
      stats,
      pinSuccessMessage,
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
