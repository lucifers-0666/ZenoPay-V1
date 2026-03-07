const TransactionHistory = require("../../Models/TransactionHistory");
const { sanitizeDateRange } = require("../../utils/dateUtils");

const parseTxnNumericId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildTxnLookupQuery = (idParam) => {
  const numericId = parseTxnNumericId(idParam);
  if (numericId !== null) {
    return { TransactionID: numericId };
  }
  return { TransactionID: idParam };
};

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

    res.locals.adminPage = "flagged";
    res.render("admin/transactions/admin-flagged-transactions", {
      pageTitle: "Flagged Transactions",
      currentPage: "transactions",
      adminPage: "flagged",
      page: "flagged",
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
const failedTransactions = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const type = String(req.query.type || "").trim();
    const reason = String(req.query.reason || "").trim();
    const rawDateFrom = String(req.query.dateFrom || "").trim();
    const rawDateTo = String(req.query.dateTo || "").trim();
    const sanitizedDates = sanitizeDateRange(rawDateFrom, rawDateTo);
    const dateFrom = sanitizedDates.dateFrom || "";
    const dateTo = sanitizedDates.dateTo || "";
    const fromDate = sanitizedDates.fromDate;
    const toDateEnd = sanitizedDates.toDateEnd;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const parsedLimit = parseInt(req.query.limit, 10) || 10;
    const allowedLimits = [10, 20, 25, 50, 100];
    const safeLimit = allowedLimits.includes(parsedLimit) ? parsedLimit : 10;
    const skip = (page - 1) * safeLimit;

    const failedStatuses = ["failed", "Failed", "FAILED", "declined", "Declined"];
    const query = {
      Status: { $in: failedStatuses },
    };

    if (search) {
      const regex = { $regex: search, $options: "i" };
      const numericSearch = parseTxnNumericId(search);
      query.$or = [
        { Description: regex },
        { SenderHolderName: regex },
        { ReceiverHolderName: regex },
        { SenderAccountNumber: regex },
        { ReceiverAccountNumber: regex },
        ...(numericSearch !== null ? [{ TransactionID: numericSearch }] : []),
      ];
    }

    if (type && type.toLowerCase() !== "all") {
      const normalizedType = String(type).toLowerCase();
      if (normalizedType === "refund") {
        query.Description = { $regex: "refund|reversal", $options: "i" };
      } else if (normalizedType === "wallet_topup") {
        query.Description = { $regex: "top\s*-?up|wallet\s*top", $options: "i" };
      } else if (normalizedType === "withdrawal") {
        query.Description = { $regex: "withdraw|payout", $options: "i" };
      } else if (normalizedType === "merchant_payment") {
        query.Description = { $regex: "merchant|payment", $options: "i" };
      } else if (normalizedType === "p2p_transfer") {
        query.Description = { $regex: "transfer|p2p|send", $options: "i" };
      }
    }

    if (reason) {
      const reasonRegexMap = {
        "network timeout": "timeout|network",
        "insufficient funds": "insufficient|balance",
        "invalid account": "invalid|beneficiary|account",
        declined: "decline|declined",
      };
      const key = reason.toLowerCase();
      const reasonPattern = reasonRegexMap[key] || reason;
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { FailureReason: { $regex: reasonPattern, $options: "i" } },
          { Description: { $regex: reasonPattern, $options: "i" } },
        ],
      });
    }

    if (fromDate || toDateEnd) {
      query.TransactionTime = {};
      if (fromDate) query.TransactionTime.$gte = fromDate;
      if (toDateEnd) query.TransactionTime.$lte = toDateEnd;
      if (!query.TransactionTime.$gte && !query.TransactionTime.$lte) {
        delete query.TransactionTime;
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [transactions, totalCount, totalFailed, failedToday, totalAmountAgg] = await Promise.all([
      TransactionHistory.find(query)
        .sort({ TransactionTime: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .catch(() => []),
      TransactionHistory.countDocuments(query).catch(() => 0),
      TransactionHistory.countDocuments({ Status: { $in: failedStatuses } }).catch(() => 0),
      TransactionHistory.countDocuments({
        Status: { $in: failedStatuses },
        TransactionTime: { $gte: startOfDay, $lte: endOfDay },
      }).catch(() => 0),
      TransactionHistory.aggregate([
        { $match: { Status: { $in: failedStatuses } } },
        { $group: { _id: null, total: { $sum: "$Amount" } } },
      ]).catch(() => []),
    ]);

    const failureReasonFromDescription = (description = "") => {
      const text = String(description).toLowerCase();
      if (text.includes("insufficient") || text.includes("balance")) return "Insufficient Balance";
      if (text.includes("timeout") || text.includes("network")) return "Network Timeout";
      if (text.includes("beneficiary") || text.includes("account")) return "Invalid Beneficiary";
      if (text.includes("decline") || text.includes("declined")) return "Bank Declined";
      if (text.includes("limit")) return "Daily Limit Exceeded";
      if (text.includes("fraud")) return "Fraud Detected";
      return "Unknown Error";
    };

    const formattedTransactions = transactions.map((tx) => {
      const normalized = normalizeTransaction(tx);
      return {
        ...normalized,
        _id: String(tx._id),
        transactionId: String(tx.TransactionID || ""),
        typeKey:
          normalized.type === "Refund"
            ? "refund"
            : normalized.type === "Wallet"
              ? "wallet_topup"
              : normalized.type === "UPI"
                ? "p2p_transfer"
                : normalized.type === "Card"
                  ? "merchant_payment"
                  : normalized.type === "NEFT" || normalized.type === "IMPS"
                    ? "withdrawal"
                    : "all",
        senderLabel: tx.SenderHolderName || tx.SenderAccountNumber || "—",
        receiverLabel: tx.ReceiverHolderName || tx.ReceiverAccountNumber || "—",
        amount: toNumber(tx.Amount),
        failureReason: tx.FailureReason || failureReasonFromDescription(tx.Description),
        gatewayResponse: tx.GatewayResponse || tx.Description || "No gateway response",
        retryCount: Number(tx.retryCount || 0),
        isFlagged: Boolean(tx.IsFlagged),
      };
    });

    res.locals.adminPage = "failed";
    return res.render("admin/transactions/admin-failed-transactions", {
      pageTitle: "Failed Transactions",
      currentPage: "transactions",
      adminPage: "failed",
      page: "failed",
      hideBreadcrumb: true,
      admin: req.session.user,
      transactions: formattedTransactions,
      totalCount,
      totalFailed,
      failedToday,
      totalAmount: totalAmountAgg[0] ? toNumber(totalAmountAgg[0].total) : 0,
      retrySuccessRate: 0,
      currentPageNumber: page,
      perPage: safeLimit,
      totalPages: Math.max(1, Math.ceil(totalCount / safeLimit)),
      filters: {
        search,
        type,
        reason,
        dateFrom,
        dateTo,
      },
    });
  } catch (error) {
    console.error("Get failed transactions error:", error);
    res.locals.adminPage = "failed";
    return res.render("admin/transactions/admin-failed-transactions", {
      pageTitle: "Failed Transactions",
      currentPage: "transactions",
      adminPage: "failed",
      page: "failed",
      hideBreadcrumb: true,
      admin: req.session?.user,
      transactions: [],
      totalCount: 0,
      totalFailed: 0,
      failedToday: 0,
      totalAmount: 0,
      retrySuccessRate: 0,
      currentPageNumber: 1,
      perPage: 10,
      totalPages: 1,
      filters: {
        search: "",
        type: "",
        reason: "",
        dateFrom: "",
        dateTo: "",
      },
      error: `Unable to load transactions. ${error?.message || "Unknown error"}`,
    });
  }
};

const getFailedTransactions = failedTransactions;

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
const retryTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const query = buildTxnLookupQuery(transactionId);

    const transaction = await TransactionHistory.findOne(query);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    transaction.Status = "pending";
    transaction.retryCount = Number(transaction.retryCount || 0) + 1;
    await transaction.save();

    return res.json({
      success: true,
      message: "Transaction moved to pending for retry",
      retryCount: transaction.retryCount,
    });
  } catch (error) {
    console.error("Retry transaction error:", error);
    return res.status(500).json({ success: false, message: "Failed to retry transaction" });
  }
};

