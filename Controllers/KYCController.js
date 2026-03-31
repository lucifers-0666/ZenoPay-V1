const KYC = require("../Models/KYC");
const ZenoPayUser = require("../Models/ZenoPayUser");
const fs = require("fs");
const path = require("path");
const { KYC_ROUTES } = require("../Routes/constants");

// Helper to resolve current user (unified approach)
const resolveCurrentUser = async (session) => {
  if (!session?.user) return null;
  const zenoPayId = session.user.ZenoPayID || session.user.userId;
  return await ZenoPayUser.findOne({
    $or: [{ ZenoPayID: zenoPayId }, { userId: zenoPayId }, { _id: session.user._id }],
  });
};

// PAN validation regex: AAAAA9999A
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Aadhaar validation: 12 digits
const AADHAAR_REGEX = /^[0-9]{12}$/;

/**
 * GET KYC_ROUTES.STATUS_PAGE - Show KYC status page
 */
const getKYCStatus = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req.session);
    if (!user) {
      return res.redirect("/login");
    }

    // Get latest KYC submission for this user
    const kycRecord = await KYC.findOne({ userId: user._id }).sort({ createdAt: -1 });

    let kycView = {
      status: kycRecord?.status || "not_submitted",
      submittedAt: kycRecord?.submittedAt,
      reviewedAt: kycRecord?.reviewedAt,
      rejectionReason: kycRecord?.rejectionReason,
      resubmissionAllowed: kycRecord?.resubmissionAllowed,
      user,
      kycRecord,
      isVerified: user.kycStatus === "approved" || user.kycTier === 1,
    };

    res.render("user/kyc-status", {
      pageTitle: "KYC Status",
      isLoggedIn: true,
      kyc: kycView,
    });
  } catch (error) {
    console.error("Error loading KYC status:", error);
    res.status(500).render("error", { error: "Failed to load KYC status" });
  }
};

/**
 * GET KYC_ROUTES.STATUS_JSON - Return KYC status as JSON
 */
const getKYCStatusJson = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req.session);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const kycRecord = await KYC.findOne({ userId: user._id }).sort({ createdAt: -1 });
    const status = kycRecord?.status || user?.kycStatus || "not_submitted";

    return res.json({
      success: true,
      kycStatus: status,
      kycTier: Number(user?.kycTier || 0),
      submittedAt: kycRecord?.submittedAt || null,
      reviewedAt: kycRecord?.reviewedAt || null,
      rejectionReason: kycRecord?.rejectionReason || null,
    });
  } catch (error) {
    console.error("Error fetching KYC status json:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch KYC status" });
  }
};

/**
 * GET KYC_ROUTES.SUBMIT_PAGE - Show KYC submission form
 */
const getKYCForm = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req.session);
    if (!user) {
      return res.redirect("/login");
    }

    // Check if user already has approved KYC
    if (user.kycStatus === "approved") {
      return res.redirect(`${KYC_ROUTES.STATUS_PAGE}?status=already_verified`);
    }

    // Get latest KYC record for context
    const kycRecord = await KYC.findOne({ userId: user._id }).sort({ createdAt: -1 });

    res.render("user/kyc-submit", {
      pageTitle: "Submit KYC",
      isLoggedIn: true,
      user,
      kycRecord,
      panPlaceholder: "Enter your PAN (e.g., AAABB1234C)",
      aadhaarPlaceholder: "12-digit Aadhaar number (e.g., 123456789012)",
    });
  } catch (error) {
    console.error("Error loading KYC form:", error);
    res.status(500).render("error", { error: "Failed to load KYC form" });
  }
};

/**
 * POST KYC_ROUTES.SUBMIT_POST - Submit KYC documents
 */
const submitKYC = async (req, res) => {
  try {
    const user = await resolveCurrentUser(req.session);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { panNumber, aadhaarNumber } = req.body;

    // Validate PAN format
    if (!PAN_REGEX.test(panNumber?.toUpperCase?.())) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN format. Use format: AAAAA9999A (e.g., AAABB1234C)",
      });
    }

    // Validate Aadhaar format
    if (!AADHAAR_REGEX.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Aadhaar number. Must be 12 digits.",
      });
    }

    // Check if files are uploaded
    if (!req.files?.panCardImage || !req.files?.aadhaarFrontImage || !req.files?.aadhaarBackImage) {
      return res.status(400).json({
        success: false,
        message: "All three documents required: PAN card, Aadhaar front, and Aadhaar back.",
      });
    }

    // Extract last 4 digits of Aadhaar
    const aadhaarLast4 = aadhaarNumber.slice(-4);

    // Create KYC record
    const kycRecord = new KYC({
      userId: user._id,
      panNumber: panNumber.toUpperCase(),
      aadhaarLast4,
      panCardImage: `/uploads/kyc/${req.files.panCardImage[0].filename}`,
      aadhaarFrontImage: `/uploads/kyc/${req.files.aadhaarFrontImage[0].filename}`,
      aadhaarBackImage: `/uploads/kyc/${req.files.aadhaarBackImage[0].filename}`,
      status: "pending",
      submittedAt: new Date(),
    });

    await kycRecord.save();

    // Update user KYC status
    user.kycStatus = "pending";
    await user.save();

    res.json({
      success: true,
      message: "KYC submitted successfully. Your documents are under review.",
      referenceId: kycRecord._id,
    });
  } catch (error) {
    console.error("Error submitting KYC:", error);
    
    // Clean up uploaded files on error
    if (req.files) {
      const files = [
        ...(req.files?.panCardImage || []),
        ...(req.files?.aadhaarFrontImage || []),
        ...(req.files?.aadhaarBackImage || []),
      ];
      files.forEach((file) => {
        if (file.path) {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        }
      });
    }
    
    res.status(500).json({ success: false, message: "Failed to submit KYC" });
  }
};

