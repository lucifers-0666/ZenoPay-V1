const express = require("express");
const router = express.Router();

// Middleware
const { isAdmin, isAdminLoggedIn } = require("../Middleware/adminAuth");

// Controllers
const AdminAuthController = require("../Controllers/AdminAuthController");
const AdminDashboardController = require("../Controllers/AdminDashboardController");
const AdminMerchantController = require("../Controllers/AdminMerchantController");
const AdminBankController = require("../Controllers/AdminBankController");
const AdminTransactionController = require("../Controllers/AdminTransactionController");
const AdminPaymentGatewayController = require("../Controllers/AdminPaymentGatewayController");

// ============ AUTHENTICATION ROUTES ============
// TEMPORARILY DISABLED - All routes accessible without authentication
router.get("/login", AdminAuthController.getLogin);
router.post("/login", AdminAuthController.postLogin);
router.get("/logout", AdminAuthController.logout);

// Password Reset Routes
router.get("/forgot-password", AdminAuthController.getForgotPassword);
router.post("/forgot-password", AdminAuthController.postForgotPassword);
// Graceful fallback when token is missing to show the error state instead of a 404
router.get("/reset-password", (req, res) => {
	return res.status(400).render("auth/reset-password", {
		pageTitle: "Reset Password - ZenoPay Admin",
		error: "Reset link is missing. Please request a new link.",
		token: null,
		validToken: false,
	});
});
router.get("/reset-password/:token", AdminAuthController.getResetPassword);
router.post("/reset-password/:token", AdminAuthController.postResetPassword);

// 2FA Routes
router.get("/2fa/setup", AdminAuthController.get2FASetup);
router.post("/2fa/generate", AdminAuthController.generate2FA);
router.post("/2fa/verify", AdminAuthController.verify2FA);



// ============ DASHBOARD ROUTES ============
router.get("/dashboard", AdminDashboardController.getDashboard);
router.get("/dashboard/statistics", AdminDashboardController.getStatistics);
router.get("/dashboard/activity-monitor", AdminDashboardController.getActivityMonitor);

// ============ MERCHANT MANAGEMENT ROUTES ============
router.get("/merchants", AdminMerchantController.getAllMerchants);
router.get("/merchants/pending", AdminMerchantController.getPendingMerchants);
router.get("/merchants/:id", AdminMerchantController.getMerchantDetails);
router.post("/merchants/:id/approve", AdminMerchantController.approveMerchant);
router.post("/merchants/:id/reject", AdminMerchantController.rejectMerchant);
router.post("/merchants/:id/suspend", AdminMerchantController.suspendMerchant);
router.post("/merchants/:id/revoke-keys", AdminMerchantController.revokeApiKeys);

// ============ BANK MANAGEMENT ROUTES ============
router.get("/banks", AdminBankController.getAllBanks);
router.get("/banks/pending", AdminBankController.getPendingBanks);
router.get("/banks/:id", AdminBankController.getBankDetails);
router.post("/banks/:id/approve", AdminBankController.approveBank);
router.post("/banks/:id/reject", AdminBankController.rejectBank);
router.put("/banks/:id", AdminBankController.updateBank);
router.delete("/banks/:id", AdminBankController.deleteBank);

// ============ TRANSACTION MANAGEMENT ROUTES ============
router.get("/transactions", AdminTransactionController.getAllTransactions);
router.get("/transactions/flagged", AdminTransactionController.getFlaggedTransactions);
router.get("/transactions/failed", AdminTransactionController.getFailedTransactions);
router.get("/transactions/:id", AdminTransactionController.getTransactionDetails);
router.post("/transactions/:id/flag", AdminTransactionController.flagTransaction);

// ============ ANALYTICS & REPORTS ROUTES ============
router.get("/analytics", AdminDashboardController.getAnalytics);
router.get("/reports", AdminDashboardController.getReports);
router.get("/reports/export", AdminDashboardController.exportReports);

// ============ SETTINGS ROUTES ============
router.get("/settings", AdminDashboardController.getSettings);
router.post("/settings", AdminDashboardController.updateSettings);

// ============ PAYMENT GATEWAY ROUTES ============
router.get("/settings/payment-gateway", AdminPaymentGatewayController.getPaymentGatewaySettings);
router.post("/settings/payment-gateway/test", AdminPaymentGatewayController.testGatewayConnection);
router.post("/settings/payment-gateway/save", AdminPaymentGatewayController.savePaymentGatewayConfig);
router.post("/settings/payment-gateway/fees", AdminPaymentGatewayController.updateTransactionFees);
router.post("/settings/payment-gateway/toggle-method", AdminPaymentGatewayController.togglePaymentMethod);
router.post("/settings/payment-gateway/advanced", AdminPaymentGatewayController.updateAdvancedSettings);
router.get("/settings/payment-gateway/config", AdminPaymentGatewayController.getPaymentGatewayConfig);

module.exports = router;
