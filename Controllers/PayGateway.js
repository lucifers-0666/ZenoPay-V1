const crypto = require("crypto");
const Merchant = require("../Models/Merchant");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");
const Notification = require("../Models/Notification");
const ZenoPayUser = require("../Models/ZenoPayUser");
const emailService = require("../Services/EmailService");

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Middleware to verify API Key and Secret
const verifyMerchant = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const signature = req.headers["x-signature"];

    console.log("Verifying merchant with API Key:", apiKey ? `${apiKey.substring(0, 20)}...` : "None");

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API Key is required",
      });
    }

    // Find merchant by API Key
    const merchant = await Merchant.findOne({ ApiKey: apiKey, IsActive: true });

    if (!merchant) {
      console.error("Merchant not found for API Key:", apiKey);
      return res.status(401).json({
        success: false,
        error: "Invalid API Key or Merchant is not active. Please register as a merchant first at /api-integration",
      });
    }

    console.log("Merchant verified:", merchant.BusinessName);

    // Verify signature if provided
    if (signature) {
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", merchant.SecretKey)
        .update(payload)
        .digest("hex");

      if (signature !== expectedSignature) {
        return res.status(401).json({
          success: false,
          error: "Invalid signature",
        });
      }
    }

    // Attach merchant to request
    req.merchant = merchant;
    next();
  } catch (error) {
    console.error("Merchant verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Initialize Payment Session
const initiatePayment = async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      orderId,
      customerName,
      customerEmail,
      customerMobile,
      description,
      callbackUrl,
      metadata,
    } = req.body;

    // Validate required fields
    if (!amount || !orderId || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, orderId, customerName, customerEmail",
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than 0",
      });
    }

    // Generate unique transaction reference
    const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment session
    const paymentSession = {
      transactionRef,
      merchantId: req.merchant.ZenoPayId,
      merchantName: req.merchant.BusinessName,
      amount: parseFloat(amount),
      currency,
      orderId,
      customerName,
      customerEmail,
      customerMobile,
      description: description || `Payment for Order ${orderId}`,
      callbackUrl: callbackUrl || req.merchant.CallbackUrl,
      metadata: metadata || {},
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
    };

    // In a real application, store this in a session cache (Redis) or database
    // For now, we'll sign it and return it
    const sessionToken = crypto
      .createHmac("sha256", req.merchant.SecretKey)
      .update(JSON.stringify(paymentSession))
      .digest("hex");

    res.json({
      success: true,
      data: {
        transactionRef,
        sessionToken,
        paymentUrl: `${req.protocol}://${req.get("host")}/api/payment/checkout?ref=${transactionRef}`,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        expiresAt: paymentSession.expiresAt,
      },
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate payment",
    });
  }
};

