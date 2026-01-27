const ZenoPayUser = require("../Models/ZenoPayUser");

/**
 * GET KYC Verification Page
 */
const getKYCVerification = async (req, res) => {
  try {
    // TEMPORARY: Bypass auth for design review
    if (!req.session.isLoggedIn || !req.session.user) {
      req.session.isLoggedIn = true;
      req.session.user = { ZenoPayID: "ZP-DEMO2024" };
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    // Check if user already completed KYC
    if (user.KYCStatus === "verified" || user.KYCStatus === "approved") {
      return res.redirect("/dashboard");
    }

    res.render("kyc-verification", {
      pageTitle: "KYC Verification",
      user: user,
      isLoggedIn: true,
    });
  } catch (error) {
    console.error("Error loading KYC page:", error);
    res.status(500).send("Error loading KYC verification page");
  }
};

/**
 * POST Submit KYC Documents
 */
const submitKYCDocuments = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const { step1, step2, step3 } = req.body;

    // Validate required data
    if (!step1 || !step2 || !step3) {
      return res.status(400).json({ success: false, message: "Missing required data" });
    }

    if (!step1.identityType || !step1.frontFile) {
      return res.status(400).json({ success: false, message: "Invalid identity document" });
    }

    if (!step2.addressType || !step2.file) {
      return res.status(400).json({ success: false, message: "Invalid proof of address" });
    }

    if (!step3.file) {
      return res.status(400).json({ success: false, message: "Invalid selfie" });
    }

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user with KYC data
    user.KYCStatus = "pending";
    user.KYCSubmittedAt = new Date();
    user.KYCDocuments = {
      identityType: step1.identityType,
      identityFront: step1.frontFile,
      identityBack: step1.backFile || null,
      identityFrontRotation: step1.frontRotation,
      identityBackRotation: step1.backRotation,
      addressType: step2.addressType,
      addressDocument: step2.file,
      addressRotation: step2.rotation,
      selfie: step3.file,
      selfieRotation: step3.rotation
    };

    await user.save();

    // TODO: In production, queue documents for verification
    // sendKYCVerificationEmail(user.Email, zenoPayId);
    // queueDocumentVerification(zenoPayId, user.KYCDocuments);

    res.json({
      success: true,
      message: "KYC documents submitted successfully",
      referenceId: zenoPayId
    });
  } catch (error) {
    console.error("Error submitting KYC:", error);
    res.status(500).json({ success: false, message: "Failed to submit KYC" });
  }
};

/**
 * GET KYC Status
 */
const getKYCStatus = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      kycStatus: user.KYCStatus || "not_started",
      submittedAt: user.KYCSubmittedAt || null,
      verifiedAt: user.KYCVerifiedAt || null,
      rejectionReason: user.KYCRejectionReason || null
    });
  } catch (error) {
    console.error("Error getting KYC status:", error);
    res.status(500).json({ success: false, message: "Failed to get KYC status" });
  }
};

/**
 * Admin: Approve KYC
 */
const approveKYC = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.isLoggedIn || req.session.user.Role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { zenoPayId } = req.body;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.KYCStatus = "approved";
    user.KYCVerifiedAt = new Date();
    await user.save();

    // TODO: Send approval email
    // sendKYCApprovalEmail(user.Email);

    res.json({ success: true, message: "KYC approved successfully" });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({ success: false, message: "Failed to approve KYC" });
  }
};

/**
 * Admin: Reject KYC
 */
const rejectKYC = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.isLoggedIn || req.session.user.Role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { zenoPayId, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Rejection reason required" });
    }

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.KYCStatus = "rejected";
    user.KYCRejectionReason = reason;
    user.KYCRejectedAt = new Date();
    await user.save();

    // TODO: Send rejection email
    // sendKYCRejectionEmail(user.Email, reason);

    res.json({ success: true, message: "KYC rejected successfully" });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    res.status(500).json({ success: false, message: "Failed to reject KYC" });
  }
};

