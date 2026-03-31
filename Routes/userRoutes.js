const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const ZenoPayController = require("../Controllers/ZenoPayController");
const BankController = require("../Controllers/BankAccountController");
const BranchController = require("../Controllers/BankController");
const TransferController = require("../Controllers/TransferMoney");
const LegacyProfileController = require("../Controllers/Profile");
const NotificationController = require("../Controllers/Notifications");
const SettingsController = require("../Controllers/SettingsController");
const KYCController = require("../Controllers/KYCController");
const RequestMoneyController = require("../Controllers/RequestMoneyController");
const QRPaymentController = require("../Controllers/QRPaymentController");
const PaymentMethodsController = require("../Controllers/PaymentMethodsController");
const AddCardController = require("../Controllers/AddCardController");
const SupportController = require("../Controllers/SupportController");
const ReportIssueController = require("../Controllers/ReportIssueController");
const DisputeController = require("../Controllers/DisputeController");
const StatementsController = require("../Controllers/StatementsController");
const ReceiptsController = require("../Controllers/ReceiptsController");
const ReferralController = require("../Controllers/ReferralController");
const LegalPagesController = require("../Controllers/LegalPagesController");
const ContactController = require("../Controllers/ContactController");
const PricingController = require("../Controllers/PricingController");
const BeneficiaryController = require("../Controllers/BeneficiaryController");
const SystemStatusController = require("../Controllers/SystemStatusController");
const TransactionInfoController = require("../Controllers/TransactionHistory");
const WalletController = require("../Controllers/WalletController");
const Invoice = require("../Models/Invoice");
const { isAuthenticated } = require("../Middleware/authGuards");
const TransactionHistoryModel = require("../Models/TransactionHistory");
const ZenoPayUser = require("../Models/ZenoPayUser");
const LoginHistory = require("../Models/LoginHistory");
const ScheduledPayment = require("../Models/ScheduledPayment");
const AuditLog = require("../Models/AuditLog");
const requirePin = require("../Middleware/requirePin");
const UserPinController = require("../Controllers/UserPinController");
const kycUpload = require("../Middleware/kycUpload");
const checkTransactionLimit = require("../Middleware/checkTransactionLimit");
const { KYC_ROUTES } = require("./constants");

const serializeScheduledPayment = (row) => ({
  id: String(row._id),
  recipient: row.recipient,
  description: row.description,
  frequency: row.frequency,
  method: row.method,
  amount: Number(row.amount || 0),
  nextDue: row.nextDue ? new Date(row.nextDue).toISOString().slice(0, 10) : null,
  status: row.status,
  runCount: Number(row.runCount || 0),
  lastRunAt: row.lastRunAt ? new Date(row.lastRunAt).toISOString() : null,
  totalExecutedAmount: Number(row.totalExecutedAmount || 0),
  lastExecutionRef: row.lastExecutionRef || "",
});

const calculateNextDueDate = (fromDate, frequency) => {
  const base = new Date(fromDate || Date.now());
  const next = new Date(base);

  switch (String(frequency || "Monthly").toLowerCase()) {
    case "one-time":
      return null;
    case "daily":
      next.setDate(next.getDate() + 1);
      return next;
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "custom":
      next.setDate(next.getDate() + 30);
      return next;
    case "monthly":
    default:
      next.setMonth(next.getMonth() + 1);
      return next;
  }
};

// Multer Setup for Azure Blob Storage
// Use memory storage to upload directly to Azure instead of saving to disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    return cb(new Error("Only image files are allowed!"));
  },
});

const publicGetPaths = new Set([
  "/support",
  "/support/search",
  "/terms",
  "/privacy",
  "/about",
  "/help",
  "/faq",
  "/api-integration",
  "/api-docs",
  "/pricing",
  "/contact",
]);

router.use((req, res, next) => {
  const isPublicSupportCategory = req.method === "GET" && req.path.startsWith("/support/category/");
  const isPublicGet = req.method === "GET" && publicGetPaths.has(req.path);
  const isPublicRegistration = req.path === "/register-zenopay" && (req.method === "GET" || req.method === "POST");
  const isPublicVerification = req.path === "/verify-zenopayId" && req.method === "POST";

  if (isPublicGet || isPublicSupportCategory || isPublicRegistration || isPublicVerification) {
    return next();
  }

  return isAuthenticated(req, res, next);
});

