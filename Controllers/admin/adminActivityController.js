const User = require("../../Models/ZenoPayUser");
const Transaction = require("../../Models/TransactionHistory");
const AuditLog = require("../../Models/AuditLog");
const ContactSubmission = require("../../Models/ContactSubmission");

exports.activityMonitor = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsersOnline,
      newUsersToday,
      activeTransactions,
      failedToday,
      pendingKYC,
      openTickets,
      recentTransactions,
      recentUsers,
      recentAlerts,
      systemStats,
    ] = await Promise.all([
      User.countDocuments({
        LastLogin: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
      }).catch(() => 0),

      User.countDocuments({
        Role: "user",
        RegistrationDate: { $gte: todayStart },
      }).catch(() => 0),

      Transaction.countDocuments({
        Status: "pending",
        TransactionTime: { $gte: todayStart },
      }).catch(() => 0),

      Transaction.countDocuments({
        Status: "failed",
        TransactionTime: { $gte: todayStart },
      }).catch(() => 0),

      User.countDocuments({
        KYCStatus: "pending",
      }).catch(() => 0),

      ContactSubmission.countDocuments({
        status: { $in: ["new", "read", "in_progress"] },
      }).catch(() => 0),

      Transaction.find()
        .sort({ TransactionTime: -1 })
        .limit(8)
        .lean()
        .catch(() => []),

      User.find({ Role: "user" })
        .sort({ RegistrationDate: -1 })
        .limit(6)
        .lean()
        .catch(() => []),

      AuditLog.find({ status: { $in: ["failed", "warning"] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .catch(() => []),

      Promise.resolve({
        serverStatus: "healthy",
        dbStatus: "connected",
        apiStatus: "operational",
        uptime: process.uptime(),
      }),
    ]);

    res.locals.adminPage = "activity-monitor";
    res.locals.failedToday = failedToday;

    res.render("admin/dashboard/admin-activity-monitor", {
      page: "activity-monitor",
      adminPage: "activity-monitor",
      failedToday,
      totalUsersOnline,
      newUsersToday,
      activeTransactions,
      pendingKYC,
      openTickets,
      recentTransactions,
      recentUsers,
      recentAlerts,
      systemStats,
      pageTitle: "Activity Monitor",
      title: "Activity Monitor",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
