const TransactionHistory = require("../Models/TransactionHistory");
const Transaction = require("../Models/Transaction");
const ZenoPayUser = require("../Models/ZenoPayUser");
const BankAccount = require("../Models/BankAccount");
const Receipt = require("../Models/Receipt");
const mongoose = require("mongoose");
const crypto = require("crypto");

const normalizeAccountNumber = (value = "") => String(value || "").replace(/\D/g, "");

const parseStatus = (status = "pending") => {
  const s = String(status || "pending").toLowerCase();
  if (s.includes("success") || s.includes("complete")) return "success";
  if (s.includes("fail") || s.includes("declin")) return "failed";
  return "pending";
};

const inferPaymentMethod = (transaction) => {
  const source = String(transaction?.Type || transaction?.Description || "").toLowerCase();
  if (source.includes("upi")) return "UPI";
  if (source.includes("card")) return "Card";
  if (source.includes("wallet")) return "Wallet";
  if (source.includes("bank") || source.includes("neft") || source.includes("imps") || source.includes("rtgs")) return "Bank Transfer";
  return "Transfer";
};

const parseDateInput = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getSessionIdentity = (req) => ({
  id: req.session?.user?._id || null,
  zenoPayId:
    req.session?.user?.ZenoPayID ||
    req.session?.user?.ZenoPayId ||
    req.session?.user?.userId ||
    null,
  email: req.session?.user?.Email || req.session?.user?.email || null,
  name:
    req.session?.user?.FullName ||
    req.session?.user?.name ||
    req.session?.user?.Name ||
    "You",
});

const resolveSessionUserDoc = async (req) => {
  const identity = getSessionIdentity(req);

  if (identity.id && mongoose.Types.ObjectId.isValid(identity.id)) {
    const byId = await ZenoPayUser.findById(identity.id).lean();
    if (byId) return byId;
  }

  const or = [];
  if (identity.zenoPayId) {
    or.push({ ZenoPayID: identity.zenoPayId }, { userId: identity.zenoPayId });
  }
  if (identity.email) {
    or.push({ Email: identity.email }, { email: String(identity.email).toLowerCase() });
  }

  if (!or.length) return null;
  return ZenoPayUser.findOne({ $or: or }).lean();
};

const fetchWalletTransactions = async (req) => {
  const userDoc = await resolveSessionUserDoc(req);
  if (!userDoc?._id) return { userDoc: null, rows: [] };

  const rows = await Transaction.find({ userId: userDoc._id })
    .sort({ createdAt: -1 })
    .lean();

  return { userDoc, rows: rows || [] };
};

const getUserAccountBundle = async (req) => {
  const userZenoPayId =
    req.session?.user?.ZenoPayID ||
    req.session?.user?.ZenoPayId ||
    req.session?.user?.userId ||
    null;
  const userEmail = req.session?.user?.Email || req.session?.user?.email || null;

  const accountQuery = [];
  if (userZenoPayId) accountQuery.push({ ZenoPayId: userZenoPayId });
  if (userEmail) accountQuery.push({ Email: userEmail });

  const userAccounts = accountQuery.length
    ? await BankAccount.find({ $or: accountQuery }).lean()
    : [];

  const accountNumbers = userAccounts
    .map((acc) => String(acc.AccountNumber || "").trim())
    .filter(Boolean);
  const normalizedAccountSet = new Set(accountNumbers.map(normalizeAccountNumber).filter(Boolean));

  return { userAccounts, accountNumbers, normalizedAccountSet };
};

const fetchAccountTransactions = async ({ accountNumbers, normalizedAccountSet }) => {
  if (!accountNumbers.length) return [];

  let transactions = await TransactionHistory.find({
    $or: [
      { SenderAccountNumber: { $in: accountNumbers } },
      { ReceiverAccountNumber: { $in: accountNumbers } },
    ],
  }).sort({ TransactionTime: -1 });

  if (!transactions.length && normalizedAccountSet.size > 0) {
    const candidates = await TransactionHistory.find({}).sort({ TransactionTime: -1 }).lean();
    transactions = candidates.filter((txn) => {
      const senderNorm = normalizeAccountNumber(txn?.SenderAccountNumber);
      const receiverNorm = normalizeAccountNumber(txn?.ReceiverAccountNumber);
      return normalizedAccountSet.has(senderNorm) || normalizedAccountSet.has(receiverNorm);
    });
  }

  return transactions;
};