// Shop page
// Beneficiary Management
router.get("/beneficiaries", BeneficiaryController.getBeneficiariesPage);

// Request money and payments pages
router.get("/request-money", RequestMoneyController.getRequestMoneyPage);
router.post("/request-money", RequestMoneyController.createRequestMoney);
router.get("/request-money/:requestId", RequestMoneyController.getRequestMoneyDetailsPage);
router.get("/qr-payment", QRPaymentController.getQRPaymentPage);
router.post("/qr-payment/generate", QRPaymentController.generateDynamicQR);
router.get("/payment-methods", PaymentMethodsController.getPaymentMethodsPage);
router.post("/payment-methods/set-default", PaymentMethodsController.setDefaultPaymentMethod);
router.post("/payment-methods/remove", PaymentMethodsController.removePaymentMethod);
router.post("/payment-methods/disconnect-wallet", PaymentMethodsController.disconnectWallet);
router.get("/add-card", AddCardController.getAddCardPage);
router.post("/add-card", AddCardController.addCard);

router.get("/payment/success", async (req, res) => {
  const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const now = new Date();
  const txId = Number(req.query.txId || req.query.transactionId || 0);
  let txRecord = null;

  if (txId) {
    txRecord = await TransactionHistoryModel.findOne({ TransactionID: txId }).lean();
  }

  const amount = txRecord ? Number(txRecord.Amount) : Number(req.query.amount || 5000);
  const fee = Number(req.query.fee || 14.75);

  const tx = {
    id: txRecord?.TransactionID || req.query.txId || `ZP-${now.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    paidTo: txRecord?.ReceiverHolderName || req.query.to || "Priya Mehta",
    toAccountMasked: txRecord?.ReceiverAccountNumber ? `XXXX XXXX ${String(txRecord.ReceiverAccountNumber).slice(-4)}` : (req.query.toAccount || "XXXX XXXX 8934"),
    paymentMethod: req.query.method || "UPI Transfer",
    dateTimeFormatted: new Date(txRecord?.TransactionTime || now).toLocaleString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", " -"),
    type: req.query.type || "Money Transfer",
    feeFormatted: formatINR(fee),
    amountSentFormatted: formatINR(amount),
    totalDebitedFormatted: formatINR(amount + fee),
    receiptUrl: req.query.receiptUrl || "/receipts",
  };

  return res.render("payment-success", {
    pageTitle: "Payment Successful - ZenoPay",
    isLoggedIn: true,
    user: req.session.user || null,
    tx,
    loadingMs: Number(req.query.loadingMs || 1400),
    redirectSeconds: Number(req.query.redirect || 10),
  });
});
router.get("/payment/success/:transactionId", (req, res) => {
  return res.redirect(`/payment/success?transactionId=${encodeURIComponent(req.params.transactionId)}`);
});

router.get("/payment/failed", async (req, res) => {
  const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const now = new Date();
  const txId = Number(req.query.txId || req.query.transactionId || 0);
  let txRecord = null;

  if (txId) {
    txRecord = await TransactionHistoryModel.findOne({ TransactionID: txId }).lean();
  }

  const amount = txRecord ? Number(txRecord.Amount) : Number(req.query.amount || 5000);

  const tx = {
    id: txRecord?.TransactionID || req.query.attemptId || `ZP-FAIL-${now.getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    intendedFor: txRecord?.ReceiverHolderName || req.query.to || "Priya Mehta",
    method: req.query.method || "UPI Transfer",
    attemptedAt: new Date(txRecord?.TransactionTime || now).toLocaleString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", " -"),
    amount: formatINR(amount),
    errorCode: req.query.errorCode || "TRANSACTION_FAILED",
    failureReason: req.query.reason || "Your bank declined this transaction. Please verify balance and try again.",
  };

  return res.render("payment-failed", {
    pageTitle: "Payment Failed - ZenoPay",
    isLoggedIn: true,
    user: req.session.user || null,
    tx,
  });
});
router.get("/payment/failed/:transactionId", (req, res) => {
  return res.redirect(`/payment/failed?transactionId=${encodeURIComponent(req.params.transactionId)}`);
});

router.get("/payment/pending", async (req, res) => {
  const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const now = new Date();
  const txId = Number(req.query.txId || req.query.transactionId || 0);
  let txRecord = null;

  if (txId) {
    txRecord = await TransactionHistoryModel.findOne({ TransactionID: txId }).lean();
  }

  const amount = txRecord ? Number(txRecord.Amount) : Number(req.query.amount || 5000);

  const tx = {
    id: txRecord?.TransactionID || req.query.txId || `ZP-${now.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    sendingTo: txRecord?.ReceiverHolderName || req.query.to || "Priya Mehta",
    method: req.query.method || "NEFT Transfer",
    submittedAt: new Date(txRecord?.TransactionTime || now).toLocaleString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", " -"),
    amountFormatted: formatINR(amount),
    eta: req.query.eta || "5–30 minutes",
    step1Time: req.query.step1 || "11:09 AM",
    step2Time: req.query.step2 || "11:10 AM",
    step3Time: req.query.step3 || "In progress now",
  };

  return res.render("payment-pending", {
    pageTitle: "Payment Processing - ZenoPay",
    isLoggedIn: true,
    user: req.session.user || null,
    tx,
  });
});
router.get("/payment/pending/:transactionId", (req, res) => {
  return res.redirect(`/payment/pending?transactionId=${encodeURIComponent(req.params.transactionId)}`);
});

router.get("/security-settings", async (req, res) => {
  const zenoPayId = req.session.user?.ZenoPayID || null;
  const user = zenoPayId ? await ZenoPayUser.findOne({ ZenoPayID: zenoPayId }).lean() : null;

  const twoFAEnabled = !!(user?.NotificationPreferences?.transactionAlerts);
  const scoreFromFlags = [
    user?.EmailVerified ? 20 : 0,
    user?.KYCStatus === "verified" || user?.KYCStatus === "approved" ? 30 : 0,
    twoFAEnabled ? 30 : 0,
    user?.PasswordChangeDate ? 20 : 0,
  ].reduce((sum, v) => sum + v, 0);
  const score = Math.max(0, Math.min(100, Number(req.query.score || scoreFromFlags || 60)));

  const recentHistory = zenoPayId
    ? await LoginHistory.find({ ZenoPayId: zenoPayId }).sort({ loginAt: -1 }).limit(10).lean()
    : [];

  const sessions = [
    {
      deviceType: /mobile|android|iphone/i.test(req.headers["user-agent"] || "") ? "mobile" : "desktop",
      icon: /mobile|android|iphone/i.test(req.headers["user-agent"] || "") ? "fa-mobile-alt" : "fa-desktop",
      deviceName: (req.headers["user-agent"] || "Current Device").slice(0, 60),
      location: "Current Location",
      ip: req.ip || "Unknown IP",
      browser: "Active Session",
      lastActive: "Just now",
      current: true,
    },
  ];

  const loginHistory = (recentHistory || []).map((entry) => ({
    status: entry.status,
    statusLabel: String(entry.status || "success").charAt(0).toUpperCase() + String(entry.status || "success").slice(1),
    dateTime: new Date(entry.loginAt).toLocaleString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", " •"),
    device: entry.device || "Unknown Device",
    location: entry.location || "Unknown Location",
    ip: entry.ip || "Unknown IP",
  }));

  const security = {
    score,
    twoFAEnabled,
    levelTitle: score >= 80 ? "Good Security Level" : score >= 60 ? "Moderate Security Level" : "Security Needs Attention",
    subtitle: score >= 100 ? "Excellent! Your account is fully secured." : "Enable more security controls to improve protection.",
    methods: [
      { id: "authenticator", iconClass: "auth", icon: "fa-clock", title: "Authenticator App", description: "Google Authenticator / Authy", active: twoFAEnabled },
      { id: "sms", iconClass: "sms", icon: "fa-sms", title: "SMS OTP", description: user?.Mobile ? `Sent to +91 ${String(user.Mobile).slice(-5).padStart(10, "X")}` : "No phone configured", active: false },
      { id: "email", iconClass: "email", icon: "fa-envelope", title: "Email OTP", description: user?.Email || "Email not configured", active: false },
    ],
  };

  const preferences = [
    { icon: "fa-bell", title: "Login Notifications", description: "Get notified whenever a new login is detected.", enabled: true },
    { icon: "fa-lock", title: "Auto-Lock after 15 minutes", description: "Automatically lock the app after inactivity.", enabled: true },
    { icon: "fa-eye-slash", title: "Hide Balance by default", description: "Mask account balances until manually revealed.", enabled: false },
    { icon: "fa-envelope", title: "Email on every withdrawal", description: "Receive an email for each withdrawal transaction.", enabled: !!user?.NotificationPreferences?.emailNotifications },
    { icon: "fa-exclamation-triangle", title: "Suspicious Activity Alerts", description: "Get instant alerts for unusual account activity.", enabled: !!user?.NotificationPreferences?.transactionAlerts },
    { icon: "fa-fingerprint", title: "Biometric unlock", description: "Use fingerprint/face unlock where supported.", enabled: false },
  ];

  return res.render("security-settings", {
    pageTitle: "Security Settings - ZenoPay",
    isLoggedIn: true,
    user: req.session.user || null,
    security,
    sessions,
    loginHistory,
    preferences,
  });
});

router.get("/onboarding", (req, res) => {
  const user = req.session.user || null;
  const prefilledPhone = req.query.phone || user?.Mobile || user?.PhoneNumber || "+91 98765 43210";

  return res.render("onboarding", {
    pageTitle: "Welcome to ZenoPay",
    isLoggedIn: true,
    user,
    prefilledPhone,
  });
});
router.post("/onboarding", LegacyProfileController.postOnboarding);

router.get("/add-money", WalletController.getAddMoneyPage);
router.post("/add-money", WalletController.addMoney);
router.get("/withdraw", WalletController.getWithdrawPage);
router.get("/limits", WalletController.getTransactionLimits);
router.post("/withdraw", requirePin, checkTransactionLimit, WalletController.withdrawMoney);

router.get("/user/set-pin", UserPinController.getSetPin);
router.post("/user/set-pin", UserPinController.postSetPin);
router.get("/user/change-pin", UserPinController.getChangePin);
router.post("/user/change-pin", UserPinController.postChangePin);
router.get("/verify-pin", UserPinController.getVerifyPin);
router.post("/verify-pin", UserPinController.postVerifyPin);

router.get("/scheduled-payments", async (req, res) => {
  const zenoPayId = req.session.user?.ZenoPayID || null;
  let payments = [];
  let beneficiaries = [];

  if (zenoPayId) {
    const rows = await ScheduledPayment.find({ ZenoPayId: zenoPayId }).sort({ nextDue: 1 }).lean();
    payments = rows.map((row) => serializeScheduledPayment(row));
    beneficiaries = [...new Set(rows.map((row) => row.recipient).filter(Boolean))];
  }

  return res.render("scheduled-payments", {
    pageTitle: "Scheduled Payments - ZenoPay",
    isLoggedIn: true,
    user: req.session.user || null,
    payments,
    beneficiaries,
  });
});

router.post("/scheduled-payments", async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || null;
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      recipient,
      amount,
      description,
      startDate,
      frequency,
      method,
      repeatUntil,
      untilCancelled,
    } = req.body || {};

    if (!recipient || !amount || !startDate) {
      return res.status(400).json({ success: false, message: "recipient, amount and startDate are required" });
    }

    const saved = await ScheduledPayment.create({
      ZenoPayId: zenoPayId,
      recipient: String(recipient).trim(),
      amount: Number(amount),
      description: description ? String(description).trim() : "Scheduled payment",
      nextDue: new Date(startDate),
      frequency: frequency || "Monthly",
      method: method || "UPI",
      endDate: repeatUntil ? new Date(repeatUntil) : null,
      untilCancelled: !!untilCancelled,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      payment: serializeScheduledPayment(saved),
    });
  } catch (error) {
    console.error("[Scheduled Payments] Create failed:", error);
    return res.status(500).json({ success: false, message: "Failed to create scheduled payment" });
  }
});

router.patch("/scheduled-payments/:id", async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || null;
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      recipient,
      amount,
      description,
      startDate,
      frequency,
      method,
      repeatUntil,
      untilCancelled,
      status,
    } = req.body || {};

    const updates = {};
    if (typeof recipient === "string" && recipient.trim()) updates.recipient = recipient.trim();
    if (amount !== undefined) updates.amount = Number(amount);
    if (description !== undefined) updates.description = String(description || "Scheduled payment").trim();
    if (startDate) updates.nextDue = new Date(startDate);
    if (frequency) updates.frequency = frequency;
    if (method) updates.method = method;
    if (repeatUntil !== undefined) updates.endDate = repeatUntil ? new Date(repeatUntil) : null;
    if (untilCancelled !== undefined) updates.untilCancelled = !!untilCancelled;
    if (["active", "paused", "completed", "failed"].includes(status)) updates.status = status;

    const updated = await ScheduledPayment.findOneAndUpdate(
      { _id: id, ZenoPayId: zenoPayId },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Scheduled payment not found" });
    }

    return res.json({
      success: true,
      payment: serializeScheduledPayment(updated),
    });
  } catch (error) {
    console.error("[Scheduled Payments] Update failed:", error);
    return res.status(500).json({ success: false, message: "Failed to update scheduled payment" });
  }
});

router.delete("/scheduled-payments/:id", async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || null;
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const deleted = await ScheduledPayment.findOneAndDelete({
      _id: req.params.id,
      ZenoPayId: zenoPayId,
    }).lean();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Scheduled payment not found" });
    }

    return res.json({ success: true, id: String(deleted._id) });
  } catch (error) {
    console.error("[Scheduled Payments] Delete failed:", error);
    return res.status(500).json({ success: false, message: "Failed to delete scheduled payment" });
  }
});

router.post("/scheduled-payments/:id/pay-now", requirePin, checkTransactionLimit, async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || null;
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const scheduledPayment = await ScheduledPayment.findOne({
      _id: req.params.id,
      ZenoPayId: zenoPayId,
    });

    if (!scheduledPayment) {
      return res.status(404).json({ success: false, message: "Scheduled payment not found" });
    }

    if (scheduledPayment.status === "paused") {
      return res.status(400).json({ success: false, message: "Cannot execute a paused scheduled payment" });
    }

    if (scheduledPayment.status === "completed") {
      return res.status(400).json({ success: false, message: "This scheduled payment is already completed" });
    }

    const now = new Date();
    const executionRef = `SP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const nextDueCandidate = calculateNextDueDate(now, scheduledPayment.frequency);

    scheduledPayment.runCount = Number(scheduledPayment.runCount || 0) + 1;
    scheduledPayment.lastRunAt = now;
    scheduledPayment.totalExecutedAmount = Number(scheduledPayment.totalExecutedAmount || 0) + Number(scheduledPayment.amount || 0);
    scheduledPayment.lastExecutionRef = executionRef;

    scheduledPayment.executionHistory = Array.isArray(scheduledPayment.executionHistory)
      ? scheduledPayment.executionHistory
      : [];

    scheduledPayment.executionHistory.push({
      executedAt: now,
      amount: Number(scheduledPayment.amount || 0),
      status: "success",
      reference: executionRef,
      note: "Manual Pay Now execution",
    });

    if (scheduledPayment.executionHistory.length > 25) {
      scheduledPayment.executionHistory = scheduledPayment.executionHistory.slice(-25);
    }

    if (!nextDueCandidate || String(scheduledPayment.frequency).toLowerCase() === "one-time") {
      scheduledPayment.status = "completed";
      scheduledPayment.nextDue = null;
    } else {
      if (!scheduledPayment.untilCancelled && scheduledPayment.endDate && nextDueCandidate > new Date(scheduledPayment.endDate)) {
        scheduledPayment.status = "completed";
        scheduledPayment.nextDue = null;
      } else {
        scheduledPayment.status = "active";
        scheduledPayment.nextDue = nextDueCandidate;
      }
    }

    await scheduledPayment.save();

    await AuditLog.create({
      action: "scheduled_payment_executed",
      category: "transaction",
      description: `Scheduled payment executed for ${scheduledPayment.recipient}`,
      targetId: String(scheduledPayment._id),
      targetType: "ScheduledPayment",
      ipAddress: req.ip || "",
      userAgent: req.headers["user-agent"] || "",
      status: "success",
      metadata: {
        zenoPayId,
        executionRef,
        amount: Number(scheduledPayment.amount || 0),
        method: scheduledPayment.method,
        runCount: scheduledPayment.runCount,
        nextDue: scheduledPayment.nextDue,
      },
    });

    return res.json({
      success: true,
      executionRef,
      payment: serializeScheduledPayment(scheduledPayment.toObject()),
      redirectUrl: `/payment/success?txId=${encodeURIComponent(executionRef)}&amount=${encodeURIComponent(scheduledPayment.amount)}&to=${encodeURIComponent(scheduledPayment.recipient)}&method=${encodeURIComponent(scheduledPayment.method)}&type=Scheduled%20Payment`,
    });
  } catch (error) {
    console.error("[Scheduled Payments] Pay now failed:", error);
    return res.status(500).json({ success: false, message: "Failed to execute scheduled payment" });
  }
});

router.get("/invoices", async (req, res) => {
  const user = req.session.user || null;
  const userId = user?.ZenoPayID || null;

  try {
    let invoices = [];

    if (userId) {
      const storedInvoices = await Invoice.find({ user_id: userId })
        .sort({ issue_date: -1, createdAt: -1 })
        .lean();

      invoices = storedInvoices.map((invoice) => {
        return {
          id: String(invoice._id),
          invoiceNo: `#${invoice.invoice_number || `INV-${String(invoice._id).slice(-6).toUpperCase()}`}`,
          client: invoice.client_name || "N/A",
          issueDate: invoice.issue_date ? new Date(invoice.issue_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          dueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          amount: Number(invoice.amount || 0),
          status: String(invoice.status || "draft").toLowerCase(),
        };
      });
    }

    return res.render("invoices", {
      pageTitle: "Invoices - ZenoPay",
      isLoggedIn: true,
      user,
      invoices,
    });
  } catch (error) {
    console.error("[Invoices] Error loading invoice data:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
});

router.post("/invoices", async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Please login to create invoices." });
    }

    const { client, amount, dueDate, status, notes, clientEmail, clientAddress } = req.body || {};
    const normalizedClient = String(client || "").trim();
    const parsedAmount = Number(amount);
    const parsedDueDate = new Date(dueDate);
    const normalizedStatus = ["paid", "pending", "overdue", "draft"].includes(String(status || "").toLowerCase())
      ? String(status).toLowerCase()
      : "pending";

    if (!normalizedClient) {
      return res.status(400).json({ success: false, message: "Client name is required." });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0." });
    }

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ success: false, message: "Valid due date is required." });
    }

    const invoiceNumber = await Invoice.generateInvoiceNumber();

    const created = await Invoice.create({
      invoice_number: invoiceNumber,
      user_id: userId,
      client_name: normalizedClient,
      client_email: String(clientEmail || "").trim(),
      client_address: String(clientAddress || "").trim(),
      issue_date: new Date(),
      due_date: parsedDueDate,
      amount: parsedAmount,
      status: normalizedStatus,
      notes: String(notes || "").trim(),
    });

    return res.status(201).json({
      success: true,
      invoice: {
        id: String(created._id),
        invoiceNo: `#${created.invoice_number}`,
        client: created.client_name,
        issueDate: new Date(created.issue_date).toISOString().split("T")[0],
        dueDate: new Date(created.due_date).toISOString().split("T")[0],
        amount: Number(created.amount || 0),
        status: String(created.status || "pending").toLowerCase(),
      },
    });
  } catch (error) {
    console.error("[Invoices] Error creating invoice:", error);
    return res.status(500).json({ success: false, message: "Unable to create invoice right now." });
  }
});

