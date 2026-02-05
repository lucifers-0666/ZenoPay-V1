const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Controllers
const ZenoPayController = require("../Controllers/ZenoPayController");
const BankController = require("../Controllers/BankAccountController");
const BranchController = require("../Controllers/BankController");
const LoginController = require("../Controllers/AuthController");
const TransferController = require("../Controllers/TransferMoney");
const ProfileController = require("../Controllers/Profile");
const DashboardController = require("../Controllers/DashboardController");
const MerchantController = require("../Controllers/MerchantController");
const GatewayController = require("../Controllers/PaymentGatewayController");
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
const EmailVerificationController = require("../Controllers/EmailVerificationController");
const LegalPagesController = require("../Controllers/LegalPagesController");
const ContactController = require("../Controllers/ContactController");

const TransactionInfoController = require("../Controllers/TransactionHistory");

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
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  }
});

// --- ROUTES ---

// Auth & Dashboard
router.get("/", DashboardController.getDashboard);
router.get("/register", LoginController.getRegister);
router.post("/register", LoginController.postRegister);
router.get("/signup", LoginController.getRegister);
router.post("/signup", LoginController.postRegister);
router.get("/login", LoginController.getLogin);
router.post("/login", LoginController.postLogin);
router.get("/logout", LoginController.logout);

// Password Reset
router.get("/forgot-password", LoginController.getForgotPassword);
router.post("/forgot-password", LoginController.postForgotPassword);
router.post("/forgot-password/resend", LoginController.postResendResetLink);
// Fallback when no token is provided so users see the error state instead of a 404
router.get("/reset-password", (req, res) => {
  return res.status(400).render("reset-password", {
    pageTitle: "Reset Password - ZenoPay",
    isLoggedIn: false,
    user: null,
    tokenValid: false,
    message: "Reset link is missing. Please use the link sent to your email or request a new one.",
  });
});
router.get("/reset-password/:token", LoginController.getResetPassword);
router.post("/reset-password", LoginController.postResetPassword);

// Email Verification
router.get("/verify-email/:token", EmailVerificationController.getVerifyEmail);
router.post("/api/auth/resend-verification", EmailVerificationController.resendVerificationEmail);
router.get("/api/auth/verification-status", EmailVerificationController.checkVerificationStatus);

// Design Preview Routes (for testing UI)
router.get("/verify-email-preview/:state", (req, res) => {
  const { state } = req.params;
  const validStates = ['success', 'error', 'expired', 'loading'];
  
  if (!validStates.includes(state)) {
    return res.redirect('/verify-email-preview/success');
  }
  
  res.render('verify-email', {
    status: state,
    message: state === 'error' ? 'This is a preview of the error state.' : null,
    email: 'user@example.com',
    pageTitle: `Email Verification ${state.charAt(0).toUpperCase() + state.slice(1)} - ZenoPay`
  });
});

router.get("/profile", ProfileController.getProfile);

// Shop Routes
router.get("/shop", ShopController.getShop);
router.get("/api/shop/products", ShopController.getProducts);
router.get("/api/shop/products/:id", ShopController.getProductById);
router.get("/api/shop/categories", ShopController.getCategories);

// Cart Routes
router.get("/api/cart", ShopController.getCart);
router.post("/api/cart/add", ShopController.addToCart);
router.put("/api/cart/update/:id", ShopController.updateCartItem);
router.delete("/api/cart/remove/:id", ShopController.removeFromCart);

// Checkout & Orders
router.post("/api/checkout", ShopController.processCheckout);
router.get("/api/orders", ShopController.getUserOrders);
router.get("/api/orders/:id", ShopController.getOrderById);
router.post("/api/orders/:id/cancel", ShopController.cancelOrder);

