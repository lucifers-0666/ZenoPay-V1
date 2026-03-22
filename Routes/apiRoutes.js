const express = require("express");
const router = express.Router();

const ShopController = require("../Controllers/Shop");
const TransferController = require("../Controllers/TransferMoney");
const NotificationController = require("../Controllers/Notifications");
const GatewayController = require("../Controllers/PaymentGatewayController");
const StatementsController = require("../Controllers/StatementsController");
const ReceiptsController = require("../Controllers/ReceiptsController");
const ReferralController = require("../Controllers/ReferralController");
const PricingController = require("../Controllers/PricingController");
const ContactController = require("../Controllers/ContactController");
const Invoice = require("../Models/Invoice");

// Shop API
router.get("/api/shop/products", ShopController.getProducts);
router.get("/api/shop/products/:id", ShopController.getProductById);
router.get("/api/shop/categories", ShopController.getCategories);

// Cart API
router.get("/api/cart", ShopController.getCart);
router.post("/api/cart/add", ShopController.addToCart);
router.put("/api/cart/update/:id", ShopController.updateCartItem);
router.delete("/api/cart/remove/:id", ShopController.removeFromCart);

// Checkout & orders API
router.post("/api/checkout", ShopController.processCheckout);
router.get("/api/orders", ShopController.getUserOrders);
router.get("/api/orders/:id", ShopController.getOrderById);
router.post("/api/orders/:id/cancel", ShopController.cancelOrder);

// Invoice API
router.post("/api/invoices", async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Please login to create invoices." });
    }

    const { client, amount, dueDate, status, notes } = req.body || {};
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
      issue_date: new Date(),
      due_date: parsedDueDate,
      amount: parsedAmount,
      status: normalizedStatus,
      notes: String(notes || "").trim(),
    });

    return res.json({
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

router.post("/api/invoices/:id/mark-paid", async (req, res) => {
  try {
    const userId = req.session?.user?.ZenoPayID;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Please login." });
    }

    const invoiceId = req.params.id;

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      user_id: userId,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    invoice.status = "paid";
    invoice.payment_info = {
      datePaid: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
      method: "Manual Entry",
      transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
    };

    await invoice.save();

    return res.json({ success: true, message: "Invoice marked as paid." });
  } catch (error) {
    console.error("[Invoices] Error marking invoice as paid:", error);
    return res.status(500).json({ success: false, message: "Unable to update invoice." });
  }
});

router.post("/api/maintenance/notify", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email is required." });
    }

    // TODO: Store email in database for notification list
    console.log(`[Maintenance] Notification requested: ${email}`);

    return res.json({ success: true, message: "Notification subscription confirmed." });
  } catch (error) {
    console.error("[Maintenance] Notify error:", error);
    return res.status(500).json({ success: false, message: "Unable to subscribe." });
  }
});

// Banking API
router.get("/api/banks", async (req, res) => {
  try {
    const BankBranch = require("../Models/Banks");
    const banks = await BankBranch.find().select("BankName BankId City State BankEmail");
    return res.json(banks);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch banks" });
  }
});

// Transfer API
router.post("/api/send-money", TransferController.postTransferMoney);
router.post("/api/verify-receiver", TransferController.verifyReceiver);
router.get("/api/today-stats", TransferController.getDailyTransactionSummary);

// Notifications API
router.get("/api/notifications/count", NotificationController.getNotificationCount);
router.get("/api/notifications/recent", NotificationController.getRecentNotifications);
router.post("/api/notifications/mark-all-read", NotificationController.markAsRead);

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

// Statements API
router.get("/api/statements", StatementsController.getStatements);
router.get("/api/statements/:id", StatementsController.getStatementDetail);
router.post("/api/statements/generate", StatementsController.generateStatement);
router.get("/api/statements/:id/download", StatementsController.downloadStatementPDF);
router.get("/api/statements/:id/transactions", StatementsController.getStatementTransactions);
router.post("/api/statements/:id/email", StatementsController.emailStatement);

// Receipts API
router.get("/api/receipts", ReceiptsController.getReceipts);
router.get("/api/receipts/search", ReceiptsController.searchReceipts);
router.get("/api/receipts/:id", ReceiptsController.getReceiptDetail);
router.get("/api/receipts/transaction/:transaction_id", ReceiptsController.getReceiptByTransaction);
router.post("/api/receipts/:id/download", ReceiptsController.downloadReceiptPDF);
router.post("/api/receipts/:id/email", ReceiptsController.emailReceipt);
router.post("/api/receipts/bulk-download", ReceiptsController.downloadBulkReceipts);
router.get("/api/receipt/verify/:receiptId", ReceiptsController.verifyReceiptApi);

// Referral API
router.get("/api/referral/code", ReferralController.getReferralCode);
router.post("/api/referral/generate-code", ReferralController.generateCustomCode);
router.get("/api/referral/stats", ReferralController.getReferralStats);
router.get("/api/referral/list", ReferralController.getReferralList);
router.get("/api/referral/rewards", ReferralController.getRewardsHistory);
router.post("/api/referral/track/:code", ReferralController.trackReferralClick);
router.get("/api/referral/leaderboard", ReferralController.getLeaderboard);

// Pricing API
router.get("/api/pricing", PricingController.getPricingData);
router.post("/api/pricing/calculate-quote", PricingController.calculateCustomQuote);
router.get("/api/pricing/compare", PricingController.comparePlans);

// Contact API
router.post("/api/contact/submit", ContactController.upload.array("attachments", 3), ContactController.submitContactForm);

module.exports = router;
