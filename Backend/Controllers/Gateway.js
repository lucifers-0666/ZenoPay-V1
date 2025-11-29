const AadharDetails = require("../Models/AadharDetails");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const emailService = require("../Services/EmailService");

// 1. Create Order (Server-to-Server)
const createOrder = async (req, res) => {
    const { key, secret, amount } = req.body;
    try {
        if (!key || !secret || !amount) {
            return res.status(400).json({ success: false, message: "Missing Parameters" });
        }

        // 1. Verify Merchant Credentials in AadharDetails
        const merchant = await AadharDetails.findOne({ api_key: key }).select('+api_secret');

        if (!merchant) {
            return res.status(401).json({ success: false, message: "Invalid API Key" });
        }
        if (merchant.api_secret !== secret) {
            return res.status(401).json({ success: false, message: "Invalid API Secret" });
        }

        // 2. Generate Order ID
        const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        res.status(200).json({
            success: true,
            order_id: orderId,
            amount: amount,
            currency: "INR",
            merchant_name: merchant.BusinessName || merchant.FullName
        });
    } catch (err) {
        console.error("Create Order Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 2. Process Refund
const processRefund = async (req, res) => {
    const { key, secret, transactionId, reason } = req.body;

    try {
        // 1. Authenticate Merchant via AadharDetails
        const merchant = await AadharDetails.findOne({ api_key: key }).select('+api_secret');
        if (!merchant || merchant.api_secret !== secret) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // 2. Find Transaction
        const txn = await TransactionHistory.findOne({ TransactionID: transactionId });
        if (!txn) return res.status(404).json({ success: false, message: "Transaction not found" });

        const refundAmount = parseFloat(txn.Amount.toString());

        // 3. Fetch Accounts
        const sender = await BankAccount.findOne({ AccountNumber: txn.SenderAccountNumber }); // Original Payer
        const receiver = await BankAccount.findOne({ AccountNumber: txn.ReceiverAccountNumber }); // Merchant Account

        if (!receiver) return res.status(404).json({ success: false, message: "Merchant account not found" });

        if (parseFloat(receiver.OpeningBalance) < refundAmount) {
             return res.status(400).json({ success: false, message: "Insufficient Merchant Balance" });
        }

        // 4. Reverse Transfer
        receiver.OpeningBalance = parseFloat(receiver.OpeningBalance) - refundAmount;
        sender.OpeningBalance = parseFloat(sender.OpeningBalance) + refundAmount;

        await receiver.save();
        await sender.save();

        // 5. Record Refund
        const refundTxnId = Math.floor(1000000000 + Math.random() * 9000000000);
        const refundHistory = new TransactionHistory({
            TransactionID: refundTxnId,
            TransactionTime: new Date(),
            SenderBank: receiver.BankName,
            SenderAccountNumber: receiver.AccountNumber,
            SenderHolderName: receiver.BusinessName || receiver.FullName,
            SenderBalanceBefore: parseFloat(receiver.OpeningBalance) + refundAmount,
            SenderBalanceAfter: receiver.OpeningBalance,
            ReceiverBank: sender.BankName,
            ReceiverAccountNumber: sender.AccountNumber,
            ReceiverHolderName: sender.FullName,
            ReceiverBalanceBefore: parseFloat(sender.OpeningBalance) - refundAmount,
            ReceiverBalanceAfter: sender.OpeningBalance,
            Amount: refundAmount,
            Description: `REFUND: ${txn.Description} (${reason})`
        });
        
        await refundHistory.save();

        res.status(200).json({ success: true, message: "Refund Processed", refundId: refundTxnId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Refund Failed" });
    }
};

// 3. Fetch Payer Accounts (SDK)
const fetchPayerAccounts = async (req, res) => {
    const { aadharNumber } = req.body;
    try {
        const cleanAadhar = aadharNumber.replace(/\s/g, "");
        const accounts = await BankAccount.find({ AadharNumber: cleanAadhar });
        
        if (accounts.length > 0) {
            const mappedAccounts = accounts.map(acc => ({
                bankName: acc.BankName,
                accountNumber: acc.AccountNumber,
                maskedNumber: "****" + acc.AccountNumber.slice(-4)
            }));
            return res.status(200).json({ success: true, accounts: mappedAccounts });
        }
        return res.status(404).json({ success: false, message: "No linked accounts found." });
    } catch (err) { res.status(500).json({ success: false }); }
};

// 4. Send OTP
const sendAadhaarOtp = async (req, res) => {
    const { aadharNumber } = req.body;
    try {
        const cleanAadhar = aadharNumber.replace(/\s/g, "");
        const user = await AadharDetails.findOne({ AadharNumber: cleanAadhar });
        if (!user) return res.status(404).json({ success: false, message: "Aadhaar not linked." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        req.session.gatewayOtp = { code: otp, aadhar: cleanAadhar, expires: Date.now() + 5 * 60 * 1000 };
        
        await emailService.sendPaymentOtp(user.Email, user.FullName, otp);
        res.status(200).json({ success: true, message: "OTP Sent" });
    } catch (err) { res.status(500).json({ success: false }); }
};

// 5. Verify OTP
const verifyOtpAndFetchAccounts = async (req, res) => {
    const { otp, aadharNumber } = req.body;
    const cleanAadhar = aadharNumber.replace(/\s/g, "");
    
    if (!req.session.gatewayOtp || req.session.gatewayOtp.code !== otp || req.session.gatewayOtp.aadhar !== cleanAadhar) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    
    delete req.session.gatewayOtp;
    
    const accounts = await BankAccount.find({ AadharNumber: cleanAadhar });
    if (accounts.length > 0) {
        const mappedAccounts = accounts.map(acc => ({
            bankName: acc.BankName,
            accountNumber: acc.AccountNumber,
            maskedNumber: "****" + acc.AccountNumber.slice(-4)
        }));
        return res.status(200).json({ success: true, accounts: mappedAccounts });
    }
    return res.status(404).json({ success: false, message: "No Accounts" });
};

// 6. Process Payment
const processPayment = async (req, res) => {
    const { apiKey, amount, customerId, pin, orderId } = req.body; 

    try {
        // A. Validate Key Format
        if (!apiKey || apiKey.length < 11) {
            return res.status(400).json({ success: false, message: "Invalid API Key Format" });
        }

        // B. Find Merchant in AadharDetails (User Schema)
        const merchantUser = await AadharDetails.findOne({ api_key: apiKey });
        if (!merchantUser) {
            return res.status(400).json({ success: false, message: "Invalid Merchant Key" });
        }

        // C. Identify Settlement Account using IFSC Prefix
        // FIXED: Extract 11 characters for IFSC (Standard IFSC length)
        const targetIFSC = apiKey.substring(0, 10); 
        
        const merchantAccount = await BankAccount.findOne({ 
            AadharNumber: merchantUser.AadharNumber,
            IFSC: targetIFSC
        });

        if (!merchantAccount) {
            return res.status(400).json({ 
                success: false, 
                message: `Settlement Error: No account found for IFSC ${targetIFSC}` 
            });
        }

        // D. Find Payer Account
        const payerAccount = await BankAccount.findOne({ AccountNumber: customerId });
        if (!payerAccount) {
            return res.status(404).json({ success: false, message: "Payer account not found" });
        }

        // Checks
        if (payerAccount.AccountNumber === merchantAccount.AccountNumber) {
            return res.status(400).json({ success: false, message: "Cannot pay to self" });
        }
        if (payerAccount.CardPIN !== pin) {
            return res.status(401).json({ success: false, message: "Invalid PIN" });
        }

        // E. Transfer Funds
        const transferAmount = parseFloat(amount);
        const payerBalance = parseFloat(payerAccount.OpeningBalance.toString());

        if (payerBalance < transferAmount) {
            return res.status(400).json({ success: false, message: "Insufficient Funds" });
        }

        payerAccount.OpeningBalance = payerBalance - transferAmount;
        merchantAccount.OpeningBalance = parseFloat(merchantAccount.OpeningBalance.toString()) + transferAmount;

        await payerAccount.save();
        await merchantAccount.save();

        // F. Record Transaction
        const transactionID = Math.floor(1000000000 + Math.random() * 9000000000);
        const history = new TransactionHistory({
            TransactionID: transactionID,
            TransactionTime: new Date(),
            SenderBank: payerAccount.BankName,
            SenderAccountNumber: payerAccount.AccountNumber,
            SenderHolderName: payerAccount.FullName,
            SenderBalanceBefore: payerBalance,
            SenderBalanceAfter: payerAccount.OpeningBalance,
            ReceiverBank: merchantAccount.BankName,
            ReceiverAccountNumber: merchantAccount.AccountNumber,
            ReceiverHolderName: merchantAccount.BusinessName || merchantAccount.FullName,
            ReceiverBalanceBefore: parseFloat(merchantAccount.OpeningBalance) - transferAmount,
            ReceiverBalanceAfter: merchantAccount.OpeningBalance,
            Amount: transferAmount,
            Description: `Order ${orderId || 'Direct'} - ${merchantUser.BusinessName}`
        });

        await history.save();

        res.status(200).json({
            success: true,
            message: "Payment Successful!",
            transactionId: transactionID
        });

    } catch (err) {
        console.error("Payment Process Error:", err);
        res.status(500).json({ success: false, message: "Transaction Failed due to Server Error" });
    }
};

const renderCheckout = async (req, res) => { res.status(200).send("Use JS SDK"); };

module.exports = {
    createOrder,
    fetchPayerAccounts,
    processPayment,
    renderCheckout,
    sendAadhaarOtp,
    verifyOtpAndFetchAccounts,
    processRefund
};