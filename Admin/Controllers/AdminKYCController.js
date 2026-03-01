const ZenoPayUser = require("../../Models/ZenoPayUser");
const Statement = require("../../Models/Statement");
const mongoose = require("mongoose");

const normalizeStatus = (user) => {
  const raw = (user.KYCStatus || "not_started").toLowerCase();

  if (raw === "approved" || raw === "verified") return "approved";
  if (raw === "rejected" && user.KYCResubmissionRequested) return "resubmission";
  if (raw === "rejected") return "rejected";
  return "pending";
};

const getDocumentKinds = (user) => {
  const docs = user.KYCDocuments || {};
  const collect = [docs.identityType, docs.addressType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const kinds = new Set();
  if (collect.includes("aadhaar") || collect.includes("aadhar")) kinds.add("aadhaar");
  if (collect.includes("pan")) kinds.add("pan");
  if (collect.includes("passport")) kinds.add("passport");
  if (collect.includes("driving") || collect.includes("licence") || collect.includes("license")) {
    kinds.add("driving");
  }

  if (docs.identityFront || docs.identityBack) {
    if (!kinds.size) kinds.add("id");
  }

  return Array.from(kinds);
};

const getDocumentBadge = (kinds) => {
  const hasAadhaar = kinds.includes("aadhaar");
  const hasPan = kinds.includes("pan");
  const hasPassport = kinds.includes("passport");
  const hasDriving = kinds.includes("driving");

  if ([hasAadhaar, hasPan, hasPassport, hasDriving].filter(Boolean).length >= 3) {
    return { label: "All Documents", tone: "green" };
  }

  if (hasAadhaar && hasPan) {
    return { label: "Aadhaar + PAN", tone: "slate" };
  }

  if (hasPan && !hasAadhaar) {
    return { label: "PAN Only", tone: "amber" };
  }

  if (hasAadhaar) return { label: "Aadhaar", tone: "slate" };
  if (hasPassport) return { label: "Passport", tone: "slate" };
  if (hasDriving) return { label: "Driving Licence", tone: "slate" };

  return { label: "Document Submitted", tone: "slate" };
};

const computeRiskScore = (user, kinds, normalizedStatus) => {
  let score = 45;

  if (normalizedStatus === "approved") score = 18;
  if (normalizedStatus === "rejected") score = 82;
  if (normalizedStatus === "resubmission") score = 64;

  if (kinds.length >= 2) score -= 8;
  if (!user.KYCDocuments?.identityBack) score += 6;

  const seed = String(user.ZenoPayID || user._id || "U0").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 12;
  score += seed - 6;

  return Math.max(5, Math.min(95, score));
};

const buildSubmission = (user) => {
  const normalizedStatus = normalizeStatus(user);
  const kinds = getDocumentKinds(user);
  const docBadge = getDocumentBadge(kinds);
  const riskScore = computeRiskScore(user, kinds, normalizedStatus);

  const submittedAt = user.KYCSubmittedAt || user.RegistrationDate || new Date();
  const submittedDate = new Date(submittedAt);
  const daysAgo = Math.max(0, Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)));

  const docs = user.KYCDocuments || {};
  const flags = [];
  if (!docs.identityBack) flags.push("Back side of ID is missing");
  if (!docs.addressDocument) flags.push("Address proof document missing");
  if (riskScore > 70) flags.push("High automated risk score");

  return {
    userId: user._id?.toString?.() || "",
    zenoPayId: user.ZenoPayID,
    fullName: user.FullName || "Unknown User",
    email: user.Email || "no-email@zenopay.com",
    avatarInitial: (user.FullName || "U").trim().charAt(0).toUpperCase(),
    documentType: docBadge.label,
    documentTone: docBadge.tone,
    documentKinds: kinds,
    submittedAt: submittedDate,
    submittedFormatted: submittedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    daysAgo,
    riskScore,
    status: normalizedStatus,
    kycStatusRaw: user.KYCStatus || "pending",
    docs: {
      identityFront: docs.identityFront || null,
      identityBack: docs.identityBack || null,
      addressDocument: docs.addressDocument || null,
      selfie: docs.selfie || null,
      identityType: docs.identityType || "N/A",
      addressType: docs.addressType || "N/A",
    },
    extracted: {
      name: user.FullName || "N/A",
      dob: user.DOB ? new Date(user.DOB).toLocaleDateString("en-IN") : "N/A",
      documentNumber: user.AadharNumber || user.PANCard || "Not captured",
    },
    riskFlags: flags,
    adminNotes: user.KYCRejectionReason || "",
  };
};

