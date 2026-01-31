const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const Notification = require("../Models/Notification");
const ZenoPayDetails = require("../Models/ZenoPayUser");

const getTransferMoney = async (req, res) => {
  try {
    console.log('[getTransferMoney] Request received for /send-to');
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    console.log(`[getTransferMoney] zenoPayId: ${zenoPayId}`);

    // Fetch all accounts for this user
    console.log('[getTransferMoney] Querying BankAccount...');
    const accounts = await BankAccount.find({ ZenoPayId: zenoPayId }).lean();
    console.log(`[getTransferMoney] Query returned: ${accounts ? accounts.length + ' accounts' : 'null'}`);
    
    if (!accounts || accounts.length === 0) {
      console.log(`[getTransferMoney] No bank accounts found, using empty array`);
    } else {
      console.log(`[getTransferMoney] Converting Decimal128 to strings for ${accounts.length} accounts`);
      // Convert Decimal128 to string for JSON serialization
      accounts.forEach((acc, idx) => {
        try {
          if (acc.Balance) {
            const balStr = acc.Balance.toString();
            acc.Balance = balStr;
            console.log(`[getTransferMoney] Account ${idx}: Balance converted to ${balStr}`);
          }
          if (acc.OpeningBalance) acc.OpeningBalance = acc.OpeningBalance.toString();
          if (acc.TransactionLimit) acc.TransactionLimit = acc.TransactionLimit.toString();
        } catch (e) {
          console.error(`[getTransferMoney] Error converting account ${idx}:`, e.message);
        }
      });
    }

    // Get user details
    const user = req.session.user;
    if (!user) {
      console.warn(`[getTransferMoney] User session not found, using demo mode`);
    }

    console.log('[getTransferMoney] About to render send-money template');
    res.render("send-money", {
      pageTitle: "Send Money",
      currentPage: "send-money",
      accounts: accounts || [],
      qrCode: req.session.qrCode || null,
      user: user || { ZenoPayID: "ZP-DEMO2024" },
      isLoggedIn: true,
    });
    console.log('[getTransferMoney] Template rendered successfully');
  } catch (err) {
    console.error(`[getTransferMoney] !!!CATCH BLOCK ERROR!!!`);
    console.error(`[getTransferMoney] Error message: ${err.message}`);
    console.error(`[getTransferMoney] Error stack:`, err.stack);
    console.error(`[getTransferMoney] Full error object:`, err);
    res.status(500).json({
      error: 'Failed to load Send Money page',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const verifyReceiver = async (req, res) => {
  const { receiverId } = req.body;

  try {
    const zenoPayUser = await ZenoPayDetails.findOne({
      $or: [
        { ZenoPayID: receiverId },
        { Email: receiverId },
        { Mobile: receiverId },
      ],
    });

    if (zenoPayUser) {
      const accounts = await BankAccount.find({
        ZenoPayId: zenoPayUser.ZenoPayID,
      });

      if (accounts.length > 0) {
        return res.status(200).json({
          success: true,
          message: "Receiver verified successfully",
          receiver: {
            Name: zenoPayUser.Name || zenoPayUser.FullName,
            ZenoPayID: zenoPayUser.ZenoPayID,
            Email: zenoPayUser.Email,
            Mobile: zenoPayUser.Mobile,
            accounts: accounts.map((acc) => ({
              accountNumber: acc.AccountNumber,
              bankName: acc.BankName,
              accountType: acc.AccountType,
              bankId: acc.BankId,
            })),
          },
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `${zenoPayUser.Name || zenoPayUser.FullName} has no bank account. Please ask them to open an account first.`,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message:
        "Receiver not found. Please check the ZenoPay ID, Email, or Mobile number.",
    });
  } catch (err) {
    console.error('Error verifying receiver:', err);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};

const postTransferMoney = async (req, res) => {
  const { sourceAccountId, receiverId, amount, charges, total, description } = req.body;
  const transferAmount = parseFloat(amount);
  const transactionCharges = parseFloat(charges) || 0;
  const totalAmount = parseFloat(total);
  const DAILY_LIMIT = 50000;

  try {
    // Get sender account by ID
    const sender = await BankAccount.findById(sourceAccountId);
    if (!sender) {
      return res.status(404).json({ 
        success: false, 
        message: "Sender account not found." 
      });
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await TransactionHistory.find({
      SenderAccountNumber: sender.AccountNumber,
      TransactionTime: { $gte: today, $lt: tomorrow },
    });

    const todayTotal = todayTransactions.reduce(
      (sum, tx) => sum + parseFloat(tx.Amount.toString()),
      0
    );

    if (todayTotal + totalAmount > DAILY_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Daily transaction limit exceeded. You have already transferred ₹${todayTotal.toFixed(
          2
        )} today. Daily limit is ₹${DAILY_LIMIT}.`,
      });
    }

    // Check balance
    const currentBalance = parseFloat(sender.Balance.toString());
    if (currentBalance < totalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Insufficient Balance." 
      });
    }

    // Get receiver account
    const receiverUser = await ZenoPayDetails.findOne({
      $or: [
        { ZenoPayID: receiverId },
        { Email: receiverId },
        { Mobile: receiverId },
      ],
    });

    if (!receiverUser) {
      return res.status(404).json({ 
        success: false, 
        message: "Receiver not found." 
      });
    }

    // Get receiver's first bank account
    const receiver = await BankAccount.findOne({
      ZenoPayId: receiverUser.ZenoPayID,
    });

    if (!receiver) {
      return res.status(404).json({ 
        success: false, 
        message: "Receiver account not found." 
      });
    }

    // Check if sending to same account
    if (sender.AccountNumber === receiver.AccountNumber) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer to the same account.",
      });
    }

    // Perform the transfer
    const senderNewBal = currentBalance - totalAmount;
    const receiverCurrentBal = parseFloat(receiver.Balance.toString());
    const receiverNewBal = receiverCurrentBal + transferAmount; // Receiver gets amount without charges

    sender.Balance = senderNewBal;
    receiver.Balance = receiverNewBal;

    await sender.save();
    await receiver.save();

    // Create transaction ID
    const transactionID = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);

    // Save transaction history
    const history = new TransactionHistory({
      TransactionID: transactionID,
      SenderBank: sender.BankName,
      SenderAccountNumber: sender.AccountNumber,
      SenderHolderName: sender.AccountHolderName,
      SenderBalanceBefore: currentBalance,
      SenderBalanceAfter: senderNewBal,
      ReceiverBank: receiver.BankName,
      ReceiverAccountNumber: receiver.AccountNumber,
      ReceiverHolderName: receiver.AccountHolderName,
      ReceiverBalanceBefore: receiverCurrentBal,
      ReceiverBalanceAfter: receiverNewBal,
      Amount: transferAmount,
      TransactionCharges: transactionCharges,
      Description: description || "Fund Transfer",
    });

    await history.save();

    // Create notifications
    try {
      await Notification.create({
        ZenoPayId: sender.ZenoPayId,
        Type: "debit",
        Title: "Money Sent",
        Message: `₹${transferAmount.toFixed(2)} sent to ${receiver.AccountHolderName} (${receiverId})`,
        Amount: totalAmount,
        TransactionID: transactionID,
        IsRead: false,
      });

      await Notification.create({
        ZenoPayId: receiver.ZenoPayId,
        Type: "credit",
        Title: "Money Received",
        Message: `₹${transferAmount.toFixed(2)} received from ${sender.AccountHolderName}`,
        Amount: transferAmount,
        TransactionID: transactionID,
        IsRead: false,
      });
    } catch (notifErr) {
      console.error('Error creating notifications:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Transfer Successful!",
      transaction: {
        transactionId: transactionID,
        amount: transferAmount,
        charges: transactionCharges,
        total: totalAmount,
        receiverName: receiver.AccountHolderName,
        newBalance: senderNewBal,
      },
    });
  } catch (err) {
    console.error('Error in postTransferMoney:', err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during transaction." 
    });
  }
};

const getDailyTransactionSummary = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const DAILY_LIMIT = 50000;

    const accounts = await BankAccount.find({ ZenoPayId: zenoPayId });
    const accountNumbers = accounts.map((acc) => acc.AccountNumber);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await TransactionHistory.find({
      SenderAccountNumber: { $in: accountNumbers },
      TransactionTime: { $gte: today, $lt: tomorrow },
    });

    const count = todayTransactions.length;
    const totalAmount = todayTransactions.reduce(
      (sum, tx) => sum + parseFloat(tx.Amount.toString()),
      0
    );
    const remainingLimit = DAILY_LIMIT - totalAmount;

    res.status(200).json({
      success: true,
      transactions: count,
      amount: totalAmount,
      remainingLimit: remainingLimit > 0 ? remainingLimit : 0,
      dailyLimit: DAILY_LIMIT,
    });
  } catch (err) {
    console.error('Error fetching daily summary:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching summary" 
    });
  }
};

module.exports = {
  getTransferMoney,
  verifyReceiver,
  postTransferMoney,
  getDailyTransactionSummary,
};