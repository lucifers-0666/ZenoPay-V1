const CashbackRule = require("../Models/CashbackRule");
const CashbackTransaction = require("../Models/CashbackTransaction");
const Wallet = require("../Models/Wallet");
const ZenoPayUser = require("../Models/ZenoPayUser");

const ensureDefaultRule = async () => {
  const existing = await CashbackRule.findOne().lean();
  if (existing) return existing;

  return CashbackRule.create({
    ruleType: "flat_percent",
    percent: 1,
    maxCashback: 25,
    minTransactionAmount: 100,
    isActive: true,
    validFrom: new Date(),
  });
};

const processCashback = async (userId, transactionId, transactionAmount) => {
  try {
    if (!userId || !transactionId) {
      return { cashbackAmount: 0 };
    }

    await ensureDefaultRule();

    const now = new Date();
    const activeRule = await CashbackRule.findOne({
      isActive: true,
      minTransactionAmount: { $lte: Number(transactionAmount || 0) },
      validFrom: { $lte: now },
      $or: [{ validUntil: null }, { validUntil: { $gte: now } }],
    })
      .sort({ percent: -1, minTransactionAmount: -1 })
      .lean();

    if (!activeRule) {
      return { cashbackAmount: 0 };
    }

    let cashbackAmount = (Number(transactionAmount || 0) * Number(activeRule.percent || 0)) / 100;
    if (Number(activeRule.maxCashback || 0) > 0) {
      cashbackAmount = Math.min(cashbackAmount, Number(activeRule.maxCashback));
    }

    cashbackAmount = Number(cashbackAmount.toFixed(2));

    if (!(cashbackAmount > 0)) {
      return { cashbackAmount: 0 };
    }

    const cashbackTxn = await CashbackTransaction.create({
      userId,
      transactionId,
      amount: cashbackAmount,
      percent: Number(activeRule.percent || 0),
      status: "pending",
    });

    // Immediate credit for demo mode.
    const wallet = await Wallet.findOne({ userId });
    if (wallet) {
      wallet.balance = Number(wallet.balance || 0) + cashbackAmount;
      await wallet.save();
    }

    await ZenoPayUser.findByIdAndUpdate(userId, {
      $inc: { balance: cashbackAmount },
    });

    cashbackTxn.status = "credited";
    cashbackTxn.creditedAt = new Date();
    await cashbackTxn.save();

    return {
      cashbackAmount,
      cashbackTransactionId: cashbackTxn._id,
    };
  } catch (error) {
    console.error("[Cashback] processCashback failed:", error.message);
    return { cashbackAmount: 0 };
  }
};

module.exports = {
  processCashback,
  ensureDefaultRule,
};