// Process Payment
const processPayment = async (req, res) => {
  try {
    const {
      transactionRef,
      paymentMethod,
      paymentDetails,
      customerZenoPayId,
      otp,
    } = req.body;

    if (!transactionRef || !paymentMethod || !customerZenoPayId) {
      // Create failed transaction record
      try {
        const lastTransaction = await TransactionHistory.findOne()
          .sort({ TransactionID: -1 })
          .limit(1);
        const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

        await TransactionHistory.create({
          TransactionID: newTransactionID,
          TransactionTime: new Date(),
          SenderBank: "Unknown",
          SenderAccountNumber: customerZenoPayId || "Unknown",
          SenderHolderName: customerZenoPayId || "Unknown",
          SenderBalanceBefore: 0,
          SenderBalanceAfter: 0,
          ReceiverBank: req.merchant?.BusinessName || "Unknown",
          ReceiverAccountNumber: "Unknown",
          ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
          ReceiverBalanceBefore: 0,
          ReceiverBalanceAfter: 0,
          Amount: req.body.amount || 0,
          Description: `Failed payment - Missing required fields (transactionRef, paymentMethod, or customerZenoPayId)`,
          Status: "failed",
        });
      } catch (recordError) {
        console.error("Failed to record transaction:", recordError);
      }

      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Check if this is a card payment (card payments don't use OTP, only PIN)
    const isCardPayment = paymentMethod === 'card' || paymentMethod === 'debit_card';

    // Only validate OTP for non-card payments (ZenoPay ID, Mobile, Email)
    if (!isCardPayment) {
      const storedOtpData = otpStore.get(customerZenoPayId);

      if (!storedOtpData) {
        // Create failed transaction record
        try {
          const lastTransaction = await TransactionHistory.findOne()
            .sort({ TransactionID: -1 })
            .limit(1);
          const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

          await TransactionHistory.create({
            TransactionID: newTransactionID,
            TransactionTime: new Date(),
            SenderBank: "Unknown",
            SenderAccountNumber: customerZenoPayId || "Unknown",
            SenderHolderName: customerZenoPayId || "Unknown",
            SenderBalanceBefore: 0,
            SenderBalanceAfter: 0,
            ReceiverBank: req.merchant?.BusinessName || "Unknown",
            ReceiverAccountNumber: "Unknown",
            ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
            ReceiverBalanceBefore: 0,
            ReceiverBalanceAfter: 0,
            Amount: req.body.amount || 0,
            Description: `Failed payment - OTP expired or not found`,
            Status: "failed",
          });
        } catch (recordError) {
          console.error("Failed to record transaction:", recordError);
        }

        return res.status(400).json({
          success: false,
          error: "OTP expired or not found. Please request a new OTP",
        });
      }

      if (!storedOtpData.verified) {
        // Create failed transaction record
        try {
          const lastTransaction = await TransactionHistory.findOne()
            .sort({ TransactionID: -1 })
            .limit(1);
          const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

          await TransactionHistory.create({
            TransactionID: newTransactionID,
            TransactionTime: new Date(),
            SenderBank: "Unknown",
            SenderAccountNumber: customerZenoPayId || "Unknown",
            SenderHolderName: customerZenoPayId || "Unknown",
            SenderBalanceBefore: 0,
            SenderBalanceAfter: 0,
            ReceiverBank: req.merchant?.BusinessName || "Unknown",
            ReceiverAccountNumber: "Unknown",
            ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
            ReceiverBalanceBefore: 0,
            ReceiverBalanceAfter: 0,
            Amount: req.body.amount || 0,
            Description: `Failed payment - OTP not verified`,
            Status: "failed",
          });
        } catch (recordError) {
          console.error("Failed to record transaction:", recordError);
        }

        return res.status(400).json({
          success: false,
          error: "OTP not verified. Please verify OTP first",
        });
      }

      if (Date.now() > storedOtpData.expiresAt) {
        otpStore.delete(customerZenoPayId);

        // Create failed transaction record
        try {
          const lastTransaction = await TransactionHistory.findOne()
            .sort({ TransactionID: -1 })
            .limit(1);
          const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

          await TransactionHistory.create({
            TransactionID: newTransactionID,
            TransactionTime: new Date(),
            SenderBank: "Unknown",
            SenderAccountNumber: customerZenoPayId || "Unknown",
            SenderHolderName: customerZenoPayId || "Unknown",
            SenderBalanceBefore: 0,
            SenderBalanceAfter: 0,
            ReceiverBank: req.merchant?.BusinessName || "Unknown",
            ReceiverAccountNumber: "Unknown",
            ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
            ReceiverBalanceBefore: 0,
            ReceiverBalanceAfter: 0,
            Amount: req.body.amount || 0,
            Description: `Failed payment - OTP has expired`,
            Status: "failed",
          });
        } catch (recordError) {
          console.error("Failed to record transaction:", recordError);
        }

        return res.status(400).json({
          success: false,
          error: "OTP has expired. Please request a new OTP",
        });
      }

      otpStore.delete(customerZenoPayId);
    }

    // Find customer's ZenoPay account
    const customer = await ZenoPayUser.findOne({ ZenoPayID: customerZenoPayId });
    if (!customer) {
      // Create failed transaction record
      try {
        const lastTransaction = await TransactionHistory.findOne()
          .sort({ TransactionID: -1 })
          .limit(1);
        const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

        await TransactionHistory.create({
          TransactionID: newTransactionID,
          TransactionTime: new Date(),
          SenderBank: "Unknown",
          SenderAccountNumber: customerZenoPayId || "Unknown",
          SenderHolderName: customerZenoPayId || "Unknown",
          SenderBalanceBefore: 0,
          SenderBalanceAfter: 0,
          ReceiverBank: req.merchant?.BusinessName || "Unknown",
          ReceiverAccountNumber: "Unknown",
          ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
          ReceiverBalanceBefore: 0,
          ReceiverBalanceAfter: 0,
          Amount: req.body.amount || 0,
          Description: `Failed payment - Customer ZenoPay account not found`,
          Status: "failed",
        });
      } catch (recordError) {
        console.error("Failed to record transaction:", recordError);
      }

      return res.status(404).json({
        success: false,
        error: "Customer ZenoPay account not found",
      });
    }

    // Check if customer has any bank accounts linked
    const customerBankAccounts = await BankAccount.find({ ZenoPayId: customer.ZenoPayID });
    if (!customerBankAccounts || customerBankAccounts.length === 0) {
      // Create failed transaction record
      try {
        const lastTransaction = await TransactionHistory.findOne()
          .sort({ TransactionID: -1 })
          .limit(1);
        const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

        await TransactionHistory.create({
          TransactionID: newTransactionID,
          TransactionTime: new Date(),
          SenderBank: "None",
          SenderAccountNumber: customerZenoPayId,
          SenderHolderName: customer.FullName,
          SenderBalanceBefore: 0,
          SenderBalanceAfter: 0,
          ReceiverBank: req.merchant?.BusinessName || "Unknown",
          ReceiverAccountNumber: "Unknown",
          ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
          ReceiverBalanceBefore: 0,
          ReceiverBalanceAfter: 0,
          Amount: req.body.amount || 0,
          Description: `Failed payment - No bank account linked to ZenoPay account`,
          Status: "failed",
        });
      } catch (recordError) {
        console.error("Failed to record transaction:", recordError);
      }

      return res.status(400).json({
        success: false,
        error: "No bank account linked to your ZenoPay account. Please add a bank account to continue with payments.",
        needsBankAccount: true,
        registrationUrl: "/open-account",
      });
    }

    // Find customer's bank account using the selected account number
    let customerAccount;
    if (paymentDetails && paymentDetails.accountNumber) {
      customerAccount = await BankAccount.findOne({
        AccountNumber: paymentDetails.accountNumber,
        ZenoPayId: customer.ZenoPayID
      });
    } else {
      // Fallback: get first account of the customer
      customerAccount = await BankAccount.findOne({
        ZenoPayId: customer.ZenoPayID
      });
    }

    if (!customerAccount) {
      // Create failed transaction record
      try {
        const lastTransaction = await TransactionHistory.findOne()
          .sort({ TransactionID: -1 })
          .limit(1);
        const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

        await TransactionHistory.create({
          TransactionID: newTransactionID,
          TransactionTime: new Date(),
          SenderBank: "Unknown",
          SenderAccountNumber: customerZenoPayId,
          SenderHolderName: customer.FullName,
          SenderBalanceBefore: 0,
          SenderBalanceAfter: 0,
          ReceiverBank: req.merchant?.BusinessName || "Unknown",
          ReceiverAccountNumber: "Unknown",
          ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
          ReceiverBalanceBefore: 0,
          ReceiverBalanceAfter: 0,
          Amount: req.body.amount || 0,
          Description: `Failed payment - Customer bank account not found`,
          Status: "failed",
        });
      } catch (recordError) {
        console.error("Failed to record transaction:", recordError);
      }

      return res.status(404).json({
        success: false,
        error: "Customer bank account not found. Please ensure you have selected a valid bank account.",
      });
    }

    // Find merchant's account
    const merchantAccount = await BankAccount.findOne({
      ZenoPayId: req.merchant.ZenoPayId,
    });

    if (!merchantAccount) {
      // Create failed transaction record
      try {
        const lastTransaction = await TransactionHistory.findOne()
          .sort({ TransactionID: -1 })
          .limit(1);
        const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

        await TransactionHistory.create({
          TransactionID: newTransactionID,
          TransactionTime: new Date(),
          SenderBank: customerAccount.BankName,
          SenderAccountNumber: customerAccount.AccountNumber,
          SenderHolderName: customer.FullName,
          SenderBalanceBefore: parseFloat(customerAccount.Balance.toString()),
          SenderBalanceAfter: parseFloat(customerAccount.Balance.toString()),
          ReceiverBank: req.merchant?.BusinessName || "Unknown",
          ReceiverAccountNumber: "Unknown",
          ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
          ReceiverBalanceBefore: 0,
          ReceiverBalanceAfter: 0,
          Amount: req.body.amount || 0,
          Description: `Failed payment - Merchant account not found`,
          Status: "failed",
        });
      } catch (recordError) {
        console.error("Failed to record transaction:", recordError);
      }

      return res.status(404).json({
        success: false,
        error: "Merchant account not found",
      });
    }

    const amount = parseFloat(req.body.amount);

    // Get next transaction ID (before checking balance)
    const lastTransaction = await TransactionHistory.findOne()
      .sort({ TransactionID: -1 })
      .limit(1);
    const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

    // Check customer balance
    const customerBalance = parseFloat(customerAccount.Balance.toString());
    if (customerBalance < amount) {
      // Create failed transaction record
      await TransactionHistory.create({
        TransactionID: newTransactionID,
        TransactionTime: new Date(),
        SenderBank: customerAccount.BankName,
        SenderAccountNumber: customerAccount.AccountNumber,
        SenderHolderName: customer.FullName,
        SenderBalanceBefore: customerBalance,
        SenderBalanceAfter: customerBalance,
        ReceiverBank: merchantAccount.BankName || "N/A",
        ReceiverAccountNumber: merchantAccount.AccountNumber || "N/A",
        ReceiverHolderName: req.merchant.BusinessName,
        ReceiverBalanceBefore: parseFloat(merchantAccount.Balance.toString()),
        ReceiverBalanceAfter: parseFloat(merchantAccount.Balance.toString()),
        Amount: amount,
        Description: `Failed payment to ${req.merchant.BusinessName} - Insufficient balance in account`,
        Status: "failed",
      });

      // Send notification about failed transaction
      await Notification.create({
        ZenoPayId: customerZenoPayId,
        Title: "Payment Failed",
        Message: `Payment of ₹${amount} to ${req.merchant.BusinessName} failed due to insufficient balance`,
        Type: "warning",
        Amount: amount,
        TransactionID: newTransactionID,
        IsRead: false,
      });

      return res.status(400).json({
        success: false,
        error: "Insufficient balance",
        transactionId: newTransactionID,
      });
    }

    // Perform transaction
    const merchantBalanceBefore = parseFloat(merchantAccount.Balance.toString());
    const customerBalanceAfter = customerBalance - amount;
    const merchantBalanceAfter = merchantBalanceBefore + amount;

    // Update balances
    customerAccount.Balance = customerBalanceAfter;
    merchantAccount.Balance = merchantBalanceAfter;

    await customerAccount.save();
    await merchantAccount.save();

    // Create transaction history
    const transaction = new TransactionHistory({
      TransactionID: newTransactionID,
      TransactionTime: new Date(),
      SenderBank: customerAccount.BankName,
      SenderAccountNumber: customerAccount.AccountNumber,
      SenderHolderName: customer.FullName,
      SenderBalanceBefore: customerBalance,
      SenderBalanceAfter: customerBalanceAfter,
      ReceiverBank: merchantAccount.BankName,
      ReceiverAccountNumber: merchantAccount.AccountNumber,
      ReceiverHolderName: req.merchant.BusinessName,
      ReceiverBalanceBefore: merchantBalanceBefore,
      ReceiverBalanceAfter: merchantBalanceAfter,
      Amount: amount,
      Description: `Payment to ${req.merchant.BusinessName} - ${req.body.description || "Order Payment"}`,
    });

    await transaction.save();

    // Update merchant stats
    await req.merchant.updateStats(amount);

    // Create notifications
    await Notification.create([
      {
        ZenoPayId: customerZenoPayId,
        Title: "Payment Successful",
        Message: `Payment of ₹${amount} to ${req.merchant.BusinessName} was successful`,
        Type: "debit",
        Amount: amount,
        TransactionID: newTransactionID,
        IsRead: false,
      },
      {
        ZenoPayId: req.merchant.ZenoPayId,
        Title: "Payment Received",
        Message: `Received payment of ₹${amount} from ${customer.FullName}`,
        Type: "credit",
        Amount: amount,
        TransactionID: newTransactionID,
        IsRead: false,
      },
    ]);

    // Send webhook to merchant if configured
    if (req.merchant.WebhookUrl) {
      sendWebhook(req.merchant.WebhookUrl, {
        event: "payment.success",
        transactionRef,
        transactionId: newTransactionID,
        amount,
        customerName: customer.FullName,
        customerEmail: customer.Email,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: newTransactionID,
        transactionRef,
        amount,
        status: "success",
        message: "Payment processed successfully",
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    
    // Try to create failed transaction record for network/system errors
    try {
      const lastTransaction = await TransactionHistory.findOne()
        .sort({ TransactionID: -1 })
        .limit(1);
      const newTransactionID = lastTransaction ? lastTransaction.TransactionID + 1 : 100001;

      await TransactionHistory.create({
        TransactionID: newTransactionID,
        TransactionTime: new Date(),
        SenderBank: "Unknown",
        SenderAccountNumber: req.body.customerZenoPayId || "Unknown",
        SenderHolderName: req.body.customerZenoPayId || "Unknown",
        SenderBalanceBefore: 0,
        SenderBalanceAfter: 0,
        ReceiverBank: req.merchant?.BusinessName || "Unknown",
        ReceiverAccountNumber: "Unknown",
        ReceiverHolderName: req.merchant?.BusinessName || "Unknown",
        ReceiverBalanceBefore: 0,
        ReceiverBalanceAfter: 0,
        Amount: req.body.amount || 0,
        Description: `Failed payment - Network or system error: ${error.message}`,
        Status: "failed",
      });
    } catch (recordError) {
      console.error("Failed to record transaction:", recordError);
    }

    res.status(500).json({
      success: false,
      error: "Failed to process payment due to network or system error",
    });
  }
};

const verifyCustomer = async (req, res) => {
  try {
    const { zenoPayId, email, mobile, otp, cardNumber, cvv, cardPin, nameOnCard, cardExpiry } = req.body;

    if (!zenoPayId && !email && !mobile && !cardNumber) {
      return res.status(400).json({
        success: false,
        error: "ZenoPay ID, Email, Mobile, or Card Number is required",
      });
    }

    if (cardNumber) {
      if (!cvv || !cardPin || !nameOnCard || !cardExpiry) {
        return res.status(400).json({
          success: false,
          error: "Card verification requires CVV, PIN, Name on Card, and Expiry Date",
        });
      }

      const bankAccount = await BankAccount.findOne({ 
        DebitCardNumber: cardNumber,
        CardCVV: cvv,
        CardPIN: cardPin,
        NameOnCard: nameOnCard,
        CardExpiry: cardExpiry,
        AccountStatus: "Active",
        DebitCardStatus: "Active"
      });

      if (!bankAccount) {
        return res.status(401).json({
          success: false,
          error: "Invalid card details or card is inactive",
        });
      }

      const currentDate = new Date();
      const [expiryMonth, expiryYear] = cardExpiry.split('/');
      const expiryDate = new Date(`20${expiryYear}`, expiryMonth - 1);

      if (currentDate > expiryDate) {
        return res.status(401).json({
          success: false,
          error: "Card has expired",
        });
      }

      return res.json({
        success: true,
        data: {
          name: bankAccount.FullName,
          email: bankAccount.Email,
          zenoPayId: bankAccount.ZenoPayId,
          profileImage: null,
          bankAccount: {
            accountNumber: bankAccount.AccountNumber,
            bankName: bankAccount.BankName,
            balance: parseFloat(bankAccount.Balance.toString())
          },
          isCardPayment: true
        },
      });
    }

    let user;
    if (zenoPayId) {
      user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    } else if (email) {
      user = await ZenoPayUser.findOne({ Email: email });
    } else if (mobile) {
      user = await ZenoPayUser.findOne({ Mobile: mobile });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found. Please check your ZenoPay ID, Email, or Mobile number and try again.",
      });
    }

    if (otp) {
      const identifier = zenoPayId || mobile || email;
      const storedOtpData = otpStore.get(identifier);

      if (!storedOtpData) {
        return res.status(400).json({
          success: false,
          error: "OTP expired or not found. Please request a new OTP",
        });
      }

      if (Date.now() > storedOtpData.expiresAt) {
        otpStore.delete(identifier);
        return res.status(400).json({
          success: false,
          error: "OTP has expired. Please request a new OTP",
        });
      }

      if (otp !== storedOtpData.otp) {
        return res.status(400).json({
          success: false,
          error: "Invalid OTP",
        });
      }

      storedOtpData.verified = true;
      otpStore.set(identifier, storedOtpData);
      otpStore.set(user.ZenoPayID, storedOtpData);
    }

    const accounts = await BankAccount.find({ ZenoPayId: user.ZenoPayID });

    res.json({
      success: true,
      data: {
        zenoPayId: user.ZenoPayID,
        name: user.FullName,
        email: user.Email,
        mobile: user.Mobile,
        hasAccount: accounts.length > 0,
        balance: accounts.length > 0 ? parseFloat(accounts[0].Balance.toString()) : 0,
        bankAccounts: accounts.map(acc => ({
          accountNumber: acc.AccountNumber,
          bankName: acc.BankName,
          balance: parseFloat(acc.Balance.toString())
        })),
      },
    });
  } catch (error) {
    console.error("Customer verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify customer",
    });
  }
};

// Send OTP
const sendPaymentOTP = async (req, res) => {
  try {
    const { zenoPayId, mobile, email, cardNumber } = req.body;

    if (!zenoPayId && !mobile && !email && !cardNumber) {
      return res.status(400).json({
        success: false,
        error: "At least one identifier is required",
      });
    }

    if (cardNumber) {
      const bankAccount = await BankAccount.findOne({ DebitCardNumber: cardNumber });
      
      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          error: "Card not found. Please register at ZenoPay first.",
          registrationUrl: "/register-zenopay",
          needsRegistration: true,
        });
      }

      return res.json({
        success: true,
        message: "Card verified. No OTP required for card payments.",
        isCardPayment: true,
        userData: {
          zenoPayId: bankAccount.ZenoPayId,
          fullName: bankAccount.FullName,
          cardNumber: cardNumber,
        },
      });
    }

    let user;
    if (zenoPayId) {
      user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    } else if (email) {
      user = await ZenoPayUser.findOne({ Email: email });
    } else if (mobile) {
      user = await ZenoPayUser.findOne({ Mobile: mobile });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Account not found. Please register at ZenoPay first.",
        registrationUrl: "/register-zenopay",
        needsRegistration: true,
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5 minute expiry and user details
    const identifier = zenoPayId || mobile || email;
    otpStore.set(identifier, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      email: user.Email,
      zenoPayId: user.ZenoPayID,
      fullName: user.FullName,
    });

    // Send OTP via email
    await emailService.sendEmail(
      user.Email,
      "ZenoPay Payment OTP",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">🔐 ZenoPay Payment Verification</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">Hello ${user.FullName},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">You have requested to complete a payment transaction. Please use the following OTP to verify:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 5px;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 14px; line-height: 1.5;">This OTP is valid for 5 minutes only.</p>
          <p style="color: #999; font-size: 14px; line-height: 1.5;">If you did not request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">ZenoPay - Secure Digital Payments</p>
        </div>
      </div>
      `
    );

    console.log(`OTP sent to ${user.Email} for ${identifier}: ${otp}`);

    res.json({
      success: true,
      message: "OTP sent successfully to your registered email",
      email: user.Email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email
      userData: {
        zenoPayId: user.ZenoPayID,
        fullName: user.FullName,
        email: user.Email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
      },
    });
  } catch (error) {
    console.error("OTP sending error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP",
    });
  }
};

// Get Payment Status
const getPaymentStatus = async (req, res) => {
  try {
    const { transactionRef, transactionId } = req.query;

    if (!transactionRef && !transactionId) {
      return res.status(400).json({
        success: false,
        error: "Transaction reference or ID is required",
      });
    }

    let transaction;
    if (transactionId) {
      transaction = await TransactionHistory.findOne({
        TransactionID: parseInt(transactionId),
      });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.TransactionID,
        amount: parseFloat(transaction.Amount.toString()),
        status: "success",
        timestamp: transaction.TransactionTime,
        senderName: transaction.SenderHolderName,
        receiverName: transaction.ReceiverHolderName,
      },
    });
  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get payment status",
    });
  }
};

// Helper function to send webhook
const sendWebhook = async (url, data) => {
  try {
    const https = require("https");
    const http = require("http");
    const urlModule = require("url");

    const parsedUrl = urlModule.parse(url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = protocol.request(options);
    req.write(JSON.stringify(data));
    req.end();
  } catch (error) {
    console.error("Webhook error:", error);
  }
};

// Create Order (Razorpay-style)
const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;

    if (!amount) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "amount is required",
        },
      });
    }

    // Generate order ID
    const orderId = `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Store order details (in production, store in database)
    const order = {
      id: orderId,
      entity: "order",
      amount: Math.round(amount * 100), // Convert to paise like Razorpay
      amount_paid: 0,
      amount_due: Math.round(amount * 100),
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      status: "created",
      attempts: 0,
      notes: notes || {},
      created_at: Math.floor(Date.now() / 1000),
      merchantId: req.merchant.ZenoPayId,
      merchantName: req.merchant.BusinessName,
    };

    res.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        description: "Failed to create order",
      },
    });
  }
};

