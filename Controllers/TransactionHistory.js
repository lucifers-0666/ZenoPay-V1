const TransactionHistory = require("../Models/TransactionHistory");
const BankAccount = require("../Models/BankAccount");

const getTransactionHistory = async (req, res) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userZenoPayId = req.session.user.ZenoPayID;

    // First, get all bank accounts for this user
    const userAccounts = await BankAccount.find({ ZenoPayId: userZenoPayId });

    if (!userAccounts || userAccounts.length === 0) {
      return res.render("TransactionHistory", {
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
      groupedTransactions[monthYear].transactions.push({
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
      });

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

    res.render("TransactionHistory", {
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
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.render("TransactionHistory", {
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
      error: "Failed to load transaction history",
    });
  }
};

module.exports = {
  getTransactionHistory,
};
