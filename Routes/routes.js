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
router.get("/reset-password/:token", LoginController.getResetPassword);
router.post("/reset-password", LoginController.postResetPassword);

router.get("/profile", ProfileController.getProfile);
router.get("/shop", ShopController.getShop);
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
router.get("/api-integration", MerchantController.getApiKeyPage);
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
router.post("/send-to", TransferController.postTransferMoney);
router.post("/verify-receiver", TransferController.verifyReceiver);
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
router.get("/statements/:month/:year", StatementsController.getStatementDetail);
router.get("/statements/:month/:year/download-pdf", StatementsController.downloadStatementPDF);
router.get("/statements/:month/:year/download-csv", StatementsController.downloadStatementCSV);
router.post("/statements/:month/:year/email", StatementsController.emailStatement);

// Payment Receipts Routes
router.get("/receipts", ReceiptsController.getReceiptsPage);
router.get("/receipts/:receiptId", ReceiptsController.getReceiptDetail);
router.get("/receipts/:receiptId/download", ReceiptsController.downloadReceiptPDF);
router.post("/receipts/:receiptId/email", ReceiptsController.emailReceipt);
router.post("/receipts/download-bulk", ReceiptsController.downloadBulkReceipts);

// Referral Program Routes
router.get("/referral", ReferralController.getReferralPage);
router.post("/referral/share", ReferralController.shareReferral);
router.post("/referral/redeem", ReferralController.redeemRewards);
router.get("/ref/:referralCode", ReferralController.trackReferralClick);

module.exports = router;
