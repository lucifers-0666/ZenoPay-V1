const ContactSubmission = require("../../Models/ContactSubmission");
const Notification = require("../../Models/Notification");
const TransactionHistory = require("../../Models/TransactionHistory");
const Wallet = require("../../Models/Wallet");
const Plan = require("../../Models/Plan");
const PricingSettings = require("../../Models/PricingSettings");
const mongoose = require("mongoose");

const statusMapToUi = {
  new: "open",
  read: "open",
  in_progress: "in_progress",
  replied: "resolved",
  closed: "closed",
};

const statusMeta = {
  open: { label: "Open", icon: "fa-envelope-open", tone: "open" },
  in_progress: { label: "In Progress", icon: "fa-spinner", tone: "in-progress" },
  resolved: { label: "Resolved", icon: "fa-check-circle", tone: "resolved" },
  closed: { label: "Closed", icon: "fa-lock", tone: "closed" },
};

const priorityMeta = {
  urgent: { label: "Urgent", icon: "fa-fire", tone: "urgent" },
  high: { label: "High", icon: "fa-exclamation", tone: "high" },
  medium: { label: "Medium", icon: "fa-minus", tone: "medium" },
  low: { label: "Low", icon: "fa-arrow-down", tone: "low" },
};

const categoryMap = {
  "Payment Problems": "Payment",
  "Billing Question": "Payment",
  "Account Issues": "KYC",
  "Technical Support": "Technical",
  "Bug Report": "Technical",
  "Feature Request": "Technical",
  "Security Concern": "Technical",
  "General Inquiry": "Other",
  Other: "Other",
};