const toHistoryRow = (txn, normalizedAccountSet) => {
  const date = new Date(txn.TransactionTime || txn.createdAt || Date.now());
  if (Number.isNaN(date.getTime())) return null;

  const isCredit = normalizedAccountSet.has(normalizeAccountNumber(txn.ReceiverAccountNumber));
  const amount = parseFloat(txn.Amount?.toString?.() || txn.Amount || 0);
  const status = parseStatus(txn.Status);

  return {
    transactionId: `TXN-${txn.TransactionID}`,
    date: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    type: isCredit ? "credit" : "debit",
    description: isCredit
      ? `Payment from ${txn.SenderHolderName}`
      : `Payment to ${txn.ReceiverHolderName}`,
    bank: isCredit ? txn.SenderBank : txn.ReceiverBank,
    amount,
    isCredit,
    status,
    paymentMethod: inferPaymentMethod(txn),
    senderName: txn.SenderHolderName,
    senderAccountNumber: txn.SenderAccountNumber,
    senderBank: txn.SenderBank,
    receiverName: txn.ReceiverHolderName,
    receiverAccountNumber: txn.ReceiverAccountNumber,
    receiverBank: txn.ReceiverBank,
    createdAt: date.toISOString(),
  };
};

const toWalletHistoryRow = (txn, currentUserName = "You") => {
  const date = new Date(txn.createdAt || Date.now());
  if (Number.isNaN(date.getTime())) return null;

  const normalizedType = String(txn.type || "").toLowerCase();
  const isCredit = normalizedType !== "send";
  const status = parseStatus(txn.status);
  const amount = Number(txn.amount || 0);

  let senderName = "ZenoPay Wallet";
  let receiverName = currentUserName;

  if (normalizedType === "send") {
    senderName = currentUserName;
    receiverName = txn?.metadata?.recipientName || "Recipient";
  } else if (normalizedType === "receive") {
    senderName = txn?.metadata?.senderName || "Sender";
    receiverName = currentUserName;
  } else if (normalizedType === "refund") {
    senderName = "ZenoPay";
    receiverName = currentUserName;
  }

  const paymentMethod = normalizedType === "topup" ? "Wallet Top-up" : "Wallet Transfer";

  return {
    transactionId: `TXN-${txn.reference || String(txn._id || "")}`,
    date: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    type: isCredit ? "credit" : "debit",
    description:
      txn.description ||
      (normalizedType === "send"
        ? `Payment to ${receiverName}`
        : normalizedType === "receive"
          ? `Payment from ${senderName}`
          : normalizedType === "topup"
            ? "Wallet top-up"
            : "Wallet transaction"),
    bank: "ZenoPay Wallet",
    amount,
    isCredit,
    status,
    paymentMethod,
    senderName,
    senderAccountNumber: "Wallet",
    senderBank: "ZenoPay Wallet",
    receiverName,
    receiverAccountNumber: "Wallet",
    receiverBank: "ZenoPay Wallet",
    createdAt: date.toISOString(),
    reference: txn.reference || "",
  };
};

