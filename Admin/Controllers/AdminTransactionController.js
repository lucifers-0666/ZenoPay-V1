const TransactionHistory = require("../../Models/TransactionHistory");

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && typeof value.toString === "function") {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const inferTypeAndMethod = (doc) => {
  const text = `${doc.Description || ""} ${doc.SenderBank || ""} ${doc.ReceiverBank || ""}`.toLowerCase();

  if (text.includes("refund") || text.includes("reversal")) {
    return { type: "Refund", method: "Refund" };
  }
  if (text.includes("wallet")) {
    return { type: "Wallet", method: "Wallet" };
  }
  if (text.includes("card") || text.includes("visa") || text.includes("master")) {
    return { type: "Card", method: "Credit Card" };
  }
  if (text.includes("imps")) {
    return { type: "IMPS", method: "Net Banking" };
  }
  if (text.includes("neft") || text.includes("rtgs")) {
    return { type: "NEFT", method: "Net Banking" };
  }
  if (text.includes("upi") || text.includes("@")) {
    return { type: "UPI", method: "UPI" };
  }
  return { type: "Wallet", method: "Wallet" };
};

const inferRisk = (doc, amount, status, isFlagged) => {
  let risk = 18;
  if (amount >= 50000) risk += 30;
  else if (amount >= 10000) risk += 18;
  else if (amount >= 5000) risk += 10;

  if (status === "failed") risk += 28;
  if (status === "pending") risk += 10;
  if (isFlagged) risk += 25;
  if (String(doc.Description || "").toLowerCase().includes("refund")) risk += 12;

  risk = Math.max(5, Math.min(99, risk));

  let level = "low";
  if (risk > 70) level = "high";
  else if (risk > 40) level = "medium";

  return { score: risk, level };
};

const normalizeTransaction = (doc) => {
  const amount = toNumber(doc.Amount);
  const txDate = doc.TransactionTime ? new Date(doc.TransactionTime) : new Date();
  const { type, method } = inferTypeAndMethod(doc);
  const rawStatus = String(doc.Status || "success").toLowerCase();
  const isFlagged = Boolean(doc.IsFlagged);
  const status = isFlagged ? "flagged" : rawStatus;
  const risk = inferRisk(doc, amount, rawStatus, isFlagged);
  const refSeed = String(doc.TransactionID || "000000000").padStart(9, "0");

  return {
    id: String(doc.TransactionID),
    txnId: `#TXN-${txDate.getFullYear()}-${String(doc.TransactionID).padStart(6, "0")}`,
    transactionId: String(doc.TransactionID),
    upiRef: refSeed.slice(-9),
    type,
    method,
    status,
    isFlagged,
    amount,
    fee: Math.max(0.5, +(amount * 0.001).toFixed(2)),
    direction: String(doc.Description || "").toLowerCase().includes("refund") ? "refund" : "debit",
    sender: {
      name: doc.SenderHolderName || "Unknown Sender",
      account: doc.SenderAccountNumber || "XXXX",
      bank: doc.SenderBank || "Bank",
      type: "User",
      userId: null,
    },
    receiver: {
      name: doc.ReceiverHolderName || "Unknown Receiver",
      account: doc.ReceiverAccountNumber || "XXXX",
      bank: doc.ReceiverBank || "Bank",
      type: "Merchant",
      userId: null,
      external: !String(doc.ReceiverBank || "").toLowerCase().includes("zenopay"),
    },
    description: doc.Description || "Payment transaction",
    time: txDate,
    risk,
  };
};

// GET All Transactions
const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 200;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const searchQuery = search
      ? {
          $or: [
            { TransactionID: { $regex: search, $options: "i" } },
            { SenderHolderName: { $regex: search, $options: "i" } },
            { ReceiverHolderName: { $regex: search, $options: "i" } },
            { SenderAccountNumber: { $regex: search, $options: "i" } },
            { ReceiverAccountNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const transactions = await TransactionHistory.find(searchQuery)
      .sort({ TransactionTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalTransactions = await TransactionHistory.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalTransactions / limit);

    // Get total transaction amount
    const amountStats = await TransactionHistory.aggregate([
      { $match: searchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    const totalAmount = amountStats.length > 0 ? amountStats[0].totalAmount : 0;

    const normalizedTransactions = transactions.map(normalizeTransaction);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTransactions = normalizedTransactions.filter((tx) => tx.time >= startOfDay);

    const totalToday = todayTransactions.length;
    const volumeToday = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const successToday = todayTransactions.filter((tx) => tx.status === "success").length;
    const failedToday = todayTransactions.filter((tx) => tx.status === "failed").length;
    const flaggedToday = todayTransactions.filter((tx) => tx.status === "flagged" || tx.isFlagged).length;
    const successRate = totalToday ? +(successToday / totalToday * 100).toFixed(1) : 0;

    const recentLive = normalizedTransactions.slice(0, 3).map((tx) => ({
      id: tx.txnId,
      amount: tx.amount,
      status: tx.status,
    }));

    res.render("admin/transactions/admin-transactions", {
      pageTitle: "All Transactions",
      currentPage: "transactions",
      adminPage: "transactions",
      hideBreadcrumb: true,
      admin: req.session.user,
      transactions: normalizedTransactions,
      summary: {
        totalToday,
        volumeToday,
        successRate,
        flaggedToday,
        failedToday,
        recentLive,
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalTransactions,
      },
      totalAmount: toNumber(totalAmount),
      search,
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).send("Error loading transactions");
  }
};

// GET Flagged Transactions
const getFlaggedTransactions = async (req, res) => {
  try {
    const flaggedTransactions = await TransactionHistory.find({ IsFlagged: true })
      .sort({ TransactionTime: -1 })
      .limit(250)
      .lean();

    const normalized = flaggedTransactions.map((doc) => {
      const n = normalizeTransaction(doc);
      return {
        ...n,
        flagReason: doc.FlagReason || "Suspicious Activity",
        flaggedAt: doc.FlaggedAt || doc.TransactionTime || new Date(),
        reviewStatus: doc.ReviewStatus || "under_review",
        userName: doc.SenderHolderName || "Unknown User",
        userEmail: doc.SenderEmail || "",
      };
    });

    const highRiskCount = normalized.filter((tx) => Number(tx.risk?.score || 0) > 70).length;
    const flaggedVolume = normalized.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    res.render("admin/transactions/admin-flagged-transactions", {
      pageTitle: "Flagged Transactions",
      currentPage: "transactions",
      adminPage: "transactions",
      hideBreadcrumb: true,
      admin: req.session.user,
      transactions: normalized,
      stats: {
        totalFlagged: normalized.length,
        highRisk: highRiskCount,
        flaggedVolume,
        resolvedMonth: 28,
      },
    });
  } catch (error) {
    console.error("Get flagged transactions error:", error);
    res.status(500).send("Error loading flagged transactions");
  }
};

// GET Failed Transactions
const getFailedTransactions = async (req, res) => {
  try {
    // Assuming you'll add Status field to TransactionHistory model
    const failedTransactions = await TransactionHistory.find({ Status: "failed" })
      .sort({ TransactionTime: -1 });

    res.render("admin/transactions/admin-transaction-failed", {
      pageTitle: "Admin Transaction Failed",
      currentPage: "transactions",
      admin: req.session.user,
      transactions: failedTransactions,
    });
  } catch (error) {
    console.error("Get failed transactions error:", error);
    res.status(500).send("Error loading failed transactions");
  }
};

// GET Transaction Details
const getTransactionDetails = async (req, res) => {
  try {
    const transactionId = req.params.id;
    
    const transaction = await TransactionHistory.findOne({ 
      TransactionID: transactionId 
    });

    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }

    res.render("admin/transactions/admin-transaction-details", {
      pageTitle: "Admin Transaction Details",
      currentPage: "transactions",
      adminPage: "transactions",
      hideBreadcrumb: true,
      admin: req.session.user,
      transaction,
    });
  } catch (error) {
    console.error("Get transaction details error:", error);
    res.status(500).send("Error loading transaction details");
  }
};

// Flag Transaction
const flagTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { reason } = req.body;
    
    await TransactionHistory.findOneAndUpdate(
      { TransactionID: transactionId },
      { 
        $set: { 
          IsFlagged: true,
          FlagReason: reason,
          FlaggedAt: new Date(),
          FlaggedBy: req.session.user.ZenoPayID,
        } 
      }
    );

    res.json({ success: true, message: "Transaction flagged successfully" });
  } catch (error) {
    console.error("Flag transaction error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllTransactions,
  getFlaggedTransactions,
  getFailedTransactions,
  getTransactionDetails,
  flagTransaction,
};
