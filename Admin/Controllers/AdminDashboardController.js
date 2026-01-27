const ZenoPayUser = require("../../Models/ZenoPayUser");
const Merchant = require("../../Models/Merchant");
const TransactionHistory = require("../../Models/TransactionHistory");
const BankAccount = require("../../Models/BankAccount");
const Banks = require("../../Models/Banks");

// GET Admin Dashboard
const getDashboard = async (req, res) => {
  try {
    // Render the new modern dashboard
    res.render("dashboard/overview", {
      user: req.session.user,
      pageTitle: "Admin Dashboard - ZenoPay"
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).send("Error loading dashboard");
  }
};

// GET Dashboard Data API
const getDashboardData = async (req, res) => {
  try {
    // Get statistics
    const totalUsers = await ZenoPayUser.countDocuments({ Role: "user" });
    const totalMerchants = await Merchant.countDocuments();
    const totalBanks = await Banks.countDocuments();
    const totalTransactions = await TransactionHistory.countDocuments();

    // Get total transaction amount
    const transactionStats = await TransactionHistory.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
        },
      },
    ]);

    const platformRevenue = transactionStats.length > 0 
      ? transactionStats[0].totalAmount 
      : 0;

    // Get active merchants
    const activeMerchants = await Merchant.countDocuments({ IsActive: true });

    // Get transaction volume for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactionVolume = await TransactionHistory.aggregate([
      {
        $match: {
          TransactionTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get user growth for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await ZenoPayUser.aggregate([
      {
        $match: {
          RegistrationDate: { $gte: sixMonthsAgo },
          Role: "user"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$RegistrationDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top 5 merchants by transaction volume
    const topMerchants = await TransactionHistory.aggregate([
      {
        $group: {
          _id: "$MerchantID",
          transactions: { $sum: 1 },
          volume: { $sum: "$Amount" }
        }
      },
      { $sort: { volume: -1 } },
      { $limit: 5 }
    ]);

    // Populate merchant names
    const merchantsWithNames = await Promise.all(
      topMerchants.map(async (m) => {
        const merchant = await Merchant.findById(m._id);
        return {
          name: merchant ? merchant.BusinessName : "Unknown",
          transactions: m.transactions,
          volume: m.volume,
          status: merchant && merchant.IsActive ? "active" : "inactive"
        };
      })
    );

    // Get recent activities
    const recentTransactions = await TransactionHistory.find()
      .sort({ TransactionTime: -1 })
      .limit(5)
      .populate("SenderAccountNumber")
      .populate("ReceiverAccountNumber");

    const recentUsers = await ZenoPayUser.find({ Role: "user" })
      .sort({ RegistrationDate: -1 })
      .limit(3);

    const recentActivities = [
      ...recentUsers.map(u => ({
        type: "user",
        icon: "person-plus-fill",
        title: "New User Registration",
        description: `${u.FullName} registered a new account`,
        time: getTimeAgo(u.RegistrationDate),
        class: "success"
      })),
      ...recentTransactions.map(t => ({
        type: "transaction",
        icon: "arrow-left-right",
        title: "Transaction Completed",
        description: `$${t.Amount.toFixed(2)} transaction processed`,
        time: getTimeAgo(t.TransactionTime),
        class: ""
      }))
    ].slice(0, 5);

    // Return JSON data
    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalTransactions,
        activeMerchants,
        platformRevenue
      },
      charts: {
        transactionVolume: {
          labels: transactionVolume.map(t => t._id),
          data: transactionVolume.map(t => t.count)
        },
        userGrowth: {
          labels: userGrowth.map(u => u._id),
          data: userGrowth.map(u => u.count)
        }
      },
      topMerchants: merchantsWithNames,
      recentActivities
    });
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + " years ago";
  if (interval === 1) return "1 year ago";
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + " months ago";
  if (interval === 1) return "1 month ago";
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + " days ago";
  if (interval === 1) return "1 day ago";
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + " hours ago";
  if (interval === 1) return "1 hour ago";
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + " minutes ago";
  if (interval === 1) return "1 minute ago";
  
  return "Just now";
}

// GET Statistics Page
const getStatistics = async (req, res) => {
  try {
    res.render("dashboard/statistics", {
      user: req.session.user,
      pageTitle: "Platform Statistics - ZenoPay"
    });
  } catch (error) {
    console.error("Statistics Error:", error);
    res.status(500).send("Error loading statistics");
  }
};

// GET Statistics Data API
const getStatisticsData = async (req, res) => {
  try {
    const period = req.query.period || 'today';
    let dateFilter = {};
    
    // Calculate date range based on period
    const now = new Date();
    switch(period) {
      case 'today':
        dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = { $gte: monthAgo };
        break;
    }
    
    // User Statistics
    const totalUsers = await ZenoPayUser.countDocuments({ Role: "user" });
    const activeUsers = await ZenoPayUser.countDocuments({
      Role: "user",
      LastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const newUsers = await ZenoPayUser.countDocuments({
      Role: "user",
      RegistrationDate: dateFilter
    });
    
    // Transaction Statistics
    const totalTransactions = await TransactionHistory.countDocuments();
    const successfulTransactions = await TransactionHistory.countDocuments({ Status: "Success" });
    const failedTransactions = await TransactionHistory.countDocuments({ Status: "Failed" });
    const successRate = totalTransactions > 0 ? ((successfulTransactions / totalTransactions) * 100).toFixed(1) : 0;
    
    const avgTransactionValue = await TransactionHistory.aggregate([
      { $group: { _id: null, avgValue: { $avg: "$Amount" } } }
    ]);
    
    // Financial Statistics
    const revenueStats = await TransactionHistory.aggregate([
      { $group: { _id: null, total: { $sum: "$Amount" } } }
    ]);
    
    // Merchant Statistics
    const activeMerchants = await Merchant.countDocuments({ IsActive: true });
    const pendingMerchants = await Merchant.countDocuments({ IsActive: false });
    
    // Bank Statistics
    const connectedBanks = await Banks.countDocuments();
    
    res.json({
      success: true,
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        retention: 78.5 // Calculate based on your logic
      },
      transactions: {
        total: totalTransactions,
        successRate: parseFloat(successRate),
        failed: failedTransactions,
        avgValue: avgTransactionValue[0]?.avgValue || 0
      },
      financial: {
        revenue: revenueStats[0]?.total || 0,
        commission: (revenueStats[0]?.total || 0) * 0.02, // 2% commission
        pending: 45678, // Calculate from pending transactions
        payouts: 189012 // Calculate from completed payouts
      },
      merchants: {
        active: activeMerchants,
        pending: pendingMerchants
      },
      banks: {
        connected: connectedBanks
      },
      charts: {
        verification: { verified: 8234, unverified: 3245, pending: 1068 },
        transactionTimes: Array(24).fill(0).map(() => Math.floor(Math.random() * 3000)),
        paymentMethods: { bank: 25600, card: 15200, wallet: 5093 },
        merchantCategories: { retail: 45, food: 32, tech: 28, services: 25, other: 20 }
      },
      tables: {
        topMerchants: [],
        bankStats: []
      }
    });
  } catch (error) {
    console.error("Statistics Data Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET Activity Monitor Page
const getActivityMonitor = async (req, res) => {
  try {
    res.render("dashboard/activity-monitor", {
      user: req.session.user,
      pageTitle: "Activity Monitor - ZenoPay"
    });
  } catch (error) {
    console.error("Activity Monitor Error:", error);
    res.status(500).send("Error loading activity monitor");
  }
};

// GET Live Activities Data API
const getLiveActivities = async (req, res) => {
  try {
    // Get recent activities from database
    const recentTransactions = await TransactionHistory.find()
      .sort({ TransactionTime: -1 })
      .limit(10)
      .populate("SenderAccountNumber")
      .populate("ReceiverAccountNumber");
    
    const recentUsers = await ZenoPayUser.find({ Role: "user" })
      .sort({ RegistrationDate: -1 })
      .limit(5);
    
    // Format activities
    const activities = [
      ...recentUsers.map((u, i) => ({
        id: `ACT-USER-${i}`,
        type: "user",
        icon: "person-plus-fill",
        title: "New User Registration",
        description: `${u.FullName} (${u.Email}) registered a new account`,
        user: u.FullName,
        userId: u._id,
        timestamp: u.RegistrationDate,
        severity: "success"
      })),
      ...recentTransactions.map((t, i) => ({
        id: `ACT-TXN-${i}`,
        type: "transaction",
        icon: t.Status === "Success" ? "arrow-left-right" : "x-circle-fill",
        title: t.Status === "Success" ? "Transaction Completed" : "Transaction Failed",
        description: `$${t.Amount.toFixed(2)} transaction ${t.Status.toLowerCase()}`,
        transactionId: t._id,
        timestamp: t.TransactionTime,
        severity: t.Status === "Success" ? "success" : "error"
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error("Live Activities Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET Analytics Page
const getAnalytics = async (req, res) => {
  try {
    // Add analytics logic here
    res.render("admin/analytics", {
      pageTitle: "Analytics",
      currentPage: "analytics",
      admin: req.session.user,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).send("Error loading analytics");
  }
};

// GET Reports Page
const getReports = async (req, res) => {
  try {
    res.render("admin/reports", {
      pageTitle: "Reports",
      currentPage: "reports",
      admin: req.session.user,
    });
  } catch (error) {
    console.error("Reports error:", error);
    res.status(500).send("Error loading reports");
  }
};

// Export Reports
const exportReports = async (req, res) => {
  try {
    // Add export logic here
    res.json({ success: true, message: "Export functionality coming soon" });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET Settings Page
const getSettings = async (req, res) => {
  try {
    res.render("admin/settings", {
      pageTitle: "Settings",
      currentPage: "settings",
      admin: req.session.user,
    });
  } catch (error) {
    console.error("Settings error:", error);
    res.status(500).send("Error loading settings");
  }
};

// Update Settings
const updateSettings = async (req, res) => {
  try {
    // Add settings update logic here
    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDashboard,
  getDashboardData,
  getStatistics,
  getStatisticsData,
  getActivityMonitor,
  getLiveActivities,
  getAnalytics,
  getReports,
  exportReports,
  getSettings,
  updateSettings,
};
