const mongoose = require("mongoose");
const AadharDetails = require("../Models/AadharDetails");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const emailService = require("../Services/email");

// ------------------------
// Transaction Helper (ACID)
// ------------------------
async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// 1. Create Order (Server-to-Server) - READ ONLY (no transaction needed)
const createOrder = async (req, res) => {
  const { key, secret, amount } = req.body;
  try {
    if (!key || !secret || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Parameters" });
    }

    // Verify Merchant Credentials in AadharDetails
    const merchant = await AadharDetails.findOne({ api_key: key }).select(
      "+api_secret"
    );

    if (!merchant) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid API Key" });
    }
    if (merchant.api_secret !== secret) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid API Secret" });
    }

    // Generate Order ID
    const orderId =
      "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    res.status(200).json({
      success: true,
      order_id: orderId,
      amount: amount,
      currency: "INR",
      merchant_name: merchant.BusinessName || merchant.FullName,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 2. Process Refund (MONEY FLOW → ACID)
const processRefund = async (req, res) => {
  try {
    const { key, secret, transactionId, reason } = req.body;

    const result = await runInTransaction(async (session) => {
      // 1. Authenticate Merchant
      const merchant = await AadharDetails.findOne({ api_key: key })
        .select("+api_secret")
        .session(session);

      if (!merchant || merchant.api_secret !== secret) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
      }

      // 2. Find Original Transaction
      const txn = await TransactionHistory.findOne({
        TransactionID: transactionId,
      }).session(session);
      if (!txn) {
        const err = new Error("Transaction not found");
        err.statusCode = 404;
        throw err;
      }

      const refundAmount = parseFloat(txn.Amount.toString());

      // 3. Fetch Accounts
      const sender = await BankAccount.findOne({
        AccountNumber: txn.SenderAccountNumber,
      }).session(session); // Original payer
      const receiver = await BankAccount.findOne({
        AccountNumber: txn.ReceiverAccountNumber,
      }).session(session); // Merchant

      if (!receiver) {
        const err = new Error("Merchant account not found");
        err.statusCode = 404;
        throw err;
      }
      if (!sender) {
        const err = new Error("Payer account not found");
        err.statusCode = 404;
        throw err;
      }

      const receiverBalanceBefore = parseFloat(
        receiver.OpeningBalance.toString()
      );
      const senderBalanceBefore = parseFloat(sender.OpeningBalance.toString());

      if (receiverBalanceBefore < refundAmount) {
        const err = new Error("Insufficient Merchant Balance");
        err.statusCode = 400;
        throw err;
      }

      // 4. Reverse Transfer
      receiver.OpeningBalance = receiverBalanceBefore - refundAmount;
      sender.OpeningBalance = senderBalanceBefore + refundAmount;

      await receiver.save({ session });
      await sender.save({ session });

      // 5. Record Refund
      const refundTxnId = Math.floor(1000000000 + Math.random() * 9000000000);

      await TransactionHistory.create(
        [
          {
            TransactionID: refundTxnId,
            TransactionTime: new Date(),
            SenderBank: receiver.BankName,
            SenderAccountNumber: receiver.AccountNumber,
            SenderHolderName: receiver.BusinessName || receiver.FullName,
            SenderBalanceBefore: receiverBalanceBefore,
            SenderBalanceAfter: receiver.OpeningBalance,
            ReceiverBank: sender.BankName,
            ReceiverAccountNumber: sender.AccountNumber,
            ReceiverHolderName: sender.FullName,
            ReceiverBalanceBefore: senderBalanceBefore,
            ReceiverBalanceAfter: sender.OpeningBalance,
            Amount: refundAmount,
            Description: `REFUND: ${txn.Description} (${reason})`,
          },
        ],
        { session }
      );

      return { refundTxnId };
    });

    return res.status(200).json({
      success: true,
      message: "Refund Processed",
      refundId: result.refundTxnId,
    });
  } catch (err) {
    console.error("Refund Error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Refund Failed",
    });
  }
};