// Flag Transaction
const flagTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { reason, notes } = req.body;
    const query = buildTxnLookupQuery(transactionId);

    const transaction = await TransactionHistory.findOne(query);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    transaction.IsFlagged = true;
    transaction.FlagReason = reason || "Suspicious Activity";
    transaction.flagNotes = notes || "";
    transaction.FlaggedAt = new Date();
    transaction.FlaggedBy = req.session?.user?.ZenoPayID || null;
    await transaction.save();

    res.json({ success: true, message: "Transaction flagged successfully" });
  } catch (error) {
    console.error("Flag transaction error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const bulkRetryTransactions = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ success: false, message: "No transaction IDs provided" });
    }

    const numericIds = ids.map(parseTxnNumericId).filter((v) => v !== null);
    const transactions = await TransactionHistory.find({ TransactionID: { $in: numericIds } })
      .select("_id retryCount")
      .lean();

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: "No matching transactions found" });
    }

    const operations = transactions.map((tx) => ({
      updateOne: {
        filter: { _id: tx._id },
        update: {
          $set: {
            Status: "pending",
            retryCount: Number(tx.retryCount || 0) + 1,
          },
        },
      },
    }));

    const result = await TransactionHistory.bulkWrite(operations);
    const modifiedCount = Number(result.modifiedCount || result.nModified || operations.length || 0);

    return res.json({
      success: true,
      message: `Retried ${modifiedCount} transaction(s)`,
      modifiedCount,
    });
  } catch (error) {
    console.error("Bulk retry transaction error:", error);
    return res.status(500).json({ success: false, message: "Failed bulk retry" });
  }
};

