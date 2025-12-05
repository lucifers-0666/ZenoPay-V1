const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");

// Render the Transfer Page with User's Accounts
const getTransferMoney = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const userAadhar = req.session.user.aadharNumber;

    // Fetch all accounts belonging to the logged-in user
    const accounts = await BankAccount.find({ AadharNumber: userAadhar });

    res.render("TransferMoney", {
      pageTitle: "Fund Transfer",
      accounts: accounts, // Pass accounts to EJS
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error fetching transfer page:", err);
    res.redirect("/");
  }
};

// API to Verify Receiver (Account No or Mobile)
const verifyReceiver = async (req, res) => {
  const { mode, value } = req.body; // mode: 'Account' or 'Phone'

  try {
    let receiver;
    if (mode === "Account") {
      receiver = await BankAccount.findOne({ AccountNumber: value });
    } else if (mode === "Phone") {
      receiver = await BankAccount.findOne({ Mobile: value });
    }

    if (receiver) {
      // Prevent showing sensitive data, just show name and bank
      return res.status(200).json({
        success: true,
        message: "User Verified",
        data: {
          holderName: receiver.FullName,
          bankName: receiver.BankName,
          accountNumber: receiver.AccountNumber, // Needed if looked up by phone
        },
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Beneficiary not found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed." });
  }
};

// Process the Transaction
const postTransferMoney = async (req, res) => {
  const { senderAccount, receiverAccount, amount, description } = req.body;
  const transferAmount = parseFloat(amount);

  if (senderAccount === receiverAccount) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Cannot transfer to the same account.",
      });
  }

  try {
    // 1. Fetch Sender
    const sender = await BankAccount.findOne({ AccountNumber: senderAccount });
    if (!sender) {
      return res
        .status(404)
        .json({ success: false, message: "Sender account not found." });
    }

    // 2. Check Balance (Using Decimal128 conversion logic)
    const currentBalance = parseFloat(sender.OpeningBalance.toString());
    if (currentBalance < transferAmount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient Balance." });
    }

    // 3. Fetch Receiver
    const receiver = await BankAccount.findOne({
      AccountNumber: receiverAccount,
    });
    if (!receiver) {
      return res
        .status(404)
        .json({ success: false, message: "Beneficiary account not found." });
    }

    // 4. Perform Transaction (Update Balances)
    // Note: In a real banking app, use MongoDB Transactions (Session) for atomicity.

    const senderNewBal = currentBalance - transferAmount;
    const receiverCurrentBal = parseFloat(receiver.OpeningBalance.toString());
    const receiverNewBal = receiverCurrentBal + transferAmount;

    sender.OpeningBalance = senderNewBal;
    receiver.OpeningBalance = receiverNewBal;

    await sender.save();
    await receiver.save();

    // 5. Create Transaction History Record
    const transactionID = Math.floor(1000000000 + Math.random() * 9000000000); // Simple ID gen

    const history = new TransactionHistory({
      TransactionID: transactionID,
      SenderBank: sender.BankName,
      SenderAccountNumber: sender.AccountNumber,
      SenderHolderName: sender.FullName,
      SenderBalanceBefore: currentBalance,
      SenderBalanceAfter: senderNewBal,
      ReceiverBank: receiver.BankName,
      ReceiverAccountNumber: receiver.AccountNumber,
      ReceiverHolderName: receiver.FullName,
      ReceiverBalanceBefore: receiverCurrentBal,
      ReceiverBalanceAfter: receiverNewBal,
      Amount: transferAmount,
      Description: description || "Fund Transfer",
    });

    await history.save();

    res.status(200).json({
      success: true,
      message: "Transfer Successful!",
      transactionID: transactionID,
      newBalance: senderNewBal,
    });
  } catch (err) {
    console.error("Transfer Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during transaction." });
  }
};

module.exports = {
  getTransferMoney,
  verifyReceiver,
  postTransferMoney,
};