// 3. Fetch Payer Accounts (READ ONLY)
const fetchPayerAccounts = async (req, res) => {
  const { aadharNumber } = req.body;
  try {
    const cleanAadhar = aadharNumber.replace(/\s/g, "");
    const accounts = await BankAccount.find({ AadharNumber: cleanAadhar });

    if (accounts.length > 0) {
      const mappedAccounts = accounts.map((acc) => ({
        bankName: acc.BankName,
        accountNumber: acc.AccountNumber,
        maskedNumber: "****" + acc.AccountNumber.slice(-4),
      }));
      return res.status(200).json({ success: true, accounts: mappedAccounts });
    }
    return res
      .status(404)
      .json({ success: false, message: "No linked accounts found." });
  } catch (err) {
    console.error("fetchPayerAccounts Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 4. Send OTP (no DB writes except session + email)
const sendAadhaarOtp = async (req, res) => {
  const { aadharNumber } = req.body;
  try {
    const cleanAadhar = aadharNumber.replace(/\s/g, "");
    const user = await AadharDetails.findOne({ AadharNumber: cleanAadhar });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Aadhaar not linked." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.gatewayOtp = {
      code: otp,
      aadhar: cleanAadhar,
      expires: Date.now() + 5 * 60 * 1000,
    };

    await emailService.sendPaymentOtp(user.Email, user.FullName, otp);
    res.status(200).json({ success: true, message: "OTP Sent" });
  } catch (err) {
    console.error("sendAadhaarOtp Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 5. Verify OTP & Fetch Accounts (READ ONLY)
const verifyOtpAndFetchAccounts = async (req, res) => {
  const { otp, aadharNumber } = req.body;
  const cleanAadhar = aadharNumber.replace(/\s/g, "");

  try {
    const sessionOtp = req.session.gatewayOtp;

    if (
      !sessionOtp ||
      sessionOtp.code !== otp ||
      sessionOtp.aadhar !== cleanAadhar ||
      sessionOtp.expires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or Expired OTP" });
    }

    delete req.session.gatewayOtp;

    const accounts = await BankAccount.find({ AadharNumber: cleanAadhar });
    if (accounts.length > 0) {
      const mappedAccounts = accounts.map((acc) => ({
        bankName: acc.BankName,
        accountNumber: acc.AccountNumber,
        maskedNumber: "****" + acc.AccountNumber.slice(-4),
      }));
      return res.status(200).json({ success: true, accounts: mappedAccounts });
    }
    return res.status(404).json({ success: false, message: "No Accounts" });
  } catch (err) {
    console.error("verifyOtp Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 6. Process Payment (MONEY FLOW → ACID)
const processPayment = async (req, res) => {
  try {
    const { apiKey, amount, customerId, pin, orderId } = req.body;

    if (!apiKey || apiKey.length < 11) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid API Key Format" });
    }

    const result = await runInTransaction(async (session) => {
      // A. Find Merchant User
      const merchantUser = await AadharDetails.findOne({
        api_key: apiKey,
      }).session(session);
      if (!merchantUser) {
        const err = new Error("Invalid Merchant Key");
        err.statusCode = 400;
        throw err;
      }

      // B. Identify settlement account via IFSC prefix
      // IFSC is usually 11 chars, adjust if your apiKey design is different
      const targetIFSC = apiKey.substring(0, 11);

      const merchantAccount = await BankAccount.findOne({
        AadharNumber: merchantUser.AadharNumber,
        IFSC: targetIFSC,
      }).session(session);

      if (!merchantAccount) {
        const err = new Error(
          `Settlement Error: No account found for IFSC ${targetIFSC}`
        );
        err.statusCode = 400;
        throw err;
      }

      // C. Find Payer Account
      const payerAccount = await BankAccount.findOne({
        AccountNumber: customerId,
      }).session(session);

      if (!payerAccount) {
        const err = new Error("Payer account not found");
        err.statusCode = 404;
        throw err;
      }

      if (payerAccount.AccountNumber === merchantAccount.AccountNumber) {
        const err = new Error("Cannot pay to self");
        err.statusCode = 400;
        throw err;
      }

      if (payerAccount.CardPIN !== pin) {
        const err = new Error("Invalid PIN");
        err.statusCode = 401;
        throw err;
      }

      // D. Transfer Funds
      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        const err = new Error("Invalid Amount");
        err.statusCode = 400;
        throw err;
      }

      const payerBalanceBefore = parseFloat(
        payerAccount.OpeningBalance.toString()
      );
      const merchantBalanceBefore = parseFloat(
        merchantAccount.OpeningBalance.toString()
      );

      if (payerBalanceBefore < transferAmount) {
        const err = new Error("Insufficient Funds");
        err.statusCode = 400;
        throw err;
      }

      payerAccount.OpeningBalance = payerBalanceBefore - transferAmount;
      merchantAccount.OpeningBalance = merchantBalanceBefore + transferAmount;

      await payerAccount.save({ session });
      await merchantAccount.save({ session });

      // E. Record Transaction
      const transactionID = Math.floor(1000000000 + Math.random() * 9000000000);

      await TransactionHistory.create(
        [
          {
            TransactionID: transactionID,
            TransactionTime: new Date(),
            SenderBank: payerAccount.BankName,
            SenderAccountNumber: payerAccount.AccountNumber,
            SenderHolderName: payerAccount.FullName,
            SenderBalanceBefore: payerBalanceBefore,
            SenderBalanceAfter: payerAccount.OpeningBalance,
            ReceiverBank: merchantAccount.BankName,
            ReceiverAccountNumber: merchantAccount.AccountNumber,
            ReceiverHolderName:
              merchantAccount.BusinessName || merchantAccount.FullName,
            ReceiverBalanceBefore: merchantBalanceBefore,
            ReceiverBalanceAfter: merchantAccount.OpeningBalance,
            Amount: transferAmount,
            Description: `Order ${orderId || "Direct"} - ${
              merchantUser.BusinessName || merchantUser.FullName
            }`,
          },
        ],
        { session }
      );

      return { transactionID };
    });

    return res.status(200).json({
      success: true,
      message: "Payment Successful!",
      transactionId: result.transactionID,
    });
  } catch (err) {
    console.error("Payment Process Error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Transaction Failed due to Server Error",
    });
  }
};

const renderCheckout = async (req, res) => {
  res.status(200).send("Use JS SDK");
};

module.exports = {
  createOrder,
  fetchPayerAccounts,
  processPayment,
  renderCheckout,
  sendAadhaarOtp,
  verifyOtpAndFetchAccounts,
  processRefund,
};
