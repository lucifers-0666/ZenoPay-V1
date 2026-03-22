const express = require("express");
const router = express.Router();

const KYCController = require("../Controllers/KYCController");
const ContactController = require("../Controllers/ContactController");

// Admin KYC Management
router.post("/admin/kyc/approve", KYCController.approveKYC);
router.post("/admin/kyc/reject", KYCController.rejectKYC);
router.get("/admin/kyc/:zenoPayId/documents", KYCController.getKYCDocuments);

// Admin Contact Management
router.get("/api/admin/contact/submissions", ContactController.getAllSubmissions);
router.get("/api/admin/contact/submissions/:id", ContactController.getSubmissionById);
router.put("/api/admin/contact/submissions/:id/status", ContactController.updateSubmissionStatus);
router.post("/api/admin/contact/submissions/:id/reply", ContactController.replyToSubmission);

module.exports = router;