router.get("/invoice/:id", async (req, res) => {
  try {
    const user = req.session.user || null;
    const userId = user?.ZenoPayID || null;
    const invoiceId = req.params.id;

    if (!userId) {
      return res.redirect("/login");
    }

    const storedInvoice = await Invoice.findOne({
      _id: invoiceId,
      user_id: userId,
    }).lean();

    if (!storedInvoice) {
      return res.status(404).render("error-404", {
        pageTitle: "Invoice Not Found - ZenoPay",
        path: req.path,
      });
    }

    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    };

    const invoice = {
      id: String(storedInvoice._id),
      invoiceNo: `#${storedInvoice.invoice_number || `INV-${String(storedInvoice._id).slice(-6).toUpperCase()}`}`,
      client: storedInvoice.client_name || "N/A",
      clientEmail: storedInvoice.client_email || null,
      clientAddress: storedInvoice.client_address || null,
      issueDate: formatDate(storedInvoice.issue_date || new Date()),
      dueDate: formatDate(storedInvoice.due_date || new Date()),
      amount: Number(storedInvoice.amount || 0),
      subtotal: Number(storedInvoice.amount || 0),
      status: String(storedInvoice.status || "draft").toLowerCase(),
      notes: storedInvoice.notes || "",
      items: storedInvoice.items || null,
      paymentInfo: storedInvoice.payment_info || null,
    };

    return res.render("invoice-detail", {
      pageTitle: `Invoice ${invoice.invoiceNo} - ZenoPay`,
      isLoggedIn: true,
      user,
      invoice,
    });
  } catch (error) {
    console.error("[Invoices] Error loading invoice detail:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
});

// Settings
router.get("/settings", SettingsController.getSettings);
router.get("/account-settings", SettingsController.getAccountSettings);
router.get("/notification-preferences", SettingsController.getNotificationPreferences);
router.get("/system-status", SystemStatusController.getSystemStatusPage);
router.get("/maintenance", SystemStatusController.getMaintenancePage);
router.get("/change-password", SettingsController.getChangePassword);
router.post("/change-password", SettingsController.changePassword);
router.post("/settings/personal-info", SettingsController.updatePersonalInfo);
router.post("/settings/change-password", SettingsController.changePassword);
router.post("/settings/profile-picture", upload.single("profilePicture"), SettingsController.updateProfilePicture);
router.post("/settings/notifications", SettingsController.updateNotificationPreferences);
router.post("/settings/deactivate", SettingsController.deactivateAccount);

// Services
router.get("/register-zenopay", ZenoPayController.getRegisterZenoPay);
router.post(
  "/register-zenopay",
  (req, res, next) => {
    upload.single("ImagePath")(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Profile photo exceeds maximum size of 5 MB.",
            fieldErrors: {
              ImagePath: "File must be under 5 MB.",
            },
          });
        }

        return res.status(400).json({
          success: false,
          message: "Unable to process uploaded profile photo.",
          fieldErrors: {
            ImagePath: err.message || "Invalid profile photo upload.",
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || "Invalid profile photo upload.",
        fieldErrors: {
          ImagePath: err.message || "Only JPG, PNG, or WebP files are allowed.",
        },
      });
    });
  },
  ZenoPayController.postRegisterZenoPay
);
router.post("/verify-zenopayId", ZenoPayController.VerifyZenoPayId);

