const mongoose = require("mongoose");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const { comparePin } = require("../utils/cardSecurity");

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

const toDecimal128 = (value) => mongoose.Types.Decimal128.fromString(String(Number(value || 0).toFixed(2)));

const getSessionZenoPayId = (req) => {
  return (
    req.session?.user?.ZenoPayID ||
    req.session?.user?.ZenoPayId ||
    req.session?.user?.zenoPayId ||
    null
  );
};

const maskAccount = (accountNumber) => {
  const raw = String(accountNumber || "").replace(/\s+/g, "");
  const last4 = raw.slice(-4);
  return last4 ? `XXXX XXXX ${last4}` : "XXXX XXXX 0000";
};

const getNextTransactionID = async () => {
  const last = await TransactionHistory.findOne().sort({ TransactionID: -1 }).select("TransactionID").lean();
  const current = Number(last?.TransactionID || 100000);
  return current + 1;
};

const getUserAccounts = async (zenoPayId) => {
  const accounts = await BankAccount.find({ ZenoPayId: zenoPayId }).lean();
  return accounts || [];
};

const mapAccountForView = (account) => ({
  id: String(account._id),
  bankName: account.BankName,
  holder: account.FullName,
  accountMasked: maskAccount(account.AccountNumber),
  ifsc: account.BankId,
});

const getAddMoneyPage = async (req, res) => {
  try {
    const zenoPayId = getSessionZenoPayId(req) || "ZP-DEMO2024";
    const accounts = await getUserAccounts(zenoPayId);

    const totalBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.Balance), 0);

    return res.render("add-money", {
      pageTitle: "Add Money - ZenoPay",
      isLoggedIn: !!req.session?.isLoggedIn,
      user: req.session?.user || null,
      balance: totalBalance,
      accounts: accounts.map(mapAccountForView),
    });
  } catch (error) {
    console.error("[Wallet] getAddMoneyPage error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getWithdrawPage = async (req, res) => {
  try {
    const zenoPayId = getSessionZenoPayId(req) || "ZP-DEMO2024";
    const accounts = await getUserAccounts(zenoPayId);
    const totalBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.Balance), 0);

    return res.render("withdraw", {
      pageTitle: "Withdraw Funds - ZenoPay",
      isLoggedIn: !!req.session?.isLoggedIn,
      user: req.session?.user || null,
      balance: totalBalance,
      accounts: accounts.map(mapAccountForView),
    });
  } catch (error) {
    console.error("[Wallet] getWithdrawPage error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const addMoney = async (req, res) => {
  try {
    const zenoPayId = getSessionZenoPayId(req);
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Please login first" });
    }

    const { amount, paymentMethod = "upi", upiId = "", cardLast4 = "", note = "" } = req.body || {};
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 100 || numericAmount > 100000) {
      return res.status(400).json({
        success: false,
        message: "Amount must be between ₹100 and ₹1,00,000",
      });
    }

    const account = await BankAccount.findOne({ ZenoPayId: zenoPayId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No linked bank account found. Please open an account first.",
      });
    }

    const beforeBalance = toNumber(account.Balance);
    const afterBalance = beforeBalance + numericAmount;
    account.Balance = toDecimal128(afterBalance);
    await account.save();

    const transactionId = await getNextTransactionID();
    await TransactionHistory.create({
      TransactionID: transactionId,
      TransactionTime: new Date(),
      SenderBank: paymentMethod.toUpperCase(),
      SenderAccountNumber: paymentMethod === "upi" ? (upiId || "UPI") : (cardLast4 ? `****${cardLast4}` : "External"),
      SenderHolderName: req.session?.user?.FullName || req.session?.user?.Name || "Customer",
      SenderBalanceBefore: toDecimal128(0),
      SenderBalanceAfter: toDecimal128(0),
      ReceiverBank: account.BankName,
      ReceiverAccountNumber: account.AccountNumber,
      ReceiverHolderName: account.FullName,
      ReceiverBalanceBefore: toDecimal128(beforeBalance),
      ReceiverBalanceAfter: toDecimal128(afterBalance),
      Amount: toDecimal128(numericAmount),
      Description: note || `Wallet top-up via ${paymentMethod.toUpperCase()}`,
      Status: "success",
    });

    return res.json({
      success: true,
      message: "Money added successfully",
      data: {
        transactionId,
        amount: numericAmount,
        newBalance: Number(afterBalance.toFixed(2)),
        status: "success",
      },
    });
  } catch (error) {
    console.error("[Wallet] addMoney error:", error);
    return res.status(500).json({ success: false, message: "Failed to add money" });
  }
};

const withdrawMoney = async (req, res) => {
  try {
    const zenoPayId = getSessionZenoPayId(req);
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Please login first" });
    }

    const {
      amount,
      mode = "upi",
      pin = "",
      note = "",
      destination = {},
    } = req.body || {};

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid withdrawal amount" });
    }

    const account = await BankAccount.findOne({ ZenoPayId: zenoPayId });
    if (!account) {
      return res.status(404).json({ success: false, message: "No linked account found" });
    }

    // Optional but useful PIN check against existing account PIN
    if (String(pin || "").trim()) {
      let pinValid = true;

      if (account.CardPINHash) {
        pinValid = await comparePin(pin, account.CardPINHash);
      } else if (String(account.CardPIN || "").trim()) {
        pinValid = String(account.CardPIN).trim() === String(pin).trim();
      }

      if (!pinValid) {
        return res.status(400).json({ success: false, message: "Invalid transaction PIN" });
      }
    }

    const beforeBalance = toNumber(account.Balance);
    if (numericAmount > beforeBalance) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    const fee = mode === "imps" ? 5 : 0;
    const gst = fee > 0 ? fee * 0.18 : 0;
    const netReceived = Math.max(0, numericAmount - fee - gst);

    const afterBalance = beforeBalance - numericAmount;
    account.Balance = toDecimal128(afterBalance);
    await account.save();

    const transactionId = await getNextTransactionID();
    const status = mode === "neft" ? "pending" : "success";

    await TransactionHistory.create({
      TransactionID: transactionId,
      TransactionTime: new Date(),
      SenderBank: account.BankName,
      SenderAccountNumber: account.AccountNumber,
      SenderHolderName: account.FullName,
      SenderBalanceBefore: toDecimal128(beforeBalance),
      SenderBalanceAfter: toDecimal128(afterBalance),
      ReceiverBank: destination.bank || "External Bank",
      ReceiverAccountNumber: destination.mask || "External Account",
      ReceiverHolderName: destination.holder || account.FullName,
      ReceiverBalanceBefore: toDecimal128(0),
      ReceiverBalanceAfter: toDecimal128(netReceived),
      Amount: toDecimal128(numericAmount),
      Description: note || `Withdrawal via ${mode.toUpperCase()}`,
      Status: status,
    });

    return res.json({
      success: true,
      message: status === "pending" ? "Withdrawal initiated" : "Withdrawal successful",
      data: {
        transactionId,
        amount: numericAmount,
        fee: Number(fee.toFixed(2)),
        gst: Number(gst.toFixed(2)),
        netReceived: Number(netReceived.toFixed(2)),
        newBalance: Number(afterBalance.toFixed(2)),
        status,
        estimatedArrival: mode === "neft" ? "2–4 hours" : "Instant",
      },
    });
  } catch (error) {
    console.error("[Wallet] withdrawMoney error:", error);
    return res.status(500).json({ success: false, message: "Failed to process withdrawal" });
  }
};

module.exports = {
  getAddMoneyPage,
  getWithdrawPage,
  addMoney,
  withdrawMoney,
};
