const TransactionHistory = require("../../Models/TransactionHistory");

// GET All Transactions
const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
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
      .limit(limit);

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

    res.render("admin/transactions", {
      pageTitle: "Transaction Management",
      currentPage: "transactions",
      admin: req.session.user,
      transactions,
      pagination: {
        page,
        limit,
        totalPages,
        totalTransactions,
      },
      totalAmount,
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
    // Assuming you'll add IsFlagged field to TransactionHistory model
    const flaggedTransactions = await TransactionHistory.find({ IsFlagged: true })
      .sort({ TransactionTime: -1 });

    res.render("admin/transactions-flagged", {
      pageTitle: "Flagged Transactions",
      currentPage: "transactions",
      admin: req.session.user,
      transactions: flaggedTransactions,
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

    res.render("admin/transactions-failed", {
      pageTitle: "Failed Transactions",
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

    res.render("admin/transaction-details", {
      pageTitle: "Transaction Details",
      currentPage: "transactions",
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
