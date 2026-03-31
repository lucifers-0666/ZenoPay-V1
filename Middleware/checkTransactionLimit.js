/**
 * Transaction Limits Middleware
 * Enforces single, daily and weekly limits based on user KYC tier.
 */

const mongoose = require("mongoose");
const { getLimitsByTier } = require("../config/transactionLimits");
const ZenoPayUser = require("../Models/ZenoPayUser");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const WalletTransaction = require("../Models/Transaction");
const ScheduledPayment = require("../Models/ScheduledPayment");

const respondLimitError = (req, res, payload) => {
  const wantsJson =
    req.originalUrl.startsWith("/api/") ||
    req.xhr ||
    String(req.headers.accept || "").includes("application/json");

  if (wantsJson) {
    return res.status(400).json(payload);
  }

  const fallbackPath = req.originalUrl.includes("/withdraw") ? "/withdraw" : "/wallet/send";
  req.session.walletFlash = {
    type: "error",
    message: `${payload.message} View /user/limits to check your usage and upgrade KYC.`,
  };
  return res.redirect(fallbackPath);
};

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

const resolveCurrentUser = async (sessionUser = {}) => {
  const userId = sessionUser?._id;
  const zenoPayId =
    sessionUser?.ZenoPayID ||
    sessionUser?.ZenoPayId ||
    sessionUser?.zenoPayId ||
    null;

  if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
    const byId = await ZenoPayUser.findById(userId).select("_id kycTier ZenoPayID").lean();
    if (byId) return byId;
  }

  if (zenoPayId) {
    return ZenoPayUser.findOne({
      $or: [{ ZenoPayID: zenoPayId }, { userId: zenoPayId }],
    })
      .select("_id kycTier ZenoPayID")
      .lean();
  }

  return null;
};

const resolveTransactionAmount = async (req) => {
  const rawAmount = req.body?.amount ?? req.body?.Amount;
  const parsed = Number(rawAmount);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  if (req.params?.id && req.path?.includes("scheduled-payments") && req.path?.includes("pay-now")) {
    const sessionZenoPayId =
      req.session?.user?.ZenoPayID ||
      req.session?.user?.ZenoPayId ||
      req.session?.user?.zenoPayId ||
      null;

    if (!sessionZenoPayId) return NaN;

    const scheduledPayment = await ScheduledPayment.findOne({
      _id: req.params.id,
      ZenoPayId: sessionZenoPayId,
    })
      .select("amount")
      .lean();

    return Number(scheduledPayment?.amount || 0);
  }

  return NaN;
};

const sumUsageInRange = async ({ userId, zenoPayId, from, to }) => {
  const walletAgg = await WalletTransaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(userId)),
        createdAt: { $gte: from, $lte: to },
        type: "send",
        status: "completed",
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const accountRows = await BankAccount.find({ ZenoPayId: zenoPayId })
    .select("AccountNumber")
    .lean();
  const accountNumbers = (accountRows || []).map((row) => row.AccountNumber).filter(Boolean);

  let bankTotal = 0;
  if (accountNumbers.length > 0) {
    const bankAgg = await TransactionHistory.aggregate([
      {
        $match: {
          SenderAccountNumber: { $in: accountNumbers },
          TransactionTime: { $gte: from, $lte: to },
          Status: "success",
        },
      },
      { $group: { _id: null, total: { $sum: "$Amount" } } },
    ]);
    bankTotal = toNumber(bankAgg?.[0]?.total || 0);
  }

  return toNumber(walletAgg?.[0]?.total || 0) + bankTotal;
};

const checkTransactionLimit = async (req, res, next) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in to proceed with this transaction",
      });
    }

    const currentUser = await resolveCurrentUser(req.session.user);
    if (!currentUser?._id) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const amount = await resolveTransactionAmount(req);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction amount",
      });
    }

    const kycTier = Number(currentUser.kycTier || 0);
    const limits = getLimitsByTier(kycTier);

    if (amount > limits.singleTxLimit) {
      return respondLimitError(req, res, {
        success: false,
        message: `Single transaction limit exceeded. Maximum allowed: ₹${limits.singleTxLimit.toLocaleString("en-IN")}.`,
        errorType: "SINGLE_TX_LIMIT_EXCEEDED",
        limit: limits.singleTxLimit,
        amount,
      });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const dailyUsed = await sumUsageInRange({
      userId: currentUser._id,
      zenoPayId: currentUser.ZenoPayID,
      from: startOfToday,
      to: endOfToday,
    });

    const weeklyUsed = await sumUsageInRange({
      userId: currentUser._id,
      zenoPayId: currentUser.ZenoPayID,
      from: startOfWeek,
      to: endOfToday,
    });

    if (dailyUsed + amount > limits.dailyLimit) {
      const remaining = Math.max(0, limits.dailyLimit - dailyUsed);
      return respondLimitError(req, res, {
        success: false,
        message: `Daily transaction limit exceeded. Remaining today: ₹${remaining.toLocaleString("en-IN")}.`,
        errorType: "DAILY_LIMIT_EXCEEDED",
        limit: limits.dailyLimit,
        used: dailyUsed,
        remaining,
        amount,
      });
    }

    if (weeklyUsed + amount > limits.weeklyLimit) {
      const remaining = Math.max(0, limits.weeklyLimit - weeklyUsed);
      return respondLimitError(req, res, {
        success: false,
        message: `Weekly transaction limit exceeded. Remaining this week: ₹${remaining.toLocaleString("en-IN")}.`,
        errorType: "WEEKLY_LIMIT_EXCEEDED",
        limit: limits.weeklyLimit,
        used: weeklyUsed,
        remaining,
        amount,
      });
    }

    req.transactionLimit = {
      kycTier,
      tierName: limits.description,
      limits,
      dailyUsed,
      weeklyUsed,
      dailyRemaining: Math.max(0, limits.dailyLimit - dailyUsed),
      weeklyRemaining: Math.max(0, limits.weeklyLimit - weeklyUsed),
    };

    return next();
  } catch (error) {
    console.error("[Limits] checkTransactionLimit error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to validate transaction limits right now. Please try again.",
    });
  }
};

module.exports = checkTransactionLimit;
