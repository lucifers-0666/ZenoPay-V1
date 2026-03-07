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
const adminRefundController = require("../../controllers/admin/adminRefundController");
const adminMgmtController = require("../../Controllers/admin/adminMgmtController");
const adminSettingsController = require("../../Controllers/admin/adminSettingsController");
const adminAuditController = require("../../Controllers/admin/adminAuditController");
const adminNotifController = require("../../Controllers/admin/adminNotifController");
const adminProfileController = require("../../Controllers/admin/adminProfileController");
const adminMerchantController = require("../../Controllers/admin/adminMerchantController");
const adminBankController = require("../../Controllers/admin/adminBankController");
const adminAnnouncementController = require("../../Controllers/admin/adminAnnouncementController");
const adminActivityController = require("../../Controllers/admin/adminActivityController");

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

// Fallback admin page resolver (controllers can still override with explicit values)
const resolveAdminPageFromPath = (path = "") => {
	if (path === "/dashboard" || path.startsWith("/dashboard?")) return "dashboard";
	if (path.startsWith("/dashboard/statistics")) return "statistics";
	if (path.startsWith("/dashboard/activity-monitor")) return "activity-monitor";
	if (path === "/users" || /^\/users\/.+/.test(path)) return "users";
	if (path.startsWith("/kyc")) return "kyc";
	if (path.startsWith("/support")) return "support";
	if (path.startsWith("/merchants/pending")) return "merchants-pending";
	if (path.startsWith("/merchants")) return "merchants";
	if (path.startsWith("/banks/pending")) return "banks-pending";
	if (path.startsWith("/banks")) return "banks";
	if (path.startsWith("/transactions/flagged")) return "flagged";
	if (path.startsWith("/transactions/failed")) return "failed";
	if (path.startsWith("/transactions")) return "transactions";
	if (path.startsWith("/wallets")) return "wallets";
	if (path.startsWith("/refunds")) return "refunds";
	if (path.startsWith("/analytics")) return "analytics";
	if (path.startsWith("/reports")) return "reports";
	if (path.startsWith("/notifications")) return "notifications";
	if (path.startsWith("/pricing")) return "pricing";
	if (path.startsWith("/privacy-policy")) return "privacy";
	if (path.startsWith("/admins")) return "admins";
	if (path.startsWith("/settings")) return "settings";
	if (path.startsWith("/audit-logs")) return "audit-logs";
	if (path.startsWith("/announcements")) return "announcements";
	if (path.startsWith("/profile")) return "profile";
	return "";
};

router.use((req, res, next) => {
	if (!res.locals.adminPage) {
		res.locals.adminPage = resolveAdminPageFromPath(req.path || "");
	}
	next();
});

// ============ DASHBOARD ROUTES ============
router.get("/dashboard", requirePermission("dashboard", "view"), AdminDashboardController.getDashboard);
router.get("/dashboard/statistics", requirePermission("dashboard", "view"), AdminDashboardController.getStatistics);
router.get("/dashboard/statistics/chart-data", requirePermission("dashboard", "view"), AdminDashboardController.getStatisticsChartData);
router.get("/dashboard/statistics/export", requirePermission("dashboard", "view"), AdminDashboardController.exportStatistics);
router.get("/dashboard/activity-monitor", requirePermission("dashboard", "view"), adminActivityController.activityMonitor);

// ============ USER MANAGEMENT ROUTES ============
router.get("/users", requirePermission("users", "view"), AdminUserController.getAllUsers);
router.get("/users/export", requirePermission("users", "view"), AdminUserController.exportUsersCSV);
router.post("/users/bulk-action", requirePermission("users", "update"), AdminUserController.bulkUserAction);
router.post("/users/create", requirePermission("users", "create"), AdminUserController.createUser);
router.get("/users/stats", requirePermission("users", "view"), AdminUserController.getUserStats);
router.get("/users/:id", requirePermission("users", "view"), AdminUserController.getUserDetail);
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
router.get("/notifications", requirePermission("settings", "view"), adminNotifController.notificationsList);
router.patch("/notifications/mark-all-read", requirePermission("settings", "update"), adminNotifController.markAllRead);
router.delete("/notifications/clear-all", requirePermission("settings", "update"), adminNotifController.clearAll);
router.patch("/notifications/:id/read", requirePermission("settings", "update"), adminNotifController.markAsRead);
router.delete("/notifications/:id", requirePermission("settings", "update"), adminNotifController.deleteNotification);
router.post("/notifications/send", requirePermission("settings", "update"), adminNotifController.sendNotification);
router.get("/announcements", requirePermission("settings", "view"), adminAnnouncementController.announcementsList);
router.post("/announcements/create", requirePermission("settings", "update"), adminAnnouncementController.create);
router.patch("/announcements/:id", requirePermission("settings", "update"), adminAnnouncementController.update);
router.patch("/announcements/:id/publish", requirePermission("settings", "update"), adminAnnouncementController.publish);
router.patch("/announcements/:id/unpublish", requirePermission("settings", "update"), adminAnnouncementController.unpublish);
router.delete("/announcements/:id", requirePermission("settings", "delete"), adminAnnouncementController.delete);
router.get("/pricing", requirePermission("settings", "view"), AdminOperationsController.getPricingManagement);
router.put("/pricing/:id", requirePermission("settings", "update"), AdminOperationsController.updatePricingPlan);
router.post("/pricing/settings", requirePermission("settings", "update"), AdminOperationsController.updatePricingSettings);
router.patch("/pricing/:id/archive", requirePermission("settings", "update"), AdminOperationsController.archivePricingPlan);
router.patch("/pricing/:id/visibility", requirePermission("settings", "update"), AdminOperationsController.togglePricingPlanVisibility);