const applyHistoryFilters = (rows = [], query = {}) => {
  const type = String(query.type || "").toLowerCase();
  const status = String(query.status || "").toLowerCase();
  const paymentMethod = String(query.paymentMethod || "").toLowerCase();
  const search = String(query.search || "").toLowerCase();
  const fromDate = parseDateInput(query.fromDate);
  const toDate = parseDateInput(query.toDate);

  if (toDate) toDate.setHours(23, 59, 59, 999);

  return rows.filter((tx) => {
    if (type && String(tx.type || "").toLowerCase() !== type) return false;
    if (status && String(tx.status || "").toLowerCase() !== status) return false;
    if (paymentMethod) {
      const normalizedMethod = String(tx.paymentMethod || "").toLowerCase();
      if (!normalizedMethod.includes(paymentMethod)) return false;
    }

    const txDate = parseDateInput(tx.createdAt || tx.date);
    if (fromDate && (!txDate || txDate < fromDate)) return false;
    if (toDate && (!txDate || txDate > toDate)) return false;

    if (search) {
      const haystack = [
        tx.transactionId,
        tx.description,
        tx.senderName,
        tx.receiverName,
        tx.senderAccountNumber,
        tx.receiverAccountNumber,
        tx.paymentMethod,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      if (!haystack.includes(search)) return false;
    }

    return true;
  });
};

const getTransactionHistory = async (req, res) => {
  try {
    const { userAccounts, accountNumbers, normalizedAccountSet } = await getUserAccountBundle(req);
    const identity = getSessionIdentity(req);

    const [bankTransactions, walletBundle] = await Promise.all([
      fetchAccountTransactions({ accountNumbers, normalizedAccountSet }),
      fetchWalletTransactions(req),
    ]);

    const bankRows = (bankTransactions || [])
      .map((txn) => toHistoryRow(txn, normalizedAccountSet))
      .filter(Boolean);

    const walletRows = (walletBundle?.rows || [])
      .map((txn) => toWalletHistoryRow(txn, identity.name))
      .filter(Boolean);

    const allTransactions = [...bankRows, ...walletRows].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    const groupedTransactions = {};
    const groupedByDate = {};
    let totalCredit = 0;
    let totalDebit = 0;

    allTransactions.forEach((tx) => {
      const date = new Date(tx.createdAt || Date.now());
      const monthYear = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      });

      if (!groupedTransactions[monthYear]) {
        groupedTransactions[monthYear] = {
          transactions: [],
          totalCredit: 0,
          totalDebit: 0,
          count: 0,
        };
      }
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];

      groupedTransactions[monthYear].transactions.push(tx);
      groupedTransactions[monthYear].count += 1;
      groupedByDate[dateKey].push(tx);

      if (tx.isCredit) {
        groupedTransactions[monthYear].totalCredit += Number(tx.amount || 0);
        totalCredit += Number(tx.amount || 0);
      } else {
        groupedTransactions[monthYear].totalDebit += Number(tx.amount || 0);
        totalDebit += Number(tx.amount || 0);
      }
    });

    let accountBalance = 0;
    (userAccounts || []).forEach((acc) => {
      accountBalance += parseFloat(acc.Balance || 0);
    });

    const totalCount = allTransactions.length;
    const balance = accountBalance;

    res.render("transaction-history", {
      pageTitle: "Transaction History",
      currentPage: "Transaction-History",
      user: req.session.user,
      qrCode: req.session.qrCode || null,
      isLoggedIn: true,
      groupedTransactions: groupedTransactions,
      groupedByDate: groupedByDate,
      hasTransactions: totalCount > 0,
      totalCount: totalCount,
      totalCredit: totalCredit,
      totalDebit: totalDebit,
      balance: balance,
      totalTransactions: totalCount,
      totalAmount: totalCredit + totalDebit,
      moneyIn: totalCredit,
      moneyOut: totalDebit,
      allTransactions: allTransactions,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.render("transaction-history", {
      pageTitle: "Transaction History",
      currentPage: "Transaction-History",
      user: req.session.user,
      qrCode: req.session.qrCode || null,
      isLoggedIn: true,
      groupedTransactions: {},
      groupedByDate: {},
      hasTransactions: false,
      totalCount: 0,
      totalCredit: 0,
      totalDebit: 0,
      balance: 0,
      totalTransactions: 0,
      totalAmount: 0,
      moneyIn: 0,
      moneyOut: 0,
      allTransactions: [],
      error: "Failed to load transaction history",
    });
  }
};

const parseMoney = (value) => {
  if (value === null || value === undefined) return 0;
  const raw = typeof value === "object" && value.toString ? value.toString() : value;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
};

const maskAccount = (account = "") => {
  const normalized = String(account || "").replace(/\s+/g, "");
  if (!normalized) return "XXXX XXXX 0000";
  return `XXXX XXXX ${normalized.slice(-4).padStart(4, "0")}`;
};

const getInitials = (name = "") => {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "NA";
};

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatTime = (dateValue) => {
  const date = new Date(dateValue);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusConfig = (status = "pending") => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "success") {
    return {
      key: "success",
      text: "SUCCESS",
      icon: "fa-check-circle",
      gradient: "linear-gradient(135deg, #10B981, #059669)",
    };
  }
  if (normalized === "failed") {
    return {
      key: "failed",
      text: "FAILED",
      icon: "fa-times-circle",
      gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
    };
  }
  return {
    key: "pending",
    text: "PENDING",
    icon: "fa-clock",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
  };
};

const getTimeline = (status = "pending", transactionTime) => {
  const normalized = String(status || "pending").toLowerCase();
  const steps = [
    { title: "Payment Initiated", desc: "Transaction started by user" },
    { title: "Bank Verification", desc: "Bank account details verified" },
    { title: "Payment Processing", desc: "Processing with payment network" },
    { title: "Amount Debited", desc: "Amount debited from sender's account" },
    { title: "Amount Credited", desc: "Amount credited to receiver's account" },
    { title: "Transaction Complete", desc: "Receipt generated and sent" },
  ];

  let completedCount = 0;
  let activeIndex = -1;

  if (normalized === "success") {
    completedCount = steps.length;
  } else if (normalized === "failed") {
    completedCount = 2;
    activeIndex = 2;
  } else {
    completedCount = 3;
    activeIndex = 3;
  }

  return steps.map((step, index) => {
    let state = "pending";
    if (index < completedCount) state = "completed";
    if (index === activeIndex) state = "active";

    return {
      ...step,
      state,
      timestamp: index <= Math.max(completedCount - 1, activeIndex)
        ? `${formatDate(transactionTime)} • ${formatTime(transactionTime)}`
        : "Awaiting update",
    };
  });
};