const bulkFlagTransactions = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const { reason, notes } = req.body;
    if (!ids.length) {
      return res.status(400).json({ success: false, message: "No transaction IDs provided" });
    }

    const numericIds = ids.map(parseTxnNumericId).filter((v) => v !== null);
    const result = await TransactionHistory.updateMany(
      { TransactionID: { $in: numericIds } },
      {
        $set: {
          IsFlagged: true,
          FlagReason: reason || "Suspicious Activity",
          flagNotes: notes || "",
          FlaggedAt: new Date(),
          FlaggedBy: req.session?.user?.ZenoPayID || null,
        },
      }
    );

    return res.json({
      success: true,
      message: `Flagged ${result.modifiedCount || 0} transaction(s)`,
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("Bulk flag transaction error:", error);
    return res.status(500).json({ success: false, message: "Failed bulk flag" });
  }
};

const exportTransactions = async (req, res) => {
  try {
    const { ids, status } = req.query;

    const query = {};
    if (status) {
      query.Status = String(status).toLowerCase();
    }

    if (ids) {
      const idArray = String(ids)
        .split(",")
        .map((id) => parseTxnNumericId(id.trim()))
        .filter((id) => id !== null);
      if (idArray.length) {
        query.TransactionID = { $in: idArray };
      }
    }

    const rows = await TransactionHistory.find(query).sort({ TransactionTime: -1 }).lean();

    const header = [
      "Transaction ID",
      "Status",
      "Type",
      "Amount",
      "Sender",
      "Receiver",
      "Failure Reason",
      "Description",
      "Date",
    ];

    const mapReason = (description = "") => {
      const text = String(description).toLowerCase();
      if (text.includes("insufficient") || text.includes("balance")) return "Insufficient Balance";
      if (text.includes("timeout") || text.includes("network")) return "Network Timeout";
      if (text.includes("beneficiary") || text.includes("account")) return "Invalid Beneficiary";
      if (text.includes("decline") || text.includes("declined")) return "Bank Declined";
      if (text.includes("limit")) return "Daily Limit Exceeded";
      if (text.includes("fraud")) return "Fraud Detected";
      return "Unknown Error";
    };

    const csvRows = rows.map((tx) => {
      const inferred = inferTypeAndMethod(tx);
      return [
        tx.TransactionID,
        tx.Status || "",
        inferred.type,
        toNumber(tx.Amount),
        tx.SenderHolderName || tx.SenderAccountNumber || "",
        tx.ReceiverHolderName || tx.ReceiverAccountNumber || "",
        tx.FailureReason || mapReason(tx.Description),
        tx.Description || "",
        tx.TransactionTime ? new Date(tx.TransactionTime).toISOString() : "",
      ];
    });

    const csv = [header, ...csvRows]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=transactions-${status || "all"}-${Date.now()}.csv`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export transactions error:", error);
    return res.status(500).json({ success: false, message: "Failed to export transactions" });
  }
};

module.exports = {
  getAllTransactions,
  getFlaggedTransactions,
  failedTransactions,
  getFailedTransactions,
  getTransactionDetails,
  retryTransaction,
  flagTransaction,
  bulkRetryTransactions,
  bulkFlagTransactions,
  exportTransactions,
};
