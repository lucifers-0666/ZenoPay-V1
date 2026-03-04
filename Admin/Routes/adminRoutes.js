const express = require("express");
const router = express.Router();

// Middleware
const { isAdmin, isAdminLoggedIn } = require("../Middleware/adminAuth");
const { requireRole, requirePermission } = require("../Middleware/rbacMiddleware");

// Controllers
const AdminAuthController = require("../Controllers/AdminAuthController");
const AdminDashboardController = require("../Controllers/AdminDashboardController");
const AdminMerchantController = require("../Controllers/AdminMerchantController");
const AdminBankController = require("../Controllers/AdminBankController");
const AdminTransactionController = require("../Controllers/AdminTransactionController");
const AdminPaymentGatewayController = require("../Controllers/AdminPaymentGatewayController");
const AdminUserController = require("../Controllers/AdminUserController");
const AdminPrivacyPolicyController = require("../Controllers/AdminPrivacyPolicyController");
const AdminKYCController = require("../Controllers/AdminKYCController");
const AdminOperationsController = require("../Controllers/AdminOperationsController");
const AdminWalletController = require("../Controllers/AdminWalletController");

// ============ LAYOUT MIDDLEWARE ============
// Default layout for all admin routes (auth routes override below)
router.use((req, res, next) => {
	res.locals.layout = "admin/layouts/admin-layout";
	next();
});

// Helper middleware that switches to the auth layout
const useAuthLayout = (req, res, next) => {
	res.locals.layout = "admin/layouts/auth-layout";
	next();
};

// ============ AUTHENTICATION ROUTES (Public) ============
router.get("/login", useAuthLayout, AdminAuthController.getLogin);
router.post("/login", useAuthLayout, AdminAuthController.postLogin);
router.get("/logout", AdminAuthController.logout);

// Password Reset Routes
router.get("/forgot-password", useAuthLayout, AdminAuthController.getForgotPassword);
router.post("/forgot-password", useAuthLayout, AdminAuthController.postForgotPassword);
// Graceful fallback when token is missing to show the error state instead of a 404
router.get("/reset-password", useAuthLayout, (req, res) => {
	return res.status(400).render("admin/auth/reset-password", {
		pageTitle: "Reset Password - ZenoPay Admin",
		error: "Reset link is missing. Please request a new link.",
		token: null,
		validToken: false,
	});
});
router.get("/reset-password/:token", useAuthLayout, AdminAuthController.getResetPassword);
router.post("/reset-password/:token", useAuthLayout, AdminAuthController.postResetPassword);

// 2FA Routes
router.get("/2fa/setup", useAuthLayout, AdminAuthController.get2FASetup);
router.post("/2fa/generate", useAuthLayout, AdminAuthController.generate2FA);
router.post("/2fa/verify", useAuthLayout, AdminAuthController.verify2FA);

// ============ PROTECTED ROUTES (Require Admin Role) ============
// First, apply admin authentication (creates fake session for testing)
router.use(isAdmin);

// Then apply RBAC role requirement
router.use(requireRole("admin"));

// ============ DASHBOARD ROUTES ============
router.get("/dashboard", requirePermission("dashboard", "view"), AdminDashboardController.getDashboard);
router.get("/dashboard/statistics", requirePermission("dashboard", "view"), AdminDashboardController.getStatistics);
router.get("/dashboard/activity-monitor", requirePermission("dashboard", "view"), AdminDashboardController.getActivityMonitor);

// ============ USER MANAGEMENT ROUTES ============
router.get("/users", requirePermission("users", "view"), AdminUserController.getAllUsers);
router.get("/users/stats", requirePermission("users", "view"), AdminUserController.getUserStats);
router.get("/users/:id", requirePermission("users", "view"), AdminUserController.getUserDetails);
router.put("/users/:id", requirePermission("users", "update"), AdminUserController.updateUser);
router.post("/users/:id/suspend", requirePermission("users", "suspend"), AdminUserController.suspendUser);
router.post("/users/:id/activate", requirePermission("users", "suspend"), AdminUserController.activateUser);
router.delete("/users/:id", requirePermission("users", "delete"), AdminUserController.deleteUser);
router.post("/users/:id/reset-password", requirePermission("users", "update"), AdminUserController.resetUserPassword);

