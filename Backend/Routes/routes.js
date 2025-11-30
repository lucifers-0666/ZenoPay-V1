const express = require("express");
const router = express.Router();
const AadharController = require("../Controllers/Aadhar");
const PanController = require("../Controllers/Pan");
const BankController = require("../Controllers/BankAccount");
const BranchController = require("../Controllers/BankBranch");
const LoginController = require("../Controllers/login");
const TransferController = require("../Controllers/TransferMoney");
const ProfileController = require("../Controllers/Profile");
const DashboardController = require("../Controllers/Dashboard");
const MerchantController = require("../Controllers/Merchant");
const GatewayController = require("../Controllers/Gateway");
const ShopController = require("../Controllers/Shop");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "public/Uploads";
    if (req.originalUrl.includes("register-aadhar"))
      folder = "public/AadharImages";
    else if (req.originalUrl.includes("register-pan"))
      folder = "public/PanImages";
    else if (req.originalUrl.includes("open-account"))
      folder = "public/AccountProfileImages";
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
router.get("/register-aadhar", AadharController.getRegisterAadhar);
router.post(
  "/register-aadhar",
  upload.single("userImage"),
  AadharController.postRegisterAadhar
);
router.post("/verify-aadhar", AadharController.VerifyAadharNumber);

router.get("/register-pan", PanController.getRegisterPan);
router.post(
  "/register-pan",
  upload.single("userImage"),
  PanController.postRegisterPan
);
router.post("/verify-pan", PanController.VerifyPanNumber);

router.get("/open-account", BankController.getOpenAccount);
router.post(
  "/open-account",
  upload.single("userImage"),
  BankController.postOpenAccount
);
router.post("/verify-ifsc", BankController.verifyIFSC);
// router.post("/open-account/send-otp", BankController.sendOTP);

router.get("/bank-branches", BranchController.getBankBranches);
router.post("/bank-branches", BranchController.postBankBranch);

router.get("/transfer", TransferController.getTransferMoney);
router.post("/transfer/verify-receiver", TransferController.verifyReceiver);
router.post("/transfer", TransferController.postTransferMoney);

module.exports = router;