/**
 * GET /admin/kyc - List all pending KYC submissions
 */
const adminListKYC = async (req, res) => {
  try {
    // Check admin auth
    if (req.session.user?.role !== "Admin" && req.session.user?.Role !== "admin") {
      return res.redirect("/login");
    }

    const status = req.query.status || "pending";
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get KYC records with user details
    const kycRecords = await KYC.find({ status })
      .populate("userId", "name email FullName Email phone Mobile")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await KYC.countDocuments({ status });
    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/kyc-list", {
      pageTitle: "KYC Submissions",
      isLoggedIn: true,
      isAdmin: true,
      kycRecords,
      status,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error("Error listing KYC records:", error);
    res.status(500).render("error", { error: "Failed to load KYC records" });
  }
};

/**
 * GET /admin/kyc/:kycId - View KYC details for review
 */
const adminViewKYC = async (req, res) => {
  try {
    if (req.session.user?.role !== "Admin" && req.session.user?.Role !== "admin") {
      return res.redirect("/login");
    }

    const kycRecord = await KYC.findById(req.params.kycId).populate(
      "userId",
      "name email phone FullName Email Mobile"
    );

    if (!kycRecord) {
      return res.status(404).render("error", { error: "KYC record not found" });
    }

    res.render("admin/kyc-detail", {
      pageTitle: "KYC Review",
      isLoggedIn: true,
      isAdmin: true,
      kyc: kycRecord,
      user: kycRecord.userId,
    });
  } catch (error) {
    console.error("Error viewing KYC record:", error);
    res.status(500).render("error", { error: "Failed to load KYC record" });
  }
};

/**
 * POST /admin/kyc/:kycId/approve - Approve KYC submission
 */
const adminApproveKYC = async (req, res) => {
  try {
    if (req.session.user?.role !== "Admin" && req.session.user?.Role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const kycRecord = await KYC.findById(req.params.kycId);
    if (!kycRecord) {
      return res.status(404).json({ success: false, message: "KYC record not found" });
    }

    const reviewer = await resolveCurrentUser(req.session);

    // Update KYC record
    kycRecord.status = "approved";
    kycRecord.reviewedAt = new Date();
    kycRecord.reviewedBy = reviewer._id;
    await kycRecord.save();

    // Update user
    const user = await ZenoPayUser.findById(kycRecord.userId);
    user.kycStatus = "approved";
    user.kycTier = 1;
    await user.save();

    res.json({
      success: true,
      message: "KYC approved successfully",
      kycId: kycRecord._id,
    });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({ success: false, message: "Failed to approve KYC" });
  }
};

/**
 * POST /admin/kyc/:kycId/reject - Reject KYC submission
 */
const adminRejectKYC = async (req, res) => {
  try {
    if (req.session.user?.role !== "Admin" && req.session.user?.Role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { rejectionReason } = req.body;
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const kycRecord = await KYC.findById(req.params.kycId);
    if (!kycRecord) {
      return res.status(404).json({ success: false, message: "KYC record not found" });
    }

    const reviewer = await resolveCurrentUser(req.session);

    // Update KYC record
    kycRecord.status = "rejected";
    kycRecord.rejectionReason = rejectionReason.slice(0, 500);
    kycRecord.reviewedAt = new Date();
    kycRecord.reviewedBy = reviewer._id;
    kycRecord.resubmissionAllowed = true;
    await kycRecord.save();

    // Update user
    const user = await ZenoPayUser.findById(kycRecord.userId);
    user.kycStatus = "rejected";
    user.kycTier = 0;
    await user.save();

    res.json({
      success: true,
      message: "KYC rejected. User can resubmit.",
      kycId: kycRecord._id,
    });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    res.status(500).json({ success: false, message: "Failed to reject KYC" });
  }
};

/**
 * GET /admin/kyc/:kycId/mark-review - Mark KYC as under review
 */
const adminMarkUnderReview = async (req, res) => {
  try {
    if (req.session.user?.role !== "Admin" && req.session.user?.Role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const kycRecord = await KYC.findById(req.params.kycId);
    if (!kycRecord) {
      return res.status(404).json({ success: false, message: "KYC record not found" });
    }

    const reviewer = await resolveCurrentUser(req.session);

    kycRecord.status = "under_review";
    kycRecord.reviewedBy = reviewer._id;
    await kycRecord.save();

    res.json({ success: true, message: "KYC marked as under review" });
  } catch (error) {
    console.error("Error marking KYC under review:", error);
    res.status(500).json({ success: false, message: "Failed to update KYC status" });
  }
};

module.exports = {
  getKYCStatus,
  getKYCStatusJson,
  getKYCForm,
  submitKYC,
  adminListKYC,
  adminViewKYC,
  adminApproveKYC,
  adminRejectKYC,
  adminMarkUnderReview,
};