router.get("/request-money", RequestMoneyController.getRequestMoneyPage);
router.post("/request-money", RequestMoneyController.createRequestMoney);
router.get("/qr-payment", QRPaymentController.getQRPaymentPage);
router.post("/qr-payment/generate", QRPaymentController.generateDynamicQR);
router.get("/payment-methods", PaymentMethodsController.getPaymentMethodsPage);
router.post("/payment-methods/set-default", PaymentMethodsController.setDefaultPaymentMethod);
router.post("/payment-methods/remove", PaymentMethodsController.removePaymentMethod);
router.post("/payment-methods/disconnect-wallet", PaymentMethodsController.disconnectWallet);
router.get("/add-card", AddCardController.getAddCardPage);
router.post("/add-card", AddCardController.addCard);

// Settings
router.get("/settings", SettingsController.getSettings);
router.get("/account-settings", SettingsController.getAccountSettings);
router.get("/change-password", SettingsController.getChangePassword);
router.post("/change-password", SettingsController.changePassword);
router.post("/settings/personal-info", SettingsController.updatePersonalInfo);
router.post("/settings/change-password", SettingsController.changePassword);
router.post("/settings/profile-picture", upload.single("profilePicture"), SettingsController.updateProfilePicture);
router.post("/settings/notifications", SettingsController.updateNotificationPreferences);
router.post("/settings/deactivate", SettingsController.deactivateAccount);

// Merchant
router.post("/api/merchant/register", MerchantController.registerMerchant);
router.post("/api/merchant/regenerate-keys", MerchantController.regenerateApiKeys);
router.post("/api/merchant/settings", MerchantController.updateMerchantSettings);
router.get("/api/merchant/stats", MerchantController.getMerchantStats);

// Services
router.get("/register-zenopay", ZenoPayController.getRegisterZenoPay);
router.post(
  "/register-zenopay",
  upload.single("ImagePath"),
  ZenoPayController.postRegisterZenoPay
);
router.post("/verify-zenopayId", ZenoPayController.VerifyZenoPayId);