/**
 * GET Verification Status Page
 */
const getVerificationStatusPage = async (req, res) => {
  try {
    // TEMPORARY: Bypass auth for design review
    if (!req.session.isLoggedIn || !req.session.user) {
      req.session.isLoggedIn = true;
      req.session.user = { ZenoPayID: "ZP-DEMO2024" };
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    const formatDate = (date) =>
      date
        ? new Date(date).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;

    const kycStatus = user.KYCStatus || "not_started";
    const submissionDate = formatDate(user.KYCSubmittedAt);
    const approvalDate = formatDate(user.KYCVerifiedAt);
    const rejectionDate = formatDate(user.KYCRejectedAt);

    let expectedCompletion = null;
    if (user.KYCSubmittedAt) {
      const expected = new Date(user.KYCSubmittedAt);
      expected.setHours(expected.getHours() + 48);
      expectedCompletion = formatDate(expected);
    }

    // Timeline entries
    const timeline = [];
    timeline.push({
      title: "Documents Submitted",
      date: submissionDate || "Awaiting submission",
      note: submissionDate ? "We received your documents." : "You have not submitted documents yet.",
      active: !submissionDate,
    });

    if (submissionDate) {
      timeline.push({
        title: "Review Started",
        date: submissionDate,
        note: "Our verification team has started reviewing your documents.",
        active: kycStatus === "pending",
      });
    }

    if (kycStatus === "pending") {
      timeline.push({
        title: "Current Status",
        date: "In progress",
        note: "We're carefully checking your details.",
        active: true,
      });

      timeline.push({
        title: "Expected Completion",
        date: expectedCompletion || "24-48 hours",
        note: "We'll notify you once this is done.",
        active: false,
      });
    }

    if (kycStatus === "approved" || kycStatus === "verified") {
      timeline.push({
        title: "Approved",
        date: approvalDate || "—",
        note: "Verification completed successfully.",
        active: true,
      });
    }

    if (kycStatus === "rejected") {
      timeline.push({
        title: "Rejected",
        date: rejectionDate || "—",
        note: "Please review the reasons and resubmit.",
        active: true,
      });
    }

    // Rejection reasons array
    let rejectionReasons = [];
    if (user.KYCRejectionReason) {
      rejectionReasons = user.KYCRejectionReason
        .split(/\n|,|;/)
        .map((r) => r.trim())
        .filter(Boolean);
    }

    res.render("verification-status", {
      pageTitle: "Verification Status",
      kycStatus,
      submissionDate,
      approvalDate,
      rejectionDate,
      expectedCompletion,
      timeline,
      rejectionReasons,
      ZenoPayID: zenoPayId,
      isLoggedIn: true,
    });
  } catch (error) {
    console.error("Error loading verification status page:", error);
    res.status(500).send("Error loading verification status page");
  }
};

/**
 * GET KYC Documents (Admin)
 */
const getKYCDocuments = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.isLoggedIn || req.session.user.Role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { zenoPayId } = req.params;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.KYCDocuments) {
      return res.status(404).json({ success: false, message: "No KYC documents found" });
    }

    res.json({
      success: true,
      documents: {
        identityType: user.KYCDocuments.identityType,
        identityFront: user.KYCDocuments.identityFront,
        identityBack: user.KYCDocuments.identityBack,
        addressType: user.KYCDocuments.addressType,
        addressDocument: user.KYCDocuments.addressDocument,
        selfie: user.KYCDocuments.selfie
      }
    });
  } catch (error) {
    console.error("Error getting KYC documents:", error);
    res.status(500).json({ success: false, message: "Failed to get KYC documents" });
  }
};

module.exports = {
  getKYCVerification,
  getVerificationStatusPage,
  submitKYCDocuments,
  getKYCStatus,
  approveKYC,
  rejectKYC,
  getKYCDocuments
};
