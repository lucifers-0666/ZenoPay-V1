const express = require("express");
const WalletController = require("../Controllers/WalletController");
const requirePin = require("../Middleware/requirePin");
const checkTransactionLimit = require("../Middleware/checkTransactionLimit");

const router = express.Router();

router.get("/balance", WalletController.getBalance);
router.get("/topup", WalletController.getTopUp);
router.post("/topup", WalletController.processTopUp);
router.get("/send", WalletController.getSend);
router.post("/send", requirePin, checkTransactionLimit, WalletController.processSend);
router.get("/search-user", WalletController.searchUser);
router.get("/transactions", WalletController.getTransactions);

module.exports = router;