const toDateLabel = (value) => {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateTimeLabel = (value) => {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getVerificationLevel = (submission) => {
  if (submission.status === "approved") return "Full";
  if (submission.documentKinds.length >= 2) return "Basic";
  return "None";
};

const getRiskFlagObjects = (submission) => {
  const flags = [];

  if (submission.riskScore > 70) {
    flags.push({
      severity: "high",
      icon: "fa-flag",
      text: "Name mismatch detected",
    });
  }

  if (!submission.docs?.addressDocument) {
    flags.push({
      severity: "medium",
      icon: "fa-exclamation-triangle",
      text: "Address document not verified",
    });
  }

  if (submission.documentKinds.includes("pan")) {
    flags.push({
      severity: "low",
      icon: "fa-check-circle",
      text: "PAN verified",
    });
  }

  if (!flags.length) {
    flags.push({
      severity: "low",
      icon: "fa-check-circle",
      text: "No major risk anomalies found",
    });
  }

  return flags;
};

const getTimeline = (user) => {
  const items = [
    {
      date: user.RegistrationDate,
      action: "Account created",
      actor: "System",
    },
    {
      date: user.KYCSubmittedAt,
      action: "KYC submitted",
      actor: user.FullName || "User",
    },
    {
      date: user.KYCRejectedAt,
      action: user.KYCResubmissionRequested ? "Resubmission requested" : "KYC rejected",
      actor: "Admin",
    },
    {
      date: user.KYCVerifiedAt,
      action: "KYC approved",
      actor: "Admin",
    },
    {
      date: user.KYCResubmissionRequestedAt,
      action: "Resubmission reminder sent",
      actor: "Admin",
    },
  ]
    .filter((x) => x.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map((x) => ({
      timestamp: toDateTimeLabel(x.date),
      action: x.action,
      actor: x.actor,
    }));

  return items;
};

const getDocumentTabs = (submission) => {
  const docs = submission.docs || {};
  return [
    { key: "aadhaar-front", label: "Aadhaar Front", src: docs.identityFront || null },
    { key: "aadhaar-back", label: "Aadhaar Back", src: docs.identityBack || null },
    { key: "pan-card", label: "PAN Card", src: docs.addressDocument || null },
    { key: "selfie", label: "Selfie", src: docs.selfie || null },
  ];
};

const buildExtractedComparisonRows = (user, submission) => {
  const extractedName = submission.extracted?.name || "N/A";
  const extractedDob = submission.extracted?.dob || "N/A";
  const extractedId = submission.extracted?.documentNumber || "N/A";
  const extractedAddress = user.Address || "N/A";

  const profileName = user.FullName || "N/A";
  const profileDob = user.DOB ? toDateLabel(user.DOB) : "N/A";
  const profileId = user.AadharNumber || user.PANCard || "N/A";
  const profileAddress = user.Address || "N/A";

  const compare = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

  return [
    { field: "Full Name", documentValue: extractedName, userValue: profileName, match: compare(extractedName, profileName) },
    { field: "Date of Birth", documentValue: extractedDob, userValue: profileDob, match: compare(extractedDob, profileDob) },
    { field: "ID Number", documentValue: extractedId, userValue: profileId, match: compare(extractedId, profileId) },
    { field: "Address", documentValue: extractedAddress, userValue: profileAddress, match: compare(extractedAddress, profileAddress) },
  ];
};

const getKYCManagement = async (req, res) => {
  try {
    const users = await ZenoPayUser.find({
      KYCStatus: { $in: ["pending", "approved", "verified", "rejected"] },
      KYCDocuments: { $exists: true },
    })
      .sort({ KYCSubmittedAt: -1, RegistrationDate: -1 })
      .lean();

    const submissions = users.map(buildSubmission);

    const stats = {
      total: submissions.length,
      pending: submissions.filter((item) => item.status === "pending").length,
      approved: submissions.filter((item) => item.status === "approved").length,
      rejected: submissions.filter((item) => item.status === "rejected").length,
      resubmission: submissions.filter((item) => item.status === "resubmission").length,
    };

    res.render("admin/kyc/admin-kyc-management", {
      pageTitle: "KYC Management",
      currentPage: "kyc",
      adminPage: "kyc",
      admin: req.session.user,
      breadcrumb: [
        { name: "KYC", url: "/admin/kyc" },
        { name: "Management", url: "/admin/kyc" },
      ],
      stats,
      submissions,
    });
  } catch (error) {
    console.error("Admin KYC management error:", error);
    res.status(500).send("Error loading KYC management page");
  }
};

const getKYCDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const query = [{ ZenoPayID: id }];

    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id });
    }

    const user = await ZenoPayUser.findOne({
      $or: query,
      KYCDocuments: { $exists: true },
    }).lean();

    if (!user) {
      return res.status(404).send("KYC case not found");
    }

    const submission = buildSubmission(user);
    const latestStatement = await Statement.findOne({ user_id: user.ZenoPayID })
      .sort({ year: -1, month: -1 })
      .lean();

    const details = {
      ...submission,
      phone: user.Mobile || "N/A",
      accountCreated: toDateLabel(user.RegistrationDate),
      verificationLevel: getVerificationLevel(submission),
      totalTransactions: latestStatement?.total_transactions || 0,
      lastLogin: user.PasswordChangeDate ? toDateLabel(user.PasswordChangeDate) : "N/A",
      userProvided: {
        name: user.FullName || "N/A",
        dob: user.DOB ? toDateLabel(user.DOB) : "N/A",
        idNumber: user.AadharNumber || user.PANCard || "N/A",
        address: user.Address || "N/A",
      },
      documentTabs: getDocumentTabs(submission),
      extractedRows: buildExtractedComparisonRows(user, submission),
      riskFlagsDetailed: getRiskFlagObjects(submission),
      timeline: getTimeline(user),
    };

    res.render("admin/kyc/admin-kyc-details", {
      pageTitle: `${details.fullName} - KYC Details`,
      currentPage: "kyc",
      adminPage: "kyc",
      hideBreadcrumb: true,
      admin: req.session.user,
      breadcrumb: [
        { name: "KYC Management", url: "/admin/kyc" },
        { name: details.fullName, url: `/admin/kyc/${encodeURIComponent(details.zenoPayId)}` },
      ],
      details,
    });
  } catch (error) {
    console.error("Admin KYC details error:", error);
    res.status(500).send("Error loading KYC details page");
  }
};

