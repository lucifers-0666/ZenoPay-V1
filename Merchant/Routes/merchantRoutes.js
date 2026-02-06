const express = require("express");
const router = express.Router();
const MerchantController = require("../Controllers/MerchantController");
const { isMerchant } = require("../../Admin/Middleware/rbacMiddleware");

// All merchant routes require merchant role
router.use(isMerchant);

// ============ DASHBOARD ROUTES ============
router.get("/dashboard", MerchantController.getDashboard);
router.get("/dashboard/stats", MerchantController.getDashboardStats);
router.get("/dashboard/charts", MerchantController.getChartData);

// ============ TRANSACTIONS ROUTES ============
router.get("/transactions", MerchantController.getTransactions);
router.get("/transactions/:id", MerchantController.getTransactionDetails);
router.post("/transactions/:id/refund", MerchantController.refundTransaction);

// ============ SALES & REVENUE ROUTES ============
router.get("/sales", MerchantController.getSalesReport);
router.get("/sales/analytics", MerchantController.getSalesAnalytics);
router.post("/sales/export", MerchantController.exportSalesReport);

// ============ CUSTOMERS ROUTES ============
router.get("/customers", MerchantController.getCustomers);
router.get("/customers/:id", MerchantController.getCustomerDetails);
router.post("/customers/:id/block", MerchantController.blockCustomer);
router.post("/customers/:id/unblock", MerchantController.unblockCustomer);

// ============ PRODUCTS ROUTES ============
router.get("/products", MerchantController.getProducts);
router.post("/products", MerchantController.createProduct);
router.get("/products/:id", MerchantController.getProductDetails);
router.put("/products/:id", MerchantController.updateProduct);
router.delete("/products/:id", MerchantController.deleteProduct);

// ============ ORDERS ROUTES ============
router.get("/orders", MerchantController.getOrders);
router.get("/orders/:id", MerchantController.getOrderDetails);
router.post("/orders/:id/status", MerchantController.updateOrderStatus);
router.post("/orders/:id/refund", MerchantController.refundOrder);

// ============ DISPUTES ROUTES ============
router.get("/disputes", MerchantController.getDisputes);
router.get("/disputes/:id", MerchantController.getDisputeDetails);
router.post("/disputes/:id/respond", MerchantController.respondToDispute);
router.post("/disputes/:id/appeal", MerchantController.appealDispute);

// ============ PAYOUTS ROUTES ============
router.get("/payouts", MerchantController.getPayouts);
router.post("/payouts/request", MerchantController.requestPayout);
router.get("/payouts/:id", MerchantController.getPayoutDetails);

// ============ API KEYS ROUTES ============
router.get("/api-keys", MerchantController.getAPIKeys);
router.post("/api-keys/generate", MerchantController.generateAPIKey);
router.post("/api-keys/:id/revoke", MerchantController.revokeAPIKey);
router.post("/api-keys/:id/regenerate", MerchantController.regenerateAPIKey);

// ============ SETTINGS ROUTES ============
router.get("/settings", MerchantController.getSettings);
router.post("/settings", MerchantController.updateSettings);
router.post("/settings/bank", MerchantController.updateBankDetails);
router.post("/settings/commission", MerchantController.updateCommissionSettings);
router.post("/settings/notification", MerchantController.updateNotificationSettings);

// ============ REPORTS ROUTES ============
router.get("/reports", MerchantController.getReports);
router.post("/reports/generate", MerchantController.generateReport);
router.post("/reports/export", MerchantController.exportReport);

// ============ WEBHOOK ROUTES ============
router.get("/webhooks", MerchantController.getWebhooks);
router.post("/webhooks", MerchantController.createWebhook);
router.post("/webhooks/:id/test", MerchantController.testWebhook);
router.delete("/webhooks/:id", MerchantController.deleteWebhook);

module.exports = router;