// Banking
router.get("/open-account", BankController.getOpenAccount);
router.post("/open-account", BankController.postOpenAccount);
router.get("/register-bank", BranchController.getBankBranches);
router.post("/register-bank", BranchController.postBankBranch);
router.get("/banks", BranchController.getAllBanks);
router.get("/banks-list", BranchController.getAllBanks);

// Transfer
router.get("/send-to", TransferController.getTransferMoney);
router.get("/send-money", TransferController.getTransferMoney);
router.post("/send-to", requirePin, checkTransactionLimit, TransferController.postTransferMoney);
router.post("/send-money", requirePin, checkTransactionLimit, TransferController.postTransferMoney);
router.post("/send-to/verify-receiver", TransferController.verifyReceiver);
router.get("/daily-transaction-summary", TransferController.getDailyTransactionSummary);

// Notifications
router.get("/notifications", NotificationController.getNotifications);
router.get("/notifications/mark-all-read", NotificationController.markAllAsRead);
router.get("/notifications/delete-read", NotificationController.deleteReadNotifications);

// Transaction History
router.get("/Transaction-History", TransactionInfoController.getTransactionHistory);
router.get("/transaction-history", TransactionInfoController.getTransactionHistory);
router.get("/Transaction-History/data", TransactionInfoController.getTransactionHistoryData);
router.get("/transaction-history/data", TransactionInfoController.getTransactionHistoryData);
router.get("/transaction/:transactionId", TransactionInfoController.getTransactionDetails);

