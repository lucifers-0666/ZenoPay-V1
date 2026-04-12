const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const Wallet = require("../Models/Wallet");
const WalletTransaction = require("../Models/Transaction");
const ZenoPayUser = require("../Models/ZenoPayUser");
const KYC = require("../Models/KYC");
const mongoose = require("mongoose");
const { getLimitsByTier } = require("../config/transactionLimits");

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
    const sessionUser = req.session?.user || null;
    const isLoggedIn = !!(sessionUser && req.session?.isLoggedIn);
    const sessionUserId = sessionUser?._id || req.session?.userId || null;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sessionObjectId = mongoose.Types.ObjectId.isValid(String(sessionUserId))
      ? new mongoose.Types.ObjectId(String(sessionUserId))
      : null;

    const [accounts, walletDoc, latestWalletTransactions, monthWalletTransactions, walletDailyAgg, activeUsersCount, totalProcessedResult, currentUserDoc, kycRecord] = await Promise.all([
      zenoPayId ? BankAccount.find({ ZenoPayId: zenoPayId }).lean() : Promise.resolve([]),
      sessionUserId ? Wallet.findOne({ userId: sessionUserId, isActive: true }).lean() : Promise.resolve(null),
      sessionUserId
        ? WalletTransaction.find({ userId: sessionUserId }).sort({ createdAt: -1 }).limit(8).lean()
        : Promise.resolve([]),
      sessionUserId
        ? WalletTransaction.find({ userId: sessionUserId, createdAt: { $gte: monthStart } }).select("status").lean()
        : Promise.resolve([]),
      sessionObjectId
        ? WalletTransaction.aggregate([
            {
              $match: {
                userId: sessionObjectId,
                createdAt: { $gte: startOfToday, $lte: endOfToday },
                type: "send",
                status: "completed",
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ])
        : Promise.resolve([]),
      ZenoPayUser.countDocuments({
        $or: [{ AccountStatus: { $exists: false } }, { AccountStatus: { $ne: "Inactive" } }],
      }),
      TransactionHistory.aggregate([
        { $match: { Status: "success" } },
        { $group: { _id: null, totalAmount: { $sum: "$Amount" } } },
      ]),
      sessionObjectId ? ZenoPayUser.findById(sessionObjectId).lean() : Promise.resolve(null),
      sessionObjectId ? KYC.findOne({ userId: sessionObjectId }).sort({ createdAt: -1 }).lean() : Promise.resolve(null),
    ]);

    const accountNumbers = (accounts || []).map((row) => row.AccountNumber).filter(Boolean);
    const normalizedAccountSet = new Set(accountNumbers.map((accountNo) => normalizeAccountNumber(accountNo)).filter(Boolean));

    let bankTransactions = [];
    let monthBankTransactions = [];
    let categoryAggregation = [];
    let bankDailyAgg = [];

    if (accountNumbers.length > 0) {
      [bankTransactions, monthBankTransactions, categoryAggregation, bankDailyAgg] = await Promise.all([
        TransactionHistory.find({
          $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } },
          ],
        }).sort({ TransactionTime: -1 }).limit(8).lean(),
        TransactionHistory.find({
          $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } },
          ],
          TransactionTime: { $gte: monthStart },
        }).select("Status").lean(),
        TransactionHistory.aggregate([
          {
            $match: {
              SenderAccountNumber: { $in: accountNumbers },
              TransactionTime: { $gte: monthStart, $lt: monthEnd },
              Status: "success",
            },
          },
          {
            $group: {
              _id: { $ifNull: ["$Category", "other"] },
              amount: { $sum: "$Amount" },
            },
          },
          { $sort: { amount: -1 } },
          { $limit: 1 },
        ]),
        TransactionHistory.aggregate([
          {
            $match: {
              SenderAccountNumber: { $in: accountNumbers },
              TransactionTime: { $gte: startOfToday, $lte: endOfToday },
              Status: "success",
            },
          },
          { $group: { _id: null, total: { $sum: "$Amount" } } },
        ]),
      ]);

      if (!bankTransactions.length && normalizedAccountSet.size > 0) {
        const candidates = await TransactionHistory.find({}).sort({ TransactionTime: -1 }).limit(100).lean();
        bankTransactions = candidates.filter((txn) => {
          const senderNorm = normalizeAccountNumber(txn?.SenderAccountNumber);
          const receiverNorm = normalizeAccountNumber(txn?.ReceiverAccountNumber);
          return normalizedAccountSet.has(senderNorm) || normalizedAccountSet.has(receiverNorm);
        });
      }
    }

    const monthBankTransactionCount = monthBankTransactions.length;
    const monthBankSuccessCount = monthBankTransactions.filter((tx) => parseStatus(tx.Status) === "success").length;
    const monthWalletTransactionCount = monthWalletTransactions.length;
    const monthWalletSuccessCount = monthWalletTransactions.filter((tx) => parseStatus(tx.status) === "success").length;

    let topSpendingCategory = "Other";
    let topSpendingAmount = 0;
    if (categoryAggregation.length > 0) {
      const topCategoryRaw = String(categoryAggregation[0]._id || "other").toLowerCase();
      const prettyCategory = {
        food: "Food",
        shopping: "Shopping",
        bills: "Bills",
        travel: "Travel",
        entertainment: "Entertainment",
        health: "Health",
        education: "Education",
        other: "Other",
      };

      topSpendingCategory = prettyCategory[topCategoryRaw] || "Other";
      topSpendingAmount = toNumber(categoryAggregation[0].amount || 0);
    }

    const walletBalance = walletDoc ? toNumber(walletDoc.balance) : (accounts || []).reduce((sum, acc) => sum + toNumber(acc.Balance), 0);

    const monthTransactionCount = monthBankTransactionCount + monthWalletTransactionCount;
    const monthSuccessRate = monthTransactionCount > 0
      ? Number((((monthBankSuccessCount + monthWalletSuccessCount) / monthTransactionCount) * 100).toFixed(1))
      : 98.4;

    const totalProcessed = toNumber(totalProcessedResult?.[0]?.totalAmount);
    const processedCr = Number((totalProcessed / 10000000).toFixed(2));

    const stats = {
      activeUsers: activeUsersCount || 10000,
      processed: processedCr || 500,
      uptime: 99.9,
      settlementTime: 2,
      countriesSupported: 22,
    };

    const walletDaily = toNumber(walletDailyAgg?.[0]?.total || 0);
    const bankDaily = toNumber(bankDailyAgg?.[0]?.total || 0);
    const currentTier = currentUserDoc?.kycTier || 0;
    const limits = getLimitsByTier(currentTier);
    const dailyUsed = walletDaily + bankDaily;
    const transactionLimitWidget = {
      dailyUsed,
      dailyLimit: limits.dailyLimit,
      dailyRemaining: Math.max(0, limits.dailyLimit - dailyUsed),
      usagePercent: Math.min(100, Math.round((dailyUsed / Math.max(1, limits.dailyLimit)) * 100)),
    };

    const accountNumbersSet = new Set(accountNumbers.map((accountNo) => normalizeAccountNumber(accountNo)).filter(Boolean));

    const mappedBankTransactions = (bankTransactions || []).map((tx) => {
      const isCredit = accountNumbersSet.has(normalizeAccountNumber(tx.ReceiverAccountNumber));
      return {
        source: "bank",
        type: isCredit ? "credit" : "debit",
        status: parseStatus(tx.Status),
        amount: toNumber(tx.Amount),
        description: isCredit ? `Received from ${tx.SenderHolderName || "Bank transfer"}` : `Sent to ${tx.ReceiverHolderName || "Bank transfer"}`,
        date: toDisplayDateTime(tx.TransactionTime),
        createdAt: new Date(tx.TransactionTime || Date.now()),
      };
    });

    const mappedWalletTransactions = (latestWalletTransactions || []).map((tx) => {
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

    const recentTransactions = [...mappedWalletTransactions, ...mappedBankTransactions]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);

    const pinSuccessMessageRaw = String(req.query?.pinSuccess || "").trim();
    const pinSuccessMessage = pinSuccessMessageRaw ? pinSuccessMessageRaw.slice(0, 120) : null;

    const kycStatus = currentUserDoc?.kycStatus || "not_submitted";
    const kycTier = currentTier;

    return res.render("dashboard", {
      pageTitle: "Dashboard",
      currentPage: "dashboard",
      user: sessionUser,
      isLoggedIn,
      accounts,
      transactions: recentTransactions,
      recentTransactions,
      walletBalance,
      monthTransactionCount,
      monthSuccessRate,
      qrCode: req.session.qrCode || null,
      stats,
      pinSuccessMessage,
      kycStatus,
      kycTier,
      kycRecord,
      transactionLimitWidget,
      topSpendingCategory,
      topSpendingAmount,
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