// ============ MERCHANT MANAGEMENT ROUTES ============
router.get("/merchants", requirePermission("merchants", "view"), adminMerchantController.merchantsList);
router.get("/merchants/export", requirePermission("merchants", "view"), adminMerchantController.exportMerchants);
router.get("/merchants/pending", requirePermission("merchants", "view"), adminMerchantController.pendingMerchants);
router.get("/merchants/:id/quick-info", requirePermission("merchants", "view"), adminMerchantController.quickInfo);
router.get("/merchants/:id", requirePermission("merchants", "view"), adminMerchantController.merchantDetails);
router.patch("/merchants/:id/status", requirePermission("merchants", "suspend"), adminMerchantController.updateStatus);
router.patch("/merchants/:id/verify", requirePermission("merchants", "approve"), adminMerchantController.verifyMerchant);
router.patch("/merchants/:id/reject", requirePermission("merchants", "reject"), adminMerchantController.rejectMerchant);
router.post("/merchants/bulk-action", requirePermission("merchants", "approve"), adminMerchantController.bulkAction);
router.delete("/merchants/:id", requirePermission("merchants", "reject"), adminMerchantController.deleteMerchant);
router.post("/merchants/:id/approve", requirePermission("merchants", "approve"), AdminMerchantController.approveMerchant);
router.post("/merchants/:id/reject", requirePermission("merchants", "reject"), AdminMerchantController.rejectMerchant);
router.post("/merchants/:id/suspend", requirePermission("merchants", "suspend"), AdminMerchantController.suspendMerchant);
router.post("/merchants/:id/revoke-keys", requirePermission("merchants", "suspend"), AdminMerchantController.revokeApiKeys);

// ============ BANK MANAGEMENT ROUTES ============
router.get("/banks", requirePermission("banks", "view"), adminBankController.banksList);
router.post("/banks/add", requirePermission("banks", "create"), adminBankController.addBank);
router.get("/banks/pending", requirePermission("banks", "view"), adminBankController.pendingBanks);
router.get("/banks/:id/info", requirePermission("banks", "view"), adminBankController.bankInfo);
router.patch("/banks/:id/approve", requirePermission("banks", "update"), adminBankController.approveBank);
router.patch("/banks/:id/reject", requirePermission("banks", "update"), adminBankController.rejectBank);
router.patch("/banks/:id/status", requirePermission("banks", "update"), adminBankController.updateStatus);
router.patch("/banks/:id/priority", requirePermission("banks", "update"), adminBankController.updatePriority);
router.patch("/banks/:id", requirePermission("banks", "update"), adminBankController.updateBank);
router.delete("/banks/:id", requirePermission("banks", "delete"), adminBankController.deleteBank);
router.get("/banks/:id", requirePermission("banks", "view"), AdminBankController.getBankDetails);
router.post("/banks/:id/approve", requirePermission("banks", "create"), AdminBankController.approveBank);
router.post("/banks/:id/reject", requirePermission("banks", "delete"), AdminBankController.rejectBank);
router.put("/banks/:id", requirePermission("banks", "update"), AdminBankController.updateBank);

// ============ TRANSACTION MANAGEMENT ROUTES ============
router.get("/transactions", requirePermission("transactions", "view"), AdminTransactionController.getAllTransactions);
router.get("/transactions/flagged", requirePermission("transactions", "flag"), AdminTransactionController.getFlaggedTransactions);
// TEMP DEBUG ROUTE: remove after /admin/transactions/failed is confirmed stable
router.get("/transactions/failed/debug", requirePermission("transactions", "view"), async (req, res) => {
	try {
		const TransactionHistory = require("../../Models/TransactionHistory");

		const failedStatuses = ["failed", "Failed", "FAILED", "declined", "Declined"];
		const count = await TransactionHistory.countDocuments({
			Status: { $in: failedStatuses },
		});

		const one = await TransactionHistory.findOne({
			Status: { $in: failedStatuses },
		}).lean();

		console.log("Failed count:", count);
		console.log("Sample doc:", one);

		return res.json({
			success: true,
			count,
			sampleDoc: one,
			message: "Controller query works fine",
		});
	} catch (err) {
		return res.json({
			success: false,
			error: err?.message || "Unknown error",
			stack: err?.stack || null,
		});
	}
});
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

