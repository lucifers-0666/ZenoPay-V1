const express = require("express");
const router = express.Router();

const KYCController = require("../Controllers/KYCController");
const ContactController = require("../Controllers/ContactController");
const { isAdmin } = require("../Admin/Middleware/adminAuth");

router.use(isAdmin);

// Admin KYC Management (PAN + Aadhaar Verification)
router.get("/admin/kyc", KYCController.adminListKYC);
router.get("/admin/kyc/:kycId", KYCController.adminViewKYC);
router.post("/admin/kyc/:kycId/approve", KYCController.adminApproveKYC);
router.post("/admin/kyc/:kycId/reject", KYCController.adminRejectKYC);
router.get("/admin/kyc/:kycId/mark-review", KYCController.adminMarkUnderReview);

// Admin Contact Management
router.get("/api/admin/contact/submissions", ContactController.getAllSubmissions);
router.get("/api/admin/contact/submissions/:id", ContactController.getSubmissionById);
router.put("/api/admin/contact/submissions/:id/status", ContactController.updateSubmissionStatus);
router.post("/api/admin/contact/submissions/:id/reply", ContactController.replyToSubmission);

module.exports = router;