const approveSubmission = async (req, res) => {
  try {
    const { zenoPayId } = req.params;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.KYCStatus = "approved";
    user.KYCVerifiedAt = new Date();
    user.KYCRejectedAt = null;
    user.KYCRejectionReason = null;
    user.KYCResubmissionRequested = false;
    user.KYCResubmissionRequestedAt = null;
    await user.save();

    return res.json({ success: true, message: "KYC approved successfully" });
  } catch (error) {
    console.error("Admin approve KYC error:", error);
    return res.status(500).json({ success: false, message: "Failed to approve KYC" });
  }
};

const rejectSubmission = async (req, res) => {
  try {
    const { zenoPayId } = req.params;
    const reason = (req.body?.reason || "Rejected by admin").toString().trim();

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.KYCStatus = "rejected";
    user.KYCRejectedAt = new Date();
    user.KYCRejectionReason = reason;
    user.KYCResubmissionRequested = false;
    user.KYCResubmissionRequestedAt = null;
    await user.save();

    return res.json({ success: true, message: "KYC rejected" });
  } catch (error) {
    console.error("Admin reject KYC error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject KYC" });
  }
};

const requestResubmission = async (req, res) => {
  try {
    const { zenoPayId } = req.params;
    const reason = (req.body?.reason || "Please resubmit clear and complete documents").toString().trim();

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.KYCStatus = "rejected";
    user.KYCRejectedAt = new Date();
    user.KYCRejectionReason = reason;
    user.KYCResubmissionRequested = true;
    user.KYCResubmissionRequestedAt = new Date();
    await user.save();

    return res.json({ success: true, message: "Resubmission requested" });
  } catch (error) {
    console.error("Admin request resubmission error:", error);
    return res.status(500).json({ success: false, message: "Failed to request resubmission" });
  }
};

module.exports = {
  getKYCManagement,
  getKYCDetails,
  approveSubmission,
  rejectSubmission,
  requestResubmission,
};
