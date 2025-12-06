const express = require("express");
const router = express.Router();
const AadharController = require("../Controllers/ZenoPay");
const PanController = require("../Controllers/Pan");
const BankController = require("../Controllers/BankAccount");
const BranchController = require("../Controllers/BankController");
const LoginController = require("../Controllers/login");
const TransferController = require("../Controllers/TransferMoney");
const ProfileController = require("../Controllers/Profile");
const DashboardController = require("../Controllers/Dashboard");
const MerchantController = require("../Controllers/Merchant");
const GatewayController = require("../Controllers/Gateway");
const ShopController = require("../Controllers/Shop");
const NotificationController = require("../Controllers/Notifications");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "public/Uploads";
    if (req.originalUrl.includes("register-aadhar"))
      folder = "public/AadharImages";
    else if (req.originalUrl.includes("register-zenopay"))
      folder = "public/Uploads";
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  },
});
const upload = multer({ storage });

// --- ROUTES ---
router.get("/", DashboardController.getDashboard);
router.get("/login", LoginController.getLogin);
router.post("/login", LoginController.postLogin);
router.get("/logout", LoginController.logout);
router.get("/profile", ProfileController.getProfile);
router.get("/shop", ShopController.getShop);

// Merchant
router.get("/merchant/api-keys", MerchantController.getCreateApiKeyPage);
router.post("/merchant/generate-keys", MerchantController.generateKeys);

// Gateway
router.post("/gateway/create-order", GatewayController.createOrder);
router.post("/gateway/refund", GatewayController.processRefund); // NEW REFUND ROUTE
router.post("/gateway/send-otp", GatewayController.sendAadhaarOtp);
router.post("/gateway/verify-otp", GatewayController.verifyOtpAndFetchAccounts);
router.post("/pay/process", GatewayController.processPayment);
router.get("/pay", GatewayController.renderCheckout);

// Services
router.get("/register-zenopay", AadharController.getRegisterZenoPay);
router.post(
  "/register-zenopay",
  upload.single("ImagePath"),
  AadharController.postRegisterZenoPay
);
router.post("/verify-zenopayId", AadharController.VerifyZenoPayId);

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

router.get("/transfer", TransferController.getTransferMoney);
router.post("/transfer/verify-receiver", TransferController.verifyReceiver);
router.post("/transfer", TransferController.postTransferMoney);

// Notifications
router.get("/notifications", NotificationController.getNotifications);
module.exports = router;