// ============ KYC MANAGEMENT ROUTES ============
router.get("/kyc", requirePermission("users", "view"), AdminKYCController.getKYCManagement);
router.get("/kyc/:id", requirePermission("users", "view"), AdminKYCController.getKYCDetails);
router.post("/kyc/:zenoPayId/approve", requirePermission("users", "update"), AdminKYCController.approveSubmission);
router.post("/kyc/:zenoPayId/reject", requirePermission("users", "update"), AdminKYCController.rejectSubmission);
router.post("/kyc/:zenoPayId/resubmission", requirePermission("users", "update"), AdminKYCController.requestResubmission);

// ============ SUPPORT & OPERATIONS ROUTES ============
router.get("/support", requirePermission("users", "view"), AdminOperationsController.getSupportTickets);
router.get("/support/:id", requirePermission("users", "view"), AdminOperationsController.getSupportTicketDetails);
router.get("/notifications", requirePermission("settings", "view"), AdminOperationsController.getNotificationsCenter);
router.get("/pricing", requirePermission("settings", "view"), AdminOperationsController.getPricingManagement);
router.get("/audit-logs", requirePermission("reports", "view"), AdminOperationsController.getAuditLogs);

// ============ MERCHANT MANAGEMENT ROUTES ============
router.get("/merchants", requirePermission("merchants", "view"), AdminMerchantController.getAllMerchants);
router.get("/merchants/pending", requirePermission("merchants", "view"), AdminMerchantController.getPendingMerchants);
router.get("/merchants/:id", requirePermission("merchants", "view"), AdminMerchantController.getMerchantDetails);
router.post("/merchants/:id/approve", requirePermission("merchants", "approve"), AdminMerchantController.approveMerchant);
router.post("/merchants/:id/reject", requirePermission("merchants", "reject"), AdminMerchantController.rejectMerchant);
router.post("/merchants/:id/suspend", requirePermission("merchants", "suspend"), AdminMerchantController.suspendMerchant);
router.post("/merchants/:id/revoke-keys", requirePermission("merchants", "suspend"), AdminMerchantController.revokeApiKeys);

// ============ BANK MANAGEMENT ROUTES ============
router.get("/banks", requirePermission("banks", "view"), AdminBankController.getAllBanks);
router.get("/banks/pending", requirePermission("banks", "view"), AdminBankController.getPendingBanks);
router.get("/banks/:id", requirePermission("banks", "view"), AdminBankController.getBankDetails);
router.post("/banks/:id/approve", requirePermission("banks", "create"), AdminBankController.approveBank);
router.post("/banks/:id/reject", requirePermission("banks", "delete"), AdminBankController.rejectBank);
router.put("/banks/:id", requirePermission("banks", "update"), AdminBankController.updateBank);
router.delete("/banks/:id", requirePermission("banks", "delete"), AdminBankController.deleteBank);

// ============ TRANSACTION MANAGEMENT ROUTES ============
router.get("/transactions", requirePermission("transactions", "view"), AdminTransactionController.getAllTransactions);
router.get("/transactions/flagged", requirePermission("transactions", "flag"), AdminTransactionController.getFlaggedTransactions);
router.get("/transactions/failed", requirePermission("transactions", "view"), AdminTransactionController.failedTransactions);
router.post("/transactions/bulk-retry", requirePermission("transactions", "view"), AdminTransactionController.bulkRetryTransactions);
router.post("/transactions/bulk-flag", requirePermission("transactions", "view"), AdminTransactionController.bulkFlagTransactions);
router.get("/transactions/export", requirePermission("transactions", "view"), AdminTransactionController.exportTransactions);
router.post("/transactions/:id/retry", requirePermission("transactions", "view"), AdminTransactionController.retryTransaction);
router.post("/transactions/:id/flag", requirePermission("transactions", "view"), AdminTransactionController.flagTransaction);
router.get("/transactions/:id", requirePermission("transactions", "view"), AdminTransactionController.getTransactionDetails);