// Verify Payment (Razorpay-style signature verification)
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      zenopay_order_id,
      zenopay_payment_id,
      zenopay_signature,
    } = req.body;

    const orderId = razorpay_order_id || zenopay_order_id;
    const paymentId = razorpay_payment_id || zenopay_payment_id;
    const signature = razorpay_signature || zenopay_signature;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", req.merchant.SecretKey)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (signature === expectedSignature) {
      res.json({
        success: true,
        message: "Payment verified successfully",
        signatureIsValid: true,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid signature",
        signatureIsValid: false,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
    });
  }
};

// Get SDK Configuration (for embedding the payment widget)
const getSDKConfig = async (req, res) => {
  try {
    const apiKey = req.query.apiKey;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "API Key is required",
      });
    }

    const merchant = await Merchant.findOne({ ApiKey: apiKey, IsActive: true });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Invalid API Key",
      });
    }

    res.json({
      success: true,
      config: {
        merchantId: merchant.ZenoPayId,
        merchantName: merchant.BusinessName,
        apiKey: merchant.ApiKey,
        allowedDomains: merchant.AllowedDomains,
      },
    });
  } catch (error) {
    console.error("SDK config error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get configuration",
    });
  }
};

const processRefund = async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;

    if (!transactionId || !amount) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID and amount are required"
      });
    }

    const transaction = await TransactionHistory.findOne({ TransactionID: transactionId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found"
      });
    }

    if (transaction.Status !== "Success") {
      return res.status(400).json({
        success: false,
        error: "Only successful transactions can be refunded"
      });
    }

    if (transaction.RefundStatus === "Refunded") {
      return res.status(400).json({
        success: false,
        error: "Transaction already refunded"
      });
    }

    if (amount > transaction.Amount) {
      return res.status(400).json({
        success: false,
        error: "Refund amount cannot exceed transaction amount"
      });
    }

    const senderAccount = await BankAccount.findOne({ AccountNumber: transaction.FromAccount });
    const receiverAccount = await BankAccount.findOne({ AccountNumber: transaction.ToAccount });

    if (!senderAccount || !receiverAccount) {
      return res.status(404).json({
        success: false,
        error: "Account not found"
      });
    }

    senderAccount.Balance += amount;
    receiverAccount.Balance -= amount;

    await senderAccount.save();
    await receiverAccount.save();

    transaction.RefundStatus = amount === transaction.Amount ? "Refunded" : "PartialRefund";
    transaction.RefundAmount = amount;
    transaction.RefundReason = reason || "Merchant initiated refund";
    transaction.RefundDate = new Date();
    await transaction.save();

    const refundTransaction = new TransactionHistory({
      TransactionID: `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      FromAccount: transaction.ToAccount,
      ToAccount: transaction.FromAccount,
      Amount: amount,
      TransactionType: "Refund",
      Status: "Success",
      Description: `Refund for ${transactionId} - ${reason || "Merchant initiated refund"}`,
      Date: new Date()
    });
    await refundTransaction.save();

    await Notification.create({
      UserId: transaction.FromUserId,
      Title: "Refund Processed",
      Message: `₹${amount.toFixed(2)} has been refunded to your account`,
      Type: "Transaction",
      Date: new Date()
    });

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: {
        refundId: refundTransaction.TransactionID,
        originalTransactionId: transactionId,
        refundAmount: amount,
        refundStatus: transaction.RefundStatus,
        refundDate: transaction.RefundDate
      }
    });
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process refund"
    });
  }
};

module.exports = {
  verifyMerchant,
  initiatePayment,
  processPayment,
  verifyCustomer,
  sendPaymentOTP,
  getPaymentStatus,
  getSDKConfig,
  createOrder,
  verifyPayment,
  processRefund,
};
