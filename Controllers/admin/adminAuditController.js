const AuditLog = require("../../Models/AuditLog");
const ZenoPayUser = require("../../Models/ZenoPayUser");
const { sanitizeDateRange } = require("../../utils/dateUtils");

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
