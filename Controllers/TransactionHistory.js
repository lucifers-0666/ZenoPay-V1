const TransactionHistory = require("../Models/TransactionHistory");
const BankAccount = require("../Models/BankAccount");
const Receipt = require("../Models/Receipt");
const mongoose = require("mongoose");
const crypto = require("crypto");

const getTransactionHistory = async (req, res) => {
  try {
    const userZenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";

    // First, get all bank accounts for this user
    const userAccounts = await BankAccount.find({ ZenoPayId: userZenoPayId });

    if (!userAccounts || userAccounts.length === 0) {
      return res.render("transaction-history", {
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
      });
    }

    // Get all account numbers for this user
    const accountNumbers = userAccounts.map((acc) => acc.AccountNumber);

    // Fetch all transactions where user's accounts are sender or receiver
    const transactions = await TransactionHistory.find({
      $or: [
        { SenderAccountNumber: { $in: accountNumbers } },
        { ReceiverAccountNumber: { $in: accountNumbers } },
      ],
    }).sort({ TransactionTime: -1 }); // Sort by newest first

    // Group transactions by month
    const groupedTransactions = {};
    const allTransactions = [];

    transactions.forEach((txn) => {
      const date = new Date(txn.TransactionTime);
      const monthYear = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      if (!groupedTransactions[monthYear]) {
        groupedTransactions[monthYear] = {
          transactions: [],
          totalCredit: 0,
          totalDebit: 0,
          count: 0,
        };
      }

      // Determine if this is credit or debit for the user
      const isCredit = accountNumbers.includes(txn.ReceiverAccountNumber);
      const amount = parseFloat(txn.Amount.toString());

      if (isCredit) {
        groupedTransactions[monthYear].totalCredit += amount;
      } else {
        groupedTransactions[monthYear].totalDebit += amount;
      }

      // Add transaction with formatted data
      const formattedTransaction = {
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
        amount: amount,
        isCredit: isCredit,
        status: "success", // All completed transactions are success
        senderName: txn.SenderHolderName,
        senderAccountNumber: txn.SenderAccountNumber,
        senderBank: txn.SenderBank,
        receiverName: txn.ReceiverHolderName,
        receiverAccountNumber: txn.ReceiverAccountNumber,
        receiverBank: txn.ReceiverBank,
      };

      groupedTransactions[monthYear].transactions.push(formattedTransaction);
      allTransactions.push(formattedTransaction);

      groupedTransactions[monthYear].count++;
    });

    // Calculate overall totals
    let totalCredit = 0;
    let totalDebit = 0;
    let totalCount = transactions.length;

    // Get user's total balance from all accounts
    let accountBalance = 0;
    userAccounts.forEach((acc) => {
      accountBalance += parseFloat(acc.Balance || 0);
    });

    transactions.forEach((txn) => {
      const isCredit = accountNumbers.includes(txn.ReceiverAccountNumber);
      const amount = parseFloat(txn.Amount.toString());

      if (isCredit) {
        totalCredit += amount;
      } else {
        totalDebit += amount;
      }
    });

    const balance = accountBalance;

    // Group transactions by date for the card view
    const groupedByDate = {};
    transactions.forEach((txn) => {
      const date = new Date(txn.TransactionTime);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      });

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }

      const isCredit = accountNumbers.includes(txn.ReceiverAccountNumber);
      const amount = parseFloat(txn.Amount.toString());

      groupedByDate[dateKey].push({
        transactionId: `TXN-${txn.TransactionID}`,
        date: dateKey,
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
        amount: amount,
        isCredit: isCredit,
        status: "success",
        senderName: txn.SenderHolderName,
        senderAccountNumber: txn.SenderAccountNumber,
        senderBank: txn.SenderBank,
        receiverName: txn.ReceiverHolderName,
        receiverAccountNumber: txn.ReceiverAccountNumber,
        receiverBank: txn.ReceiverBank,
      });
    });

    res.render("transaction-history", {
      pageTitle: "Transaction History",
      currentPage: "Transaction-History",
      user: req.session.user,
      qrCode: req.session.qrCode || null,
      isLoggedIn: true,
      groupedTransactions: groupedTransactions,
      groupedByDate: groupedByDate,
      hasTransactions: transactions.length > 0,
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
    const userZenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";

    const userAccounts = await BankAccount.find({ ZenoPayId: userZenoPayId }).lean();
    const accountNumbers = userAccounts.map((acc) => acc.AccountNumber);

    const numericPart = rawTransactionId.replace(/[^0-9]/g, "");
    let transaction = null;

    if (numericPart) {
      transaction = await TransactionHistory.findOne({ TransactionID: Number(numericPart) }).lean();
    }

    if (!transaction && mongoose.Types.ObjectId.isValid(rawTransactionId)) {
      transaction = await TransactionHistory.findById(rawTransactionId).lean();
    }

    if (!transaction) {
      return res.status(404).render("error-404", {
        pageTitle: "Transaction Not Found - ZenoPay",
        path: req.path,
      });
    }

    const isUserPartOfTransaction =
      accountNumbers.includes(transaction.SenderAccountNumber) ||
      accountNumbers.includes(transaction.ReceiverAccountNumber) ||
      userZenoPayId === "ZP-DEMO2024";

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

module.exports = {
  getTransactionHistory,
  getTransactionDetails,
};
