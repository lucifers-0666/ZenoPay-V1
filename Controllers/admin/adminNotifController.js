const Notification = require("../../Models/Notification");

const PAGE_LIMIT = 15;

const categoryRules = {
  transaction: /(transaction|payment|transfer|refund|wallet|debit|credit)/i,
  user: /(user|signup|profile|account|customer)/i,
  kyc: /(kyc|verification|document|identity)/i,
  security: /(security|login|password|fraud|suspicious|2fa|otp)/i,
  system: /(system|maintenance|update|platform|server|general)/i,
};

const toPositiveInt = (value, fallback = 1) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const normalizeUiType = (type) => {
  const key = String(type || "").toLowerCase();
  if (["success", "reward"].includes(key)) return "success";
  if (["warning"].includes(key)) return "warning";
  if (["danger", "security"].includes(key)) return "danger";
  if (["system", "update", "general"].includes(key)) return "system";
  return "info";
};

const normalizeStoredType = (type) => {
  const key = String(type || "").toLowerCase();
  if (["success", "reward"].includes(key)) return "success";
  if (["warning"].includes(key)) return "warning";
  if (["danger", "security"].includes(key)) return "security";
  if (["system", "update"].includes(key)) return "update";
  return "info";
};

const resolveCategory = (doc) => {
  const stored = String(doc.Category || "").toLowerCase();
  if (stored && ["transaction", "user", "kyc", "refund", "security", "system", "wallet"].includes(stored)) {
    return stored;
  }

  const haystack = `${doc.Title || ""} ${doc.Message || ""} ${doc.Type || ""}`;
  for (const [category, regex] of Object.entries(categoryRules)) {
    if (regex.test(haystack)) return category;
  }
  return "system";
};

const toRelativeTime = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "just now";

  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const serializeNotification = (doc) => {
  const category = resolveCategory(doc);
  const uiType = normalizeUiType(doc.Type);
  return {
    id: String(doc._id),
    title: doc.Title || "Untitled notification",
    message: doc.Message || "",
    type: uiType,
    category,
    targetRole: doc.TargetRole || "all",
    isRead: Boolean(doc.IsRead),
    createdAt: doc.createdAt,
    relativeTime: toRelativeTime(doc.createdAt),
    link: doc.Link || "",
  };
};

const buildQuery = ({ type, status }) => {
  const query = {};

  if (status === "unread") query.IsRead = false;
  if (status === "read") query.IsRead = true;

  if (type && type !== "all") {
    if (type === "unread") {
      query.IsRead = false;
    } else if (categoryRules[type]) {
      query.$or = [
        { Category: type },
        { Title: { $regex: categoryRules[type] } },
        { Message: { $regex: categoryRules[type] } },
      ];
    }
  }

  return query;
};

exports.notificationsList = async (req, res) => {
  try {
    const type = String(req.query.type || "all").toLowerCase();
    const status = String(req.query.status || "").toLowerCase();
    const page = toPositiveInt(req.query.page, 1);
    const skip = (page - 1) * PAGE_LIMIT;

    const query = buildQuery({ type, status });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [docs, totalCount, unreadCount, totalAll, todayCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(PAGE_LIMIT).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ IsRead: false }),
      Notification.countDocuments(),
      Notification.countDocuments({ createdAt: { $gte: startOfDay } }),
    ]);

    const notifications = docs.map(serializeNotification);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_LIMIT));

    const wantsJson =
      req.xhr ||
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      String(req.headers.accept || "").includes("application/json") ||
      req.query.format === "json";

    if (wantsJson) {
      return res.json({
        success: true,
        notifications,
        totalCount,
        unreadCount,
        totalAll,
        todayCount,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages,
      });
    }

    res.locals.adminPage = "notifications";
    res.locals.page = "notifications";

    return res.render("admin/notifications/admin-notifications", {
      notifications,
      totalCount,
      unreadCount,
      totalAll,
      todayCount,
      currentPage: page,
      totalPages,
      filters: { type, status },
      pageTitle: "Notifications",
      title: "Notifications",
      page: "notifications",
      currentPageKey: "notifications",
      adminPage: "notifications",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { IsRead: true, readAt: new Date() });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ IsRead: false }, { IsRead: true, readAt: new Date() });
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({});
    return res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type, targetRole, category, link } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    await Notification.create({
      ZenoPayId: "ADMIN_BROADCAST",
      Title: String(title).trim(),
      Message: String(message).trim(),
      Type: normalizeStoredType(type),
      Category: String(category || "system").toLowerCase(),
      TargetRole: String(targetRole || "all").toLowerCase(),
      Link: String(link || "").trim(),
      IsRead: false,
      createdAt: new Date(),
    });

    return res.json({ success: true, message: "Notification sent successfully" });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