// Support Center Routes
router.get("/support", SupportController.getSupportCenter);
router.get("/support/search", SupportController.searchHelpArticles);
router.get("/support/category/:categoryId", SupportController.getCategoryArticles);
router.post("/support/chat/initiate", SupportController.initiateLiveChat);

// Report Issue Routes
router.get("/report-issue", ReportIssueController.getReportIssuePage);
router.post("/report-issue", ReportIssueController.submitIssue);
router.post("/report-issue/check-similar", ReportIssueController.checkSimilarIssues);
router.post("/report-issue/save-draft", ReportIssueController.saveDraft);

// Dispute Management Routes
router.get("/disputes", DisputeController.getDisputesPage);
router.get("/disputes/:disputeId", DisputeController.getDisputeDetail);
router.post("/disputes/submit", DisputeController.submitDispute);
router.post("/disputes/:disputeId/add-info", DisputeController.addDisputeInformation);
router.post("/disputes/:disputeId/withdraw", DisputeController.withdrawDispute);

// Statements / Receipts pages
router.get("/statements", StatementsController.getStatementsPage);
router.get("/receipts", ReceiptsController.getReceiptsPage);
router.get("/verify-receipt/:receipt_number", ReceiptsController.verifyReceipt);
router.get("/receipt/verify", ReceiptsController.getReceiptVerificationPage);