const truncate = (str, max = 40) => {
  const text = String(str || "");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

const hoursBetween = (a, b) => {
  if (!a || !b) return null;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  return diff / (1000 * 60 * 60);
};

const timeAgo = (value) => {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "N/A";
  const ms = Date.now() - dt.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const toTicketNo = (doc) => {
  const dt = new Date(doc.submitted_at || Date.now());
  const y = dt.getFullYear();
  const sfx = String(doc._id || "").slice(-4).toUpperCase();
  return `#TKT-${y}-${sfx}`;
};

const toINR = (value = 0) => `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

const formatAccountAge = (fromDate) => {
  const dt = new Date(fromDate);
  if (!fromDate || Number.isNaN(dt.getTime())) return "N/A";

  const now = new Date();
  let months = (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth());
  if (now.getDate() < dt.getDate()) months -= 1;

  if (months <= 0) {
    const days = Math.max(1, Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)));
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths
    ? `${years} year${years === 1 ? "" : "s"} ${remMonths} month${remMonths === 1 ? "" : "s"}`
    : `${years} year${years === 1 ? "" : "s"}`;
};

const titleCase = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Active";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const seedDefaultPlansIfEmpty = async () => {
  const count = await Plan.countDocuments();
  if (count > 0) return;

  await Plan.insertMany([
    {
      slug: "starter",
      name: "Starter",
      tagline: "For Individuals & Freelancers",
      description: "Start quickly with essential payment capabilities.",
      status: "active",
      monthlyPrice: 299,
      annualPrice: 2999,
      discount: 16.4,
      monthlyTxLimit: 200,
      dailyTransferLimit: 50000,
      apiCallsPerDay: 0,
      transactionFeeText: "From 2.5% + ₹3 per transaction",
      volumeLimitText: "Up to ₹5 lakhs/month",
      features: ["200 transactions per month", "Payment links & QR codes", "Basic analytics dashboard", "Email support (48-hour response)", "Standard payout (T+3 days)"],
      showOnPricingPage: true,
      highlightPopular: false,
      bestValue: false,
      sortOrder: 1,
      subscribers: 218,
    },
    {
      slug: "professional",
      name: "Professional",
      tagline: "For Small Businesses",
      description: "For growing teams that need APIs and deeper insights.",
      status: "active",
      monthlyPrice: 999,
      annualPrice: 9999,
      discount: 16.6,
      monthlyTxLimit: 1000,
      dailyTransferLimit: 200000,
      apiCallsPerDay: 1000,
      transactionFeeText: "From 2.0% + ₹2 per transaction",
      volumeLimitText: "Up to ₹25 lakhs/month",
      features: ["1,000 transactions per month", "API access (REST & Webhooks)", "Custom payment page branding", "Advanced analytics & reports", "Priority email (24-hour response)"],
      showOnPricingPage: true,
      highlightPopular: true,
      bestValue: false,
      sortOrder: 2,
      subscribers: 542,
    },
    {
      slug: "business",
      name: "Business",
      tagline: "For Established Companies",
      description: "High-volume plan with premium support and speed.",
      status: "beta",
      monthlyPrice: 2999,
      annualPrice: 29999,
      discount: 16.7,
      monthlyTxLimit: 0,
      dailyTransferLimit: 1000000,
      apiCallsPerDay: 10000,
      transactionFeeText: "From 1.75% + ₹2 per transaction",
      volumeLimitText: "Up to ₹1 crore/month",
      features: ["Unlimited transactions", "Dedicated account manager", "Same-day payouts (T+1)", "Advanced fraud prevention", "Custom reporting & analytics"],
      showOnPricingPage: true,
      highlightPopular: false,
      bestValue: true,
      sortOrder: 3,
      subscribers: 97,
    },
    {
      slug: "enterprise",
      name: "Enterprise",
      tagline: "For Large Organizations",
      description: "Custom pricing and white-glove support.",
      status: "active",
      monthlyPrice: 0,
      annualPrice: 0,
      discount: 0,
      monthlyTxLimit: 0,
      dailyTransferLimit: 0,
      apiCallsPerDay: 0,
      transactionFeeText: "Custom rates (as low as 1.2%)",
      volumeLimitText: "Unlimited volume",
      features: ["Unlimited transactions", "24/7 premium support", "Dedicated technical team", "Custom API development", "SLA guarantees"],
      showOnPricingPage: true,
      highlightPopular: false,
      bestValue: false,
      sortOrder: 4,
      subscribers: 15,
    },
  ]);
};

const normalizeTicket = (doc) => {
  const mappedStatus = statusMapToUi[doc.status] || "open";
  const category = categoryMap[doc.subject] || "Other";
  const pr = String(doc.priority || "medium").toLowerCase();

  return {
    id: String(doc._id),
    ticketNo: toTicketNo(doc),
    userName: doc.name || "Unknown",
    userEmail: doc.email || "no-email@zenopay.com",
    avatarInitial: (doc.name || "U").charAt(0).toUpperCase(),
    subject: truncate(doc.message || doc.subject || "No subject", 40),
    subjectFull: doc.message || doc.subject || "No subject",
    category,
    priority: pr,
    priorityMeta: priorityMeta[pr] || priorityMeta.medium,
    status: mappedStatus,
    statusMeta: statusMeta[mappedStatus] || statusMeta.open,
    lastUpdatedAgo: timeAgo(doc.updated_at || doc.submitted_at),
    updatedAt: doc.updated_at || doc.submitted_at,
    assigned: doc.assigned_to
      ? {
          name: doc.assigned_to.FullName || "Agent",
          initial: (doc.assigned_to.FullName || "A").charAt(0).toUpperCase(),
        }
      : null,
    createdAt: doc.submitted_at,
    replyMessage: doc.reply_message || "",
    replyAt: doc.replied_at || null,
    attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
  };
};

const getSupportTickets = async (req, res) => {
  try {
    const docs = await ContactSubmission.find({})
      .sort({ updated_at: -1, submitted_at: -1 })
      .limit(200)
      .populate("assigned_to", "FullName Email")
      .lean();

    const tickets = docs.map(normalizeTicket);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === "open").length;
    const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
    const urgentTickets = tickets.filter((t) => t.priority === "urgent").length;

    const responded = docs
      .map((d) => hoursBetween(d.submitted_at, d.replied_at))
      .filter((h) => h !== null);

    const avgResponseHours = responded.length
      ? `${(responded.reduce((a, b) => a + b, 0) / responded.length).toFixed(1)} hours`
      : "N/A";

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const resolvedToday = docs.filter((d) => {
      const dt = d.updated_at ? new Date(d.updated_at) : null;
      return dt && dt >= startOfDay && ["replied", "closed"].includes(d.status);
    }).length;

    res.render("admin/support/admin-support-tickets", {
      pageTitle: "Support Tickets",
      currentPage: "support",
      adminPage: "support",
      hideBreadcrumb: true,
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Support", url: "/admin/support" },
        { name: "Tickets", url: "/admin/support" },
      ],
      stats: {
        totalTickets,
        openTickets,
        inProgressTickets,
        urgentTickets,
        avgResponseHours,
        resolvedToday,
      },
      tickets,
    });
  } catch (error) {
    console.error("Admin support tickets error:", error);
    res.status(500).send("Error loading support tickets");
  }
};

const getSupportTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let doc = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await ContactSubmission.findById(id)
        .populate("assigned_to", "FullName Email")
        .populate("replied_by", "FullName Email")
        .populate("user_id", "FullName Email Mobile PhoneNumber RegistrationDate AccountStatus KYCStatus")
        .lean();
    }

    if (!doc && /^#?TKT-/i.test(String(id || ""))) {
      const normalizedTicketNo = String(id).startsWith("#") ? String(id).toUpperCase() : `#${String(id).toUpperCase()}`;
      const candidates = await ContactSubmission.find({})
        .sort({ submitted_at: -1 })
        .limit(500)
        .populate("assigned_to", "FullName Email")
        .populate("replied_by", "FullName Email")
        .populate("user_id", "FullName Email Mobile PhoneNumber RegistrationDate AccountStatus KYCStatus")
        .lean();

      doc = candidates.find((item) => toTicketNo(item).toUpperCase() === normalizedTicketNo) || null;
    }

    if (!doc) {
      return res.status(404).render("admin/support/admin-ticket-details", {
        pageTitle: "Support Ticket Not Found",
        currentPage: "support",
        adminPage: "support",
        hideBreadcrumb: true,
        admin: req.session.user,
        breadcrumb: [
          { name: "Admin", url: "/admin/dashboard" },
          { name: "Support", url: "/admin/support" },
          { name: "Tickets", url: "/admin/support" },
        ],
        details: null,
        errorMessage: "Ticket not found",
      });
    }

    const t = normalizeTicket(doc);

    const thread = [
      {
        type: "user",
        name: doc.name,
        email: doc.email,
        avatarInitial: (doc.name || "U").charAt(0).toUpperCase(),
        timestamp: new Date(doc.submitted_at).toLocaleString("en-IN"),
        body: doc.message,
        attachments: t.attachments.map((a) => ({
          name: a.originalname || a.filename || "attachment",
          size: a.size ? `${Math.max(1, Math.round(a.size / 1024))} KB` : "file",
        })),
      },
    ];

    if (doc.assigned_to) {
      thread.push({
        type: "system",
        text: `Ticket assigned to ${doc.assigned_to.FullName || "Admin"} - ${new Date(doc.updated_at || Date.now()).toLocaleString("en-IN")}`,
      });
    }

    if (doc.reply_message) {
      thread.push({
        type: "admin",
        name: doc.replied_by?.FullName || "ZenoPay Support",
        email: doc.replied_by?.Email || "support@zenopay.com",
        avatarInitial: (doc.replied_by?.FullName || "S").charAt(0).toUpperCase(),
        timestamp: doc.replied_at ? new Date(doc.replied_at).toLocaleString("en-IN") : "",
        body: doc.reply_message,
      });
    }

    const userObjectId = doc.user_id?._id || null;
    const userName = doc.user_id?.FullName || doc.name || "";

    const relatedQuery = {
      $or: [
        ...(userName ? [{ SenderHolderName: { $regex: userName, $options: "i" } }] : []),
        ...(userName ? [{ ReceiverHolderName: { $regex: userName, $options: "i" } }] : []),
      ],
    };

    const hasRelatedQuery = relatedQuery.$or.length > 0;

    const relatedTransactions = hasRelatedQuery
      ? await TransactionHistory.find(relatedQuery)
          .sort({ TransactionTime: -1 })
          .limit(5)
          .lean()
      : [];

    const totalTransactionCount = hasRelatedQuery
      ? await TransactionHistory.countDocuments(relatedQuery)
      : 0;

    const wallet = userObjectId ? await Wallet.findOne({ userId: userObjectId }).lean() : null;
    const walletBalance = Number(wallet?.balance || 0);

    const joinedDate = doc.user_id?.RegistrationDate || null;

    const details = {
      id: t.id,
      ticketNo: t.ticketNo,
      subject: doc.subject || "Support Request",
      status: t.status,
      statusMeta: t.statusMeta,
      priority: t.priority,
      priorityMeta: t.priorityMeta,
      category: t.category,
      createdAt: new Date(doc.submitted_at).toLocaleString("en-IN"),
      createdAgo: timeAgo(doc.submitted_at),
      updatedAt: new Date(doc.updated_at || doc.submitted_at).toLocaleString("en-IN"),
      lastResponse: doc.replied_at ? timeAgo(doc.replied_at) : "Awaiting response",
      assignedAgent: doc.assigned_to
        ? {
            name: doc.assigned_to.FullName || "Agent",
            email: doc.assigned_to.Email || "",
          }
        : null,
      user: {
        id: userObjectId ? String(userObjectId) : (doc.user_id ? String(doc.user_id) : null),
        name: doc.name,
        email: doc.email,
        phone: doc.phone || doc.user_id?.PhoneNumber || doc.user_id?.Mobile || "Not provided",
        avatarInitial: (doc.name || "U").charAt(0).toUpperCase(),
        accountAge: formatAccountAge(joinedDate),
        kycStatus: doc.user_id?.KYCStatus ? String(doc.user_id.KYCStatus).replace(/_/g, " ") : "Unknown",
        accountStatus: doc.user_id?.AccountStatus || "Active",
        joinedAt: joinedDate
          ? new Date(joinedDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        totalTransactions: totalTransactionCount,
        walletBalance: `₹${walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      thread,
      relatedTransactions: relatedTransactions.map((tx, idx) => ({
        id: tx.TransactionID || idx + 1,
        amount: `₹${Number(tx.Amount || 0).toFixed(2)}`,
        description: tx.Description || "Payment transaction",
        date: new Date(tx.TransactionTime || Date.now()).toLocaleDateString("en-IN"),
        status: tx.Status || "success",
      })),
      metadata: {
        responseCount: thread.filter((x) => x.type === "admin").length,
      },
    };

    res.render("admin/support/admin-ticket-details", {
      pageTitle: `${details.ticketNo} - Support Ticket`,
      currentPage: "support",
      adminPage: "support",
      hideBreadcrumb: true,
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Support", url: "/admin/support" },
        { name: "Tickets", url: "/admin/support" },
        { name: details.ticketNo, url: `/admin/support/${encodeURIComponent(details.id)}` },
      ],
      details,
      errorMessage: null,
    });
  } catch (error) {
    console.error("Admin support ticket details error:", error);
    res.status(500).render("admin/support/admin-ticket-details", {
      pageTitle: "Support Ticket Error",
      currentPage: "support",
      adminPage: "support",
      hideBreadcrumb: true,
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Support", url: "/admin/support" },
        { name: "Tickets", url: "/admin/support" },
      ],
      details: null,
      errorMessage: "Error loading support ticket details",
    });
  }
};

const getNotificationsCenter = async (req, res) => {
  try {
    const latest = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const history = latest.map((n, idx) => ({
      id: String(n._id),
      title: n.Title,
      audience: idx % 4 === 0 ? "Verified Users" : "All Users",
      channels: ["In-App", idx % 2 ? "Email" : "SMS"],
      sentAt: new Date(n.createdAt || Date.now()).toLocaleString("en-IN"),
      delivered: `${1200 + idx * 11} / ${1300 + idx * 13}`,
      status: idx % 7 === 0 ? "Failed" : "Sent",
    }));

    history.unshift({
      id: "scheduled-1",
      title: "Scheduled maintenance notice",
      audience: "All Users",
      channels: ["In-App", "Email"],
      sentAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString("en-IN"),
      delivered: "-",
      status: "Scheduled",
    });

    res.locals.adminPage = "notifications";
    res.render("admin/notifications/admin-notifications", {
      pageTitle: "Notifications Center",
      currentPage: "notifications",
      page: "notifications",
      adminPage: "notifications",
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Notifications Center", url: "/admin/notifications" },
      ],
      history,
    });
  } catch (error) {
    console.error("Admin notifications center error:", error);
    res.status(500).send("Error loading notifications center");
  }
};

const getPricingManagement = async (req, res) => {
  try {
    await seedDefaultPlansIfEmpty();

    const [settings, planDocs] = await Promise.all([
      PricingSettings.getSettings(),
      Plan.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    ]);

    const plans = planDocs.map((plan) => {
      const monthly = Number(plan.monthlyPrice || 0);
      const yearly = Number(plan.annualPrice || 0);
      const subscribers = Number(plan.subscribers || 0);

      return {
        _id: plan._id,
        id: String(plan._id),
        slug: plan.slug,
        name: plan.name,
        tagline: plan.tagline || "",
        description: plan.description || "",
        status: titleCase(plan.status),
        monthly,
        yearly,
        monthlyPrice: monthly,
        annualPrice: yearly,
        discount: Number(plan.discount || 0),
        monthlyTxLimit: Number(plan.monthlyTxLimit || 0),
        dailyTransferLimit: Number(plan.dailyTransferLimit || 0),
        apiCallsPerDay: Number(plan.apiCallsPerDay || 0),
        subscribers,
        revenue: toINR(monthly * subscribers),
        features: Array.isArray(plan.features) ? plan.features : [],
        highlighted: !!plan.highlightPopular || !!plan.bestValue,
        highlightPopular: !!plan.highlightPopular,
        bestValue: !!plan.bestValue,
        showOnPricingPage: plan.showOnPricingPage !== false,
      };
    });

    const mrrValue = plans.reduce((sum, plan) => sum + Number(plan.monthlyPrice || 0) * Number(plan.subscribers || 0), 0);
    const arrValue = mrrValue * 12;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = planDocs.filter((plan) => plan.createdAt && new Date(plan.createdAt) >= startOfMonth).length;

    const chartData = Array.isArray(settings.revenueChart) && settings.revenueChart.length
      ? settings.revenueChart
      : [
          Math.round(mrrValue * 0.72),
          Math.round(mrrValue * 0.81),
          Math.round(mrrValue * 0.88),
          Math.round(mrrValue * 0.93),
          Math.round(mrrValue * 0.97),
          Math.round(mrrValue),
        ];

    res.locals.adminPage = "pricing";
    res.render("admin/settings/admin-pricing", {
      pageTitle: "Pricing Management",
      currentPage: "pricing",
      page: "pricing",
      adminPage: "pricing",
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Pricing Management", url: "/admin/pricing" },
      ],
      plans,
      gst: {
        enabled: !!settings.applyGST,
        rate: Number(settings.gstRate || 18),
        gstNumber: settings.gstRegNumber || "",
        annualDiscount: Number(settings.annualDiscount || 0),
        studentDiscountEnabled: !!settings.studentDiscountEnabled,
        studentDiscount: Number(settings.studentDiscount || 0),
      },
      revenue: {
        mrr: toINR(mrrValue),
        arr: toINR(arrValue),
        churn: `${Number(settings.churnRate || 2.8).toFixed(1)}%`,
        newThisMonth,
        chart: chartData,
        chartData,
      },
    });
  } catch (error) {
    console.error("Admin pricing management error:", error);
    res.status(500).send("Error loading pricing management");
  }
};

const updatePricingPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const update = {};

    if (typeof payload.name === "string") update.name = payload.name.trim();
    if (typeof payload.tagline === "string") update.tagline = payload.tagline.trim();
    if (typeof payload.description === "string") update.description = payload.description.trim();

    if (payload.monthlyPrice !== undefined) {
      const value = Number(payload.monthlyPrice);
      if (Number.isFinite(value)) update.monthlyPrice = Math.max(0, value);
    }

    if (payload.annualPrice !== undefined) {
      const value = Number(payload.annualPrice);
      if (Number.isFinite(value)) update.annualPrice = Math.max(0, value);
    }

    if (payload.discount !== undefined) {
      const value = Number(payload.discount);
      if (Number.isFinite(value)) update.discount = Math.max(0, Math.min(100, value));
    }

    if (payload.monthlyTxLimit !== undefined) {
      const value = Number(payload.monthlyTxLimit);
      if (Number.isFinite(value)) update.monthlyTxLimit = Math.max(0, Math.trunc(value));
    }

    if (payload.dailyTransferLimit !== undefined) {
      const value = Number(payload.dailyTransferLimit);
      if (Number.isFinite(value)) update.dailyTransferLimit = Math.max(0, value);
    }

    if (payload.apiCallsPerDay !== undefined) {
      const value = Number(payload.apiCallsPerDay);
      if (Number.isFinite(value)) update.apiCallsPerDay = Math.max(0, Math.trunc(value));
    }

    if (Array.isArray(payload.features)) {
      update.features = payload.features.map((feature) => String(feature || "").trim()).filter(Boolean);
    } else if (typeof payload.features === "string") {
      update.features = payload.features.split(/[\n,]/).map((feature) => feature.trim()).filter(Boolean);
    }

    if (typeof payload.showOnPricingPage === "boolean") update.showOnPricingPage = payload.showOnPricingPage;
    if (typeof payload.highlightPopular === "boolean") update.highlightPopular = payload.highlightPopular;
    if (typeof payload.bestValue === "boolean") update.bestValue = payload.bestValue;

    if (typeof payload.status === "string") {
      const status = payload.status.trim().toLowerCase();
      if (["active", "beta", "archived"].includes(status)) {
        update.status = status;
      }
    }

    const updated = await Plan.findByIdAndUpdate(id, update, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    return res.json({ success: true, plan: updated });
  } catch (error) {
    console.error("Admin update pricing plan error:", error);
    return res.status(500).json({ success: false, error: "Unable to update plan" });
  }
};

const updatePricingSettings = async (req, res) => {
  try {
    const settings = await PricingSettings.getSettings();
    const payload = req.body || {};

    if (typeof payload.enabled === "boolean") settings.applyGST = payload.enabled;

    if (payload.rate !== undefined) {
      const value = Number(payload.rate);
      if (Number.isFinite(value)) settings.gstRate = Math.max(0, Math.min(100, value));
    }

    if (typeof payload.gstNumber === "string") {
      settings.gstRegNumber = payload.gstNumber.trim().toUpperCase();
    }

    if (payload.annualDiscount !== undefined) {
      const value = Number(payload.annualDiscount);
      if (Number.isFinite(value)) settings.annualDiscount = Math.max(0, Math.min(100, value));
    }

    if (typeof payload.studentDiscountEnabled === "boolean") {
      settings.studentDiscountEnabled = payload.studentDiscountEnabled;
    }

    if (payload.studentDiscount !== undefined) {
      const value = Number(payload.studentDiscount);
      if (Number.isFinite(value)) settings.studentDiscount = Math.max(0, Math.min(100, value));
    }

    await settings.save();

    return res.json({ success: true, settings });
  } catch (error) {
    console.error("Admin update pricing settings error:", error);
    return res.status(500).json({ success: false, error: "Unable to save settings" });
  }
};

const archivePricingPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Plan.findByIdAndUpdate(
      id,
      { status: "archived", showOnPricingPage: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    return res.json({ success: true, plan: updated });
  } catch (error) {
    console.error("Admin archive pricing plan error:", error);
    return res.status(500).json({ success: false, error: "Unable to archive plan" });
  }
};

const togglePricingPlanVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { show } = req.body || {};

    if (typeof show !== "boolean") {
      return res.status(400).json({ success: false, error: "show must be a boolean" });
    }

    const updated = await Plan.findByIdAndUpdate(
      id,
      { showOnPricingPage: show },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    return res.json({ success: true, plan: updated });
  } catch (error) {
    console.error("Admin toggle pricing visibility error:", error);
    return res.status(500).json({ success: false, error: "Unable to update visibility" });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const now = Date.now();
    const logs = [
      {
        id: "log-1",
        timestamp: new Date(now - 2 * 60 * 1000),
        adminName: "System Administrator",
        adminInitial: "S",
        action: "Approve",
        actionText: "Approved KYC for user #1042",
        resource: "User #1042",
        ip: "122.176.44.11",
        severity: "info",
      },
      {
        id: "log-2",
        timestamp: new Date(now - 21 * 60 * 1000),
        adminName: "Payments Lead",
        adminInitial: "P",
        action: "Export",
        actionText: "Exported 1,200 transaction records",
        resource: "Transactions #batch-44",
        ip: "10.0.2.14",
        severity: "warning",
      },
      {
        id: "log-3",
        timestamp: new Date(now - 65 * 60 * 1000),
        adminName: "Ops Admin",
        adminInitial: "O",
        action: "Delete",
        actionText: "Deleted 12 stale test accounts",
        resource: "Users #bulk-op",
        ip: "117.201.6.8",
        severity: "critical",
      },
      {
        id: "log-4",
        timestamp: new Date(now - 130 * 60 * 1000),
        adminName: "Risk Manager",
        adminInitial: "R",
        action: "Update",
        actionText: "Updated risk policy threshold",
        resource: "Config #risk-policy",
        ip: "117.201.6.8",
        severity: "info",
      },
    ];

    const flagged = logs.filter((l) => l.severity !== "info");

    res.locals.adminPage = "audit-logs";
    res.render("admin/audit-logs/admin-audit-logs", {
      pageTitle: "Audit Logs",
      currentPage: "audit-logs",
      page: "audit-logs",
      adminPage: "audit-logs",
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Audit Logs", url: "/admin/audit-logs" },
      ],
      stats: {
        totalToday: 142,
        activeAdmins: 7,
        flagged: flagged.length,
        lastAction: "2 minutes ago",
      },
      logs: logs.map((l) => ({
        ...l,
        timeLabel: l.timestamp.toLocaleString("en-IN"),
      })),
      flagged,
    });
  } catch (error) {
    console.error("Admin audit logs error:", error);
    res.status(500).send("Error loading audit logs");
  }
};

module.exports = {
  getSupportTickets,
  getSupportTicketDetails,
  getNotificationsCenter,
  getPricingManagement,
  updatePricingPlan,
  updatePricingSettings,
  archivePricingPlan,
  togglePricingPlanVisibility,
  getAuditLogs,
};
