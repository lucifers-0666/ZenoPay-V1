const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const ZenoPayController = require("../Controllers/ZenoPayController");
const BankController = require("../Controllers/BankAccountController");
const BranchController = require("../Controllers/BankController");
const TransferController = require("../Controllers/TransferMoney");
const ProfileController = require("../Controllers/Profile");
const ShopController = require("../Controllers/Shop");
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

router.get("/profile", ProfileController.getProfile);

// Shop page
router.get("/shop", ShopController.getShop);

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

router.get("/payment/success", (req, res) => {
  const amount = Number(req.query.amount || 5000);
  const fee = Number(req.query.fee || 14.75);
  const paidTo = req.query.to || "Priya Mehta";
  const now = new Date();

  const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const tx = {
    id: req.query.txId || `ZP-${now.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    paidTo,
    toAccountMasked: req.query.toAccount || "XXXX XXXX 8934",
    paymentMethod: req.query.method || "UPI Transfer",
    dateTimeFormatted: now.toLocaleString("en-IN", {
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

router.get("/payment/failed", (req, res) => {
  const amount = Number(req.query.amount || 5000);
  const now = new Date();

  const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const tx = {
    id: req.query.attemptId || `ZP-FAIL-${now.getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    intendedFor: req.query.to || "Priya Mehta",
    method: req.query.method || "UPI Transfer",
    attemptedAt: now.toLocaleString("en-IN", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", " -"),
    amount: formatINR(amount),
    errorCode: req.query.errorCode || "INSUFFICIENT_FUNDS",
    failureReason: req.query.reason || "Your bank declined this transaction. This usually happens due to insufficient balance, incorrect PIN, or bank security restrictions.",
  };

  return res.render("payment-failed", {
    pageTitle: "Payment Failed - ZenoPay",
    isLoggedIn: true,
    user: req.session.user || null,
    tx,
  });
});

router.get("/payment/pending", (req, res) => {
  const amount = Number(req.query.amount || 5000);
  const now = new Date();

  const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const tx = {
    id: req.query.txId || `ZP-${now.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    sendingTo: req.query.to || "Priya Mehta",
    method: req.query.method || "NEFT Transfer",
    submittedAt: now.toLocaleString("en-IN", {
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

router.get("/security-settings", (req, res) => {
  const score = Math.max(0, Math.min(100, Number(req.query.score || 85)));
  const twoFAEnabled = String(req.query.twoFA || "true") === "true";

  const security = {
    score,
    twoFAEnabled,
    levelTitle: score >= 80 ? "Good Security Level" : score >= 60 ? "Moderate Security Level" : "Security Needs Attention",
    subtitle: score >= 100 ? "Excellent! Your account is fully secured." : "Enable 2FA to reach 100% protection",
    methods: [
      {
        id: "authenticator",
        iconClass: "auth",
        icon: "fa-clock",
        title: "Authenticator App",
        description: "Google Authenticator / Authy",
        active: true,
      },
      {
        id: "sms",
        iconClass: "sms",
        icon: "fa-sms",
        title: "SMS OTP",
        description: "Sent to +91 98765 XXXXX",
        active: false,
      },
      {
        id: "email",
        iconClass: "email",
        icon: "fa-envelope",
        title: "Email OTP",
        description: "Sent to user@example.com",
        active: false,
      },
    ],
  };

  const sessions = [
    {
      deviceType: "desktop",
      icon: "fa-desktop",
      deviceName: "Windows PC • Chrome 132",
      location: "Mumbai, IN",
      ip: "122.161.45.90",
      browser: "Chrome",
      lastActive: "Just now",
      current: true,
    },
    {
      deviceType: "mobile",
      icon: "fa-mobile-alt",
      deviceName: "iPhone 15 Pro • Safari",
      location: "Pune, IN",
      ip: "117.221.88.41",
      browser: "Safari",
      lastActive: "13 minutes ago",
      current: false,
    },
    {
      deviceType: "tablet",
      icon: "fa-tablet-alt",
      deviceName: "iPad Air • ZenoPay App",
      location: "Bengaluru, IN",
      ip: "106.76.22.17",
      browser: "In-app browser",
      lastActive: "2 hours ago",
      current: false,
    },
  ];

  const loginHistory = [
    { status: "success", statusLabel: "Success", dateTime: "Feb 25, 2026 • 09:12 AM", device: "Chrome on Windows", location: "Mumbai, IN", ip: "122.161.45.90" },
    { status: "failed", statusLabel: "Failed", dateTime: "Feb 24, 2026 • 11:44 PM", device: "Unknown Android", location: "Delhi, IN", ip: "49.36.91.22" },
    { status: "blocked", statusLabel: "Blocked", dateTime: "Feb 24, 2026 • 11:45 PM", device: "Unknown Android", location: "Delhi, IN", ip: "49.36.91.22" },
    { status: "success", statusLabel: "Success", dateTime: "Feb 24, 2026 • 06:31 PM", device: "Safari on iPhone", location: "Pune, IN", ip: "117.221.88.41" },
  ];

  const preferences = [
    { icon: "fa-bell", title: "Login Notifications", description: "Get notified whenever a new login is detected.", enabled: true },
    { icon: "fa-lock", title: "Auto-Lock after 15 minutes", description: "Automatically lock the app after inactivity.", enabled: true },
    { icon: "fa-eye-slash", title: "Hide Balance by default", description: "Mask account balances until manually revealed.", enabled: false },
    { icon: "fa-envelope", title: "Email on every withdrawal", description: "Receive an email for each withdrawal transaction.", enabled: true },
    { icon: "fa-exclamation-triangle", title: "Suspicious Activity Alerts", description: "Get instant alerts for unusual account activity.", enabled: true },
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

router.get("/add-money", WalletController.getAddMoneyPage);
router.get("/withdraw", WalletController.getWithdrawPage);

router.get("/scheduled-payments", (req, res) => {
  const payments = [];
  const beneficiaries = [];

  return res.render("scheduled-payments", {
    pageTitle: "Scheduled Payments - ZenoPay",
    isLoggedIn: true,
    user: req.session.user || null,
    payments,
    beneficiaries,
  });
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
router.post("/register-zenopay", upload.single("ImagePath"), ZenoPayController.postRegisterZenoPay);
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
router.get("/daily-transaction-summary", TransferController.getDailyTransactionSummary);

// Notifications
router.get("/notifications", NotificationController.getNotifications);
router.get("/notifications/mark-all-read", NotificationController.markAllAsRead);
router.get("/notifications/delete-read", NotificationController.deleteReadNotifications);

// Transaction History
router.get("/Transaction-History", TransactionInfoController.getTransactionHistory);
router.get("/transaction-history", TransactionInfoController.getTransactionHistory);
router.get("/transaction/:transactionId", TransactionInfoController.getTransactionDetails);

// KYC Verification
router.get("/kyc", KYCController.getKYCVerification);
router.get("/kyc-verification", KYCController.getKYCVerification);
router.get("/verification-status", KYCController.getVerificationStatusPage);
router.post("/kyc/submit", KYCController.submitKYCDocuments);
router.get("/kyc/status", KYCController.getKYCStatus);

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

module.exports = router;