// Referral pages
router.get("/referral", ReferralController.getReferralPage);
router.get("/referral-program", ReferralController.getReferralPage);
router.get("/ref/:code", ReferralController.handleReferralLink);

// Legal pages
router.get("/terms", LegalPagesController.getTermsPage);
router.get("/privacy", LegalPagesController.getPrivacyPage);
router.get("/about", LegalPagesController.getAboutPage);
router.get("/help", LegalPagesController.getHelpPage);
router.get("/faq", LegalPagesController.getHelpPage); // Alias for /help
router.get("/api-integration", LegalPagesController.getAPIIntegrationPage);
router.get("/api-docs", LegalPagesController.getAPIDocsPage);

// Pricing page
router.get("/pricing", PricingController.getPricingPage);

// Contact page
router.get("/contact", ContactController.getContactPage);

// KYC Verification Routes (PAN + Aadhaar) - canonical routes
router.get(KYC_ROUTES.STATUS_PAGE, KYCController.getKYCStatus);
router.get(KYC_ROUTES.STATUS_JSON, KYCController.getKYCStatusJson);
router.get(KYC_ROUTES.SUBMIT_PAGE, KYCController.getKYCForm);
router.post(KYC_ROUTES.SUBMIT_POST, kycUpload, KYCController.submitKYC);

// KYC compatibility aliases (legacy paths)
router.get(KYC_ROUTES.LEGACY_STATUS_PAGE, (req, res) => res.redirect(KYC_ROUTES.STATUS_PAGE));
router.get(KYC_ROUTES.LEGACY_SUBMIT_PAGE, (req, res) => res.redirect(KYC_ROUTES.SUBMIT_PAGE));
router.post(KYC_ROUTES.LEGACY_SUBMIT_POST, kycUpload, KYCController.submitKYC);
router.get(KYC_ROUTES.LEGACY_VERIFICATION_PAGE, (req, res) => res.redirect(KYC_ROUTES.SUBMIT_PAGE));
router.get(KYC_ROUTES.LEGACY_STATUS_ALIAS, (req, res) => res.redirect(KYC_ROUTES.STATUS_PAGE));

module.exports = router;