// ============ WALLET MANAGEMENT ROUTES ============
router.get("/wallets", requirePermission("transactions", "view"), AdminWalletController.walletsList);
router.post("/wallets/bulk-action", requirePermission("transactions", "view"), AdminWalletController.bulkWalletAction);
router.get("/wallets/export", requirePermission("transactions", "view"), AdminWalletController.exportWallets);
router.patch("/wallets/:id/status", requirePermission("transactions", "view"), AdminWalletController.updateWalletStatus);
router.post("/wallets/:id/adjust-balance", requirePermission("transactions", "view"), AdminWalletController.adjustWalletBalance);
router.post("/wallets/:id/reset-balance", requirePermission("transactions", "view"), AdminWalletController.resetWalletBalance);
router.get("/wallets/:id", requirePermission("transactions", "view"), AdminWalletController.walletDetails);

// ============ ANALYTICS & REPORTS ROUTES ============
router.get("/analytics", requirePermission("reports", "view"), AdminDashboardController.getAnalytics);
router.get("/reports", requirePermission("reports", "view"), AdminDashboardController.getReports);
router.get("/reports/export", requirePermission("reports", "export"), AdminDashboardController.exportReports);

// ============ SETTINGS ROUTES ============
router.get("/settings", requirePermission("settings", "view"), AdminDashboardController.getSettings);
router.post("/settings", requirePermission("settings", "update"), AdminDashboardController.updateSettings);

// ============ PAYMENT GATEWAY ROUTES ============
router.get("/settings/payment-gateway", requirePermission("payment_gateway", "view"), AdminPaymentGatewayController.getPaymentGatewaySettings);
router.post("/settings/payment-gateway/test", requirePermission("payment_gateway", "test"), AdminPaymentGatewayController.testGatewayConnection);
router.post("/settings/payment-gateway/save", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.savePaymentGatewayConfig);
router.post("/settings/payment-gateway/fees", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.updateTransactionFees);
router.post("/settings/payment-gateway/toggle-method", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.togglePaymentMethod);
router.post("/settings/payment-gateway/advanced", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.updateAdvancedSettings);
router.get("/settings/payment-gateway/config", requirePermission("payment_gateway", "view"), AdminPaymentGatewayController.getPaymentGatewayConfig);

// ============ PRIVACY POLICY MANAGEMENT ROUTES ============
router.get("/privacy-policy", requirePermission("settings", "view"), AdminPrivacyPolicyController.getPrivacyPolicyDashboard);
router.get("/privacy-policy/create", requirePermission("settings", "update"), AdminPrivacyPolicyController.getCreatePolicyForm);
router.post("/privacy-policy/create", requirePermission("settings", "update"), AdminPrivacyPolicyController.createPolicy);
router.get("/privacy-policy/:id/edit", requirePermission("settings", "update"), AdminPrivacyPolicyController.getEditPolicyForm);
router.put("/privacy-policy/:id", requirePermission("settings", "update"), AdminPrivacyPolicyController.updatePolicy);
router.post("/privacy-policy/:id/publish", requirePermission("settings", "update"), AdminPrivacyPolicyController.publishPolicy);
router.delete("/privacy-policy/:id", requirePermission("settings", "delete"), AdminPrivacyPolicyController.deletePolicy);
router.post("/privacy-policy/:id/archive", requirePermission("settings", "update"), AdminPrivacyPolicyController.archivePolicy);
router.get("/privacy-policy/:id/preview", requirePermission("settings", "view"), AdminPrivacyPolicyController.previewPolicy);
router.get("/privacy-policy/compare", requirePermission("settings", "view"), AdminPrivacyPolicyController.compareVersions);
router.get("/privacy-policy/:version/analytics", requirePermission("settings", "view"), AdminPrivacyPolicyController.getConsentAnalytics);

module.exports = router;