// ============ REFUNDS MANAGEMENT ROUTES ============
router.get("/refunds", requirePermission("transactions", "view"), adminRefundController.refundsList);
router.post("/refunds/bulk-action", requirePermission("transactions", "view"), adminRefundController.bulkRefundAction);
router.get("/refunds/export", requirePermission("transactions", "view"), adminRefundController.exportRefunds);
router.patch("/refunds/:id/approve", requirePermission("transactions", "view"), adminRefundController.approveRefund);
router.patch("/refunds/:id/reject", requirePermission("transactions", "view"), adminRefundController.rejectRefund);
router.get("/refunds/:id", requirePermission("transactions", "view"), adminRefundController.refundDetails);

// ============ ANALYTICS & REPORTS ROUTES ============
router.get("/analytics", requirePermission("reports", "view"), AdminDashboardController.getAnalytics);
router.get("/reports", requirePermission("reports", "view"), AdminDashboardController.getReports);
router.get("/reports/export", requirePermission("reports", "export"), AdminDashboardController.exportReports);
router.get("/audit-logs/export", requirePermission("reports", "view"), adminAuditController.exportAuditLogs);
router.get("/audit-logs", requirePermission("reports", "view"), adminAuditController.auditLogsList);

// ============ SETTINGS ROUTES ============
router.get("/settings", requirePermission("settings", "view"), adminSettingsController.settingsPage);
router.post("/settings/general", requirePermission("settings", "update"), adminSettingsController.updateGeneralSettings);
router.post("/settings/payment", requirePermission("settings", "update"), adminSettingsController.updatePaymentSettings);
router.post("/settings/security", requirePermission("settings", "update"), adminSettingsController.updateSecuritySettings);
router.post("/settings/notification", requirePermission("settings", "update"), adminSettingsController.updateNotificationSettings);
router.post("/settings/maintenance", requirePermission("settings", "update"), adminSettingsController.toggleMaintenance);
router.post("/settings/reset", requirePermission("settings", "update"), adminSettingsController.resetSettings);
router.post("/settings/force-logout", requirePermission("settings", "update"), adminSettingsController.forceLogoutAdmins);

// ============ ADMIN MANAGEMENT ROUTES ============
router.get("/admins", requirePermission("users", "view"), adminMgmtController.getAdminManagementPage);
router.post("/admins/create", requirePermission("users", "create"), adminMgmtController.createAdmin);
router.post("/admins/:id/status", requirePermission("users", "update"), adminMgmtController.updateAdminStatus);
router.post("/admins/:id/role", requirePermission("users", "update"), adminMgmtController.updateAdminRole);
router.post("/admins/:id/delete", requirePermission("users", "delete"), adminMgmtController.deleteAdmin);

// ============ PAYMENT GATEWAY ROUTES ============
router.get("/settings/payment-gateway", requirePermission("payment_gateway", "view"), AdminPaymentGatewayController.getPaymentGatewaySettings);
router.post("/settings/payment-gateway/test", requirePermission("payment_gateway", "test"), AdminPaymentGatewayController.testGatewayConnection);
router.post("/settings/payment-gateway/save", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.savePaymentGatewayConfig);
router.post("/settings/payment-gateway/fees", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.updateTransactionFees);
router.post("/settings/payment-gateway/toggle-method", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.togglePaymentMethod);
router.post("/settings/payment-gateway/advanced", requirePermission("payment_gateway", "update"), AdminPaymentGatewayController.updateAdvancedSettings);
router.get("/settings/payment-gateway/config", requirePermission("payment_gateway", "view"), AdminPaymentGatewayController.getPaymentGatewayConfig);

// ============ PROFILE ROUTES ============
router.get("/profile", requirePermission("settings", "view"), adminProfileController.profilePage);
router.post("/profile/update", requirePermission("settings", "update"), adminProfileController.updateProfile);
router.post("/profile/change-password", requirePermission("settings", "update"), adminProfileController.changePassword);
router.post("/profile/toggle-2fa", requirePermission("settings", "update"), adminProfileController.toggle2FA);
router.delete("/profile/session/:sessionId", requirePermission("settings", "update"), adminProfileController.revokeSession);
router.delete("/profile/sessions/all", requirePermission("settings", "update"), adminProfileController.revokeAllSessions);

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
