const AuditLog = require("../../Models/AuditLog");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const { sanitizeDateRange } = require("../../utils/dateUtils");

const seedAuditLogsIfEmpty = async () => {
  const existing = await AuditLog.countDocuments({});
  if (existing > 0) return;

  const admins = await ZenoPayUser.find({ Role: "admin" }).select("_id FullName Email Role").limit(3).lean();
  const adminIds = admins.map((a) => a._id);

  const templates = [
    { action: "ADMIN_LOGIN", category: "auth", description: "Admin login successful", status: "success" },
    { action: "UPDATE_USER_STATUS", category: "user", description: "Changed user account status", status: "success" },
    { action: "FLAG_TRANSACTION", category: "transaction", description: "Flagged suspicious transaction", status: "warning" },
    { action: "FREEZE_WALLET", category: "wallet", description: "Wallet temporarily frozen for review", status: "warning" },
    { action: "APPROVE_REFUND", category: "refund", description: "Approved refund request", status: "success" },
    { action: "UPDATE_SETTINGS", category: "settings", description: "Updated system settings", status: "success" },
    { action: "KYC_REJECT", category: "kyc", description: "Rejected KYC due to mismatch", status: "failed" },
    { action: "FORCE_LOGOUT_ADMINS", category: "system", description: "Triggered force logout for admins", status: "warning" },
  ];

  const now = Date.now();
  const demoLogs = Array.from({ length: 36 }).map((_, idx) => {
    const t = templates[idx % templates.length];
    const adminId = adminIds.length ? adminIds[idx % adminIds.length] : null;
    const createdAt = new Date(now - idx * 37 * 60 * 1000);

    return {
      adminId,
      action: t.action,
      category: t.category,
      description: `${t.description} (#${idx + 1})`,
      targetId: `TGT-${1000 + idx}`,
      targetType: t.category === "wallet" ? "Wallet" : t.category === "transaction" ? "Transaction" : "System",
      ipAddress: `10.0.0.${(idx % 15) + 10}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: t.status,
      metadata: {
        source: "demo-seed",
        index: idx + 1,
        note: "Auto seeded for feature testing",
      },
      createdAt,
      updatedAt: createdAt,
    };
  });

  await AuditLog.insertMany(demoLogs, { ordered: false });
};

const toDateRange = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return null;
  const range = {};
  if (dateFrom) range.$gte = new Date(dateFrom);
  if (dateTo) {
    const d = new Date(dateTo);
    d.setHours(23, 59, 59, 999);
    range.$lte = d;
  }
  return range;
};

exports.auditLogsList = async (req, res) => {
  try {
    await seedAuditLogsIfEmpty();

    const {
      search = "",
      action = "all",
      adminId = "all",
      dateFrom: rawDateFrom = "",
      dateTo: rawDateTo = "",
      page = 1,
      limit = 15,
    } = req.query;

    const { dateFrom, dateTo } = sanitizeDateRange(rawDateFrom, rawDateTo);

    const safeLimit = [15, 30, 50].includes(Number(limit)) ? Number(limit) : 15;
    const safePage = Math.max(1, Number(page) || 1);
    const skip = (safePage - 1) * safeLimit;

    const query = {};

    if (action && action !== "all") query.category = action;
    if (adminId && adminId !== "all") query.adminId = adminId;

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { ipAddress: { $regex: search, $options: "i" } },
      ];
    }

    const createdAtRange = toDateRange(dateFrom, dateTo);
    if (createdAtRange) query.createdAt = createdAtRange;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [logs, totalCount, todayCount, admins, authCount, failedCount, settingsCount] = await Promise.all([
      AuditLog.find(query)
        .populate("adminId", "FullName Email Role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      AuditLog.countDocuments(query),
      AuditLog.countDocuments({ createdAt: { $gte: startOfToday } }),
      ZenoPayUser.find({ Role: "admin" }).select("FullName Email Role").sort({ FullName: 1 }).lean(),
      AuditLog.countDocuments({ category: "auth" }),
      AuditLog.countDocuments({ status: "failed" }),
      AuditLog.countDocuments({ category: "settings" }),
    ]);

    const mappedAdmins = admins.map((a) => ({
      _id: a._id,
      name: a.FullName || "Admin",
      email: a.Email || "",
      role: a.Role || "admin",
    }));

    res.locals.adminPage = "audit-logs";

    return res.render("admin/audit-logs/admin-audit-logs", {
      logs,
      totalCount,
      todayCount,
      authCount,
      failedCount,
      settingsCount,
      admins: mappedAdmins,
      currentPage: safePage,
      pageSize: safeLimit,
      totalPages: Math.max(1, Math.ceil(totalCount / safeLimit)),
      filters: { search, action, adminId, dateFrom, dateTo },
      pageTitle: "Audit Logs",
      title: "Audit Logs",
      page: "audit-logs",
      adminPage: "audit-logs",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.exportAuditLogs = async (req, res) => {
  try {
    const { action = "" } = req.query;
    const { dateFrom, dateTo } = sanitizeDateRange(req.query.dateFrom, req.query.dateTo);
    const query = {};

    if (action && action !== "all") query.category = action;

    const createdAtRange = toDateRange(dateFrom, dateTo);
    if (createdAtRange) query.createdAt = createdAtRange;

    const logs = await AuditLog.find(query)
      .populate("adminId", "FullName Email")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const headers = ["Log ID", "Admin", "Email", "Action", "Description", "IP Address", "Date & Time"];
    const rows = logs.map((l) => [
      l._id,
      l.adminId?.FullName || "System",
      l.adminId?.Email || "",
      l.action || "",
      l.description || "",
      l.ipAddress || "",
      l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN") : "",
    ]);

    const escapeCell = (cell) => String(cell ?? "").replace(/"/g, '""');

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${escapeCell(c)}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="audit-logs.csv"');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
