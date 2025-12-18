const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Controllers
const ZenoPayController = require("../Controllers/ZenoPay");
const BankController = require("../Controllers/BankAccount");
const BranchController = require("../Controllers/BankController");
const LoginController = require("../Controllers/login");
const TransferController = require("../Controllers/TransferMoney");
const ProfileController = require("../Controllers/Profile");
const DashboardController = require("../Controllers/Dashboard");
const MerchantController = require("../Controllers/MerchantController");
const GatewayController = require("../Controllers/PayGateway");
const ShopController = require("../Controllers/Shop");
const NotificationController = require("../Controllers/Notifications");

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
router.get("/login", LoginController.getLogin);
router.post("/login", LoginController.postLogin);
router.get("/logout", LoginController.logout);
router.get("/profile", ProfileController.getProfile);
router.get("/shop", ShopController.getShop);

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
module.exports = router;
