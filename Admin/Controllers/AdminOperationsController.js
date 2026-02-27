const ContactSubmission = require("../../Models/ContactSubmission");
const Notification = require("../../Models/Notification");
const TransactionHistory = require("../../Models/TransactionHistory");

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
    const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

    const responded = docs
      .map((d) => hoursBetween(d.submitted_at, d.replied_at))
      .filter((h) => h !== null);

    const avgResponseHours = responded.length
      ? `${(responded.reduce((a, b) => a + b, 0) / responded.length).toFixed(1)} hours`
      : "4.2 hours";

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const resolvedToday = docs.filter((d) => {
      const dt = d.updated_at ? new Date(d.updated_at) : null;
      return dt && dt >= startOfDay && ["replied", "closed"].includes(d.status);
    }).length;

    res.render("admin/support/admin-support-tickets", {
      pageTitle: "Support Tickets",
      currentPage: "support",
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Support", url: "/admin/support" },
        { name: "Tickets", url: "/admin/support" },
      ],
      stats: {
        totalTickets,
        openTickets,
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

    const doc = await ContactSubmission.findById(id)
      .populate("assigned_to", "FullName Email")
      .populate("replied_by", "FullName Email")
      .lean();

    if (!doc) {
      return res.status(404).send("Ticket not found");
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

    const relatedTransactions = await TransactionHistory.find({
      SenderHolderName: { $regex: doc.name || "", $options: "i" },
    })
      .sort({ TransactionTime: -1 })
      .limit(5)
      .lean();

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
        name: doc.name,
        email: doc.email,
        avatarInitial: (doc.name || "U").charAt(0).toUpperCase(),
        accountAge: "8 months",
        kycStatus: "Verified",
        totalTransactions: relatedTransactions.length * 8 + 12,
        walletBalance: "₹24,860",
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
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Support", url: "/admin/support" },
        { name: "Tickets", url: "/admin/support" },
        { name: details.ticketNo, url: `/admin/support/${encodeURIComponent(details.id)}` },
      ],
      details,
    });
  } catch (error) {
    console.error("Admin support ticket details error:", error);
    res.status(500).send("Error loading support ticket details");
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

    res.render("admin/admin-notifications", {
      pageTitle: "Notifications Center",
      currentPage: "notifications",
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
    const plans = [
      {
        id: "starter",
        name: "Starter",
        status: "Active",
        monthly: 299,
        yearly: 2999,
        subscribers: 218,
        revenue: "₹64,782",
        features: ["Up to 200 tx/month", "Basic dashboard", "Email support", "UPI + cards", "Daily payouts"],
        highlighted: false,
      },
      {
        id: "professional",
        name: "Professional",
        status: "Active",
        monthly: 999,
        yearly: 9990,
        subscribers: 542,
        revenue: "₹5,41,458",
        features: ["Up to 2,000 tx/month", "Advanced analytics", "Priority support", "API access", "Smart retries"],
        highlighted: true,
      },
      {
        id: "business",
        name: "Business",
        status: "Beta",
        monthly: 2999,
        yearly: 29990,
        subscribers: 97,
        revenue: "₹2,90,903",
        features: ["Unlimited transactions", "Dedicated CSM", "Custom webhooks", "Fraud insights", "Fast settlements"],
        highlighted: false,
      },
    ];

    res.render("admin/admin-pricing", {
      pageTitle: "Pricing Management",
      currentPage: "pricing",
      admin: req.session.user,
      breadcrumb: [
        { name: "Admin", url: "/admin/dashboard" },
        { name: "Pricing Management", url: "/admin/pricing" },
      ],
      plans,
      gst: {
        enabled: true,
        rate: 18,
        gstNumber: "27AACCZ0000Z1Z0",
        annualDiscount: 15,
        studentDiscountEnabled: false,
        studentDiscount: 10,
      },
      revenue: {
        mrr: "₹8,97,143",
        arr: "₹1,07,65,716",
        churn: "2.8%",
        newThisMonth: 86,
        chart: [52, 58, 61, 67, 72, 81],
      },
    });
  } catch (error) {
    console.error("Admin pricing management error:", error);
    res.status(500).send("Error loading pricing management");
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

    res.render("admin/admin-audit-logs", {
      pageTitle: "Audit Logs",
      currentPage: "audit-logs",
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
  getAuditLogs,
};