const getTransactionDetails = async (req, res) => {
  try {
    const rawTransactionId = String(req.params.transactionId || "").trim();
    const identity = getSessionIdentity(req);
    const currentUser = await resolveSessionUserDoc(req);
    const { userAccounts } = await getUserAccountBundle(req);
    const normalizedAccountSet = new Set(
      (userAccounts || []).map((acc) => normalizeAccountNumber(acc.AccountNumber))
    );

    const numericPart = rawTransactionId.replace(/[^0-9]/g, "");
    let transaction = null;
    let walletTransaction = null;

    if (numericPart) {
      transaction = await TransactionHistory.findOne({ TransactionID: Number(numericPart) }).lean();
    }

    if (!transaction && mongoose.Types.ObjectId.isValid(rawTransactionId)) {
      transaction = await TransactionHistory.findById(rawTransactionId).lean();
    }

    const walletRef = rawTransactionId.replace(/^TXN-/i, "").trim();
    if (!transaction) {
      walletTransaction = await Transaction.findOne({ reference: walletRef }).lean();
    }

    if (!walletTransaction && !transaction && mongoose.Types.ObjectId.isValid(rawTransactionId)) {
      walletTransaction = await Transaction.findById(rawTransactionId).lean();
    }

    if (!transaction && !walletTransaction) {
      return res.status(404).render("error-404", {
        pageTitle: "Transaction Not Found - ZenoPay",
        path: req.path,
      });
    }

    if (walletTransaction) {
      if (!currentUser?._id || String(walletTransaction.userId) !== String(currentUser._id)) {
        return res.status(403).render("error-404", {
          pageTitle: "Access Denied - ZenoPay",
          path: req.path,
        });
      }

      const txStatus = parseStatus(walletTransaction.status);
      const status = getStatusConfig(txStatus);
      const createdAt = walletTransaction.createdAt || new Date();
      const amount = parseMoney(walletTransaction.amount);
      const reference = walletTransaction.reference || String(walletTransaction._id);
      const txType = String(walletTransaction.type || "transaction").toLowerCase();

      let senderName = "ZenoPay Wallet";
      let receiverName = identity.name;
      if (txType === "send") {
        senderName = identity.name;
        receiverName = walletTransaction?.metadata?.recipientName || "Recipient";
      } else if (txType === "receive") {
        senderName = walletTransaction?.metadata?.senderName || "Sender";
        receiverName = identity.name;
      } else if (txType === "refund") {
        senderName = "ZenoPay";
      }

      const paymentMethod = txType === "topup" ? "Wallet Top-up" : "Wallet Transfer";
      const hash = crypto
        .createHash("sha256")
        .update(`${reference}:${createdAt}`)
        .digest("hex")
        .slice(0, 12);

      const details = {
        pageTitle: "Transaction Details - ZenoPay",
        breadcrumbId: `TXN-${reference}`,
        amount,
        fee: 0,
        gst: 0,
        status,
        meta: {
          dateTime: `${formatDate(createdAt)} - ${formatTime(createdAt)}`,
          paymentMethod,
          type: txType.charAt(0).toUpperCase() + txType.slice(1),
          bank: "ZenoPay Wallet",
        },
        parties: {
          sender: {
            initials: getInitials(senderName),
            name: senderName,
            account: "Wallet",
            bank: "ZenoPay Wallet",
          },
          receiver: {
            initials: getInitials(receiverName),
            name: receiverName,
            account: "Wallet",
            bank: "ZenoPay Wallet",
          },
        },
        infoFields: [
          { label: "Transaction ID", value: `TXN-${reference}` },
          { label: "Reference Number", value: reference },
          { label: "Payment Method", value: paymentMethod },
          { label: "Source", value: "ZenoPay Wallet" },
          { label: "Created At", value: `${formatDate(createdAt)} ${formatTime(createdAt)}` },
          {
            label: "Completed At",
            value: txStatus === "success" ? `${formatDate(createdAt)} ${formatTime(createdAt)}` : "Pending",
          },
        ],
        timeline: getTimeline(txStatus, createdAt),
        securityHash: hash,
        transactionId: reference,
      };

      return res.render("transaction-details", details);
    }

    const isUserPartOfTransaction =
      normalizedAccountSet.has(normalizeAccountNumber(transaction.SenderAccountNumber)) ||
      normalizedAccountSet.has(normalizeAccountNumber(transaction.ReceiverAccountNumber));

    if (!isUserPartOfTransaction) {
      return res.status(403).render("error-404", {
        pageTitle: "Access Denied - ZenoPay",
        path: req.path,
      });
    }

    const receipt = await Receipt.findOne({ transaction_id: transaction._id }).lean();

    const amount = parseMoney(transaction.Amount);
    const fee = receipt ? parseMoney(receipt.fee) : 0;
    const gst = Number((fee * 0.18).toFixed(2));
    const status = getStatusConfig(transaction.Status);
    const hash =
      receipt?.transaction_hash ||
      crypto
        .createHash("sha256")
        .update(`${transaction.TransactionID}:${transaction.TransactionTime}`)
        .digest("hex")
        .slice(0, 12);

    const details = {
      pageTitle: "Transaction Details - ZenoPay",
      breadcrumbId: `TXN-${transaction.TransactionID}`,
      amount,
      fee,
      gst,
      status,
      meta: {
        dateTime: `${formatDate(transaction.TransactionTime)} - ${formatTime(transaction.TransactionTime)}`,
        paymentMethod: receipt?.payment_method || "UPI Transfer",
        type: "Money Transfer",
        bank: transaction.SenderBank || "N/A",
      },
      parties: {
        sender: {
          initials: getInitials(transaction.SenderHolderName),
          name: transaction.SenderHolderName || "N/A",
          account: maskAccount(transaction.SenderAccountNumber),
          bank: transaction.SenderBank || "N/A",
        },
        receiver: {
          initials: getInitials(transaction.ReceiverHolderName),
          name: transaction.ReceiverHolderName || "N/A",
          account: maskAccount(transaction.ReceiverAccountNumber),
          bank: transaction.ReceiverBank || "N/A",
        },
      },
      infoFields: [
        { label: "Transaction ID", value: `TXN-${transaction.TransactionID}` },
        { label: "Reference Number", value: receipt?.receipt_number || `REF${transaction.TransactionID}` },
        { label: "Payment Method", value: receipt?.payment_method || "UPI Transfer" },
        { label: "Bank Name", value: transaction.SenderBank || "N/A" },
        { label: "IFSC Code", value: "N/A" },
        { label: "UTR Number", value: `UTR${transaction.TransactionID}` },
        { label: "Created At", value: `${formatDate(transaction.TransactionTime)} ${formatTime(transaction.TransactionTime)}` },
        {
          label: "Completed At",
          value: transaction.Status === "success"
            ? `${formatDate(transaction.TransactionTime)} ${formatTime(transaction.TransactionTime)}`
            : "Pending",
        },
      ],
      timeline: getTimeline(transaction.Status, transaction.TransactionTime),
      securityHash: hash,
      transactionId: transaction.TransactionID,
    };

    return res.render("transaction-details", details);
  } catch (error) {
    console.error("Error fetching transaction detail:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getTransactionHistoryData = async (req, res) => {
  try {
    const { accountNumbers, normalizedAccountSet } = await getUserAccountBundle(req);
    const identity = getSessionIdentity(req);

    const [bankTransactions, walletBundle] = await Promise.all([
      fetchAccountTransactions({ accountNumbers, normalizedAccountSet }),
      fetchWalletTransactions(req),
    ]);

    const mappedRows = [
      ...(bankTransactions || []).map((txn) => toHistoryRow(txn, normalizedAccountSet)),
      ...((walletBundle?.rows || []).map((txn) => toWalletHistoryRow(txn, identity.name))),
    ]
      .filter(Boolean);

    const filteredRows = applyHistoryFilters(mappedRows, req.query || {});

    const moneyIn = filteredRows
      .filter((tx) => tx.isCredit)
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const moneyOut = filteredRows
      .filter((tx) => !tx.isCredit)
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return res.json({
      success: true,
      data: {
        rows: filteredRows,
        summary: {
          totalTransactions: filteredRows.length,
          totalAmount: moneyIn + moneyOut,
          moneyIn,
          moneyOut,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transaction history data API:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history data",
    });
  }
};

module.exports = {
  getTransactionHistory,
  getTransactionDetails,
  getTransactionHistoryData,
};