// Banking
router.get("/open-account", BankController.getOpenAccount);
router.post("/open-account", BankController.postOpenAccount);
router.get("/register-bank", BranchController.getBankBranches);
router.post("/register-bank", BranchController.postBankBranch);
router.get("/banks", BranchController.getAllBanks);
router.get("/api/banks", async (req, res) => {
  try {
    const BankBranch = require("../Models/Banks");
    const banks = await BankBranch.find().select(
      "BankName BankId City State BankEmail"
    );
    res.json(banks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

// Transfer
router.get("/send-to", TransferController.getTransferMoney);
router.post("/api/send-money", TransferController.postTransferMoney);
router.post("/api/verify-receiver", TransferController.verifyReceiver);
router.get("/api/today-stats", TransferController.getDailyTransactionSummary);
router.get(
  "/daily-transaction-summary",
  TransferController.getDailyTransactionSummary
);

// Notifications
router.get("/notifications", NotificationController.getNotifications);
router.get(
  "/api/notifications/count",
  NotificationController.getNotificationCount
);
router.get(
  "/api/notifications/recent",
  NotificationController.getRecentNotifications
);
router.post("/api/notifications/mark-all-read", NotificationController.markAsRead);
router.get(
  "/notifications/mark-all-read",
  NotificationController.markAllAsRead
);
router.get(
  "/notifications/delete-read",
  NotificationController.deleteReadNotifications
);

// Transaction History
router.get("/Transaction-History", TransactionInfoController.getTransactionHistory);

// KYC Verification
router.get("/kyc", KYCController.getKYCVerification);
router.get("/verification-status", KYCController.getVerificationStatusPage);
router.post("/kyc/submit", KYCController.submitKYCDocuments);
router.get("/kyc/status", KYCController.getKYCStatus);

// Admin KYC Management
router.post("/admin/kyc/approve", KYCController.approveKYC);
router.post("/admin/kyc/reject", KYCController.rejectKYC);
router.get("/admin/kyc/:zenoPayId/documents", KYCController.getKYCDocuments);

// Payment Gateway API (for merchant integrations)
router.post("/api/orders", GatewayController.verifyMerchant, GatewayController.createOrder);
router.post("/api/payments/verify", GatewayController.verifyMerchant, GatewayController.verifyPayment);

// Original ZenoPay APIs
router.post("/api/payment/initiate", GatewayController.verifyMerchant, GatewayController.initiatePayment);
router.post("/api/payment/process", GatewayController.verifyMerchant, GatewayController.processPayment);
router.post("/api/payment/verify-customer", GatewayController.verifyCustomer);
router.post("/api/payment/send-otp", GatewayController.sendPaymentOTP);
router.get("/api/payment/status", GatewayController.getPaymentStatus);
router.get("/api/payment/sdk-config", GatewayController.getSDKConfig);
router.post("/api/payment/refund", GatewayController.verifyMerchant, GatewayController.processRefund);

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

// Monthly Statements Routes
router.get("/statements", StatementsController.getStatementsPage);

// API Routes for Statements
router.get("/api/statements", StatementsController.getStatements);
router.get("/api/statements/:id", StatementsController.getStatementDetail);
router.post("/api/statements/generate", StatementsController.generateStatement);
router.get("/api/statements/:id/download", StatementsController.downloadStatementPDF);
router.get("/api/statements/:id/transactions", StatementsController.getStatementTransactions);
router.post("/api/statements/:id/email", StatementsController.emailStatement);

// Payment Receipts Routes
router.get("/receipts", ReceiptsController.getReceiptsPage);

// API Routes for Receipts
router.get("/api/receipts", ReceiptsController.getReceipts);
router.get("/api/receipts/search", ReceiptsController.searchReceipts);
router.get("/api/receipts/:id", ReceiptsController.getReceiptDetail);
router.get("/api/receipts/transaction/:transaction_id", ReceiptsController.getReceiptByTransaction);
router.post("/api/receipts/:id/download", ReceiptsController.downloadReceiptPDF);
router.post("/api/receipts/:id/email", ReceiptsController.emailReceipt);
router.post("/api/receipts/bulk-download", ReceiptsController.downloadBulkReceipts);

// Public receipt verification
router.get("/verify-receipt/:receipt_number", ReceiptsController.verifyReceipt);

// Referral Program Routes
router.get("/referral", ReferralController.getReferralPage);

// API Routes for Referral Program
router.get("/api/referral/code", ReferralController.getReferralCode);
router.post("/api/referral/generate-code", ReferralController.generateCustomCode);
router.get("/api/referral/stats", ReferralController.getReferralStats);
router.get("/api/referral/list", ReferralController.getReferralList);
router.get("/api/referral/rewards", ReferralController.getRewardsHistory);
router.post("/api/referral/track/:code", ReferralController.trackReferralClick);
router.get("/api/referral/leaderboard", ReferralController.getLeaderboard);

// Public referral link handler
router.get("/ref/:code", ReferralController.handleReferralLink);

// Legal Pages Routes
router.get("/terms", LegalPagesController.getTermsPage);
router.get("/privacy", LegalPagesController.getPrivacyPage);
router.get("/about", LegalPagesController.getAboutPage);
router.get("/help", LegalPagesController.getHelpPage);
router.get("/faq", LegalPagesController.getHelpPage); // Alias for /help
router.get("/api/legal/terms-version", LegalPagesController.getTermsVersion);
router.post("/api/legal/accept-terms", LegalPagesController.acceptTerms);

// Contact Routes
router.get("/contact", ContactController.getContactPage);
router.post("/api/contact/submit", ContactController.upload.array('attachments', 3), ContactController.submitContactForm);

// API Integration Page
router.get("/api-integration", LegalPagesController.getAPIIntegrationPage);

// Admin Contact Management Routes
router.get("/api/admin/contact/submissions", ContactController.getAllSubmissions);
router.get("/api/admin/contact/submissions/:id", ContactController.getSubmissionById);
router.put("/api/admin/contact/submissions/:id/status", ContactController.updateSubmissionStatus);
router.post("/api/admin/contact/submissions/:id/reply", ContactController.replyToSubmission);

module.exports = router;
