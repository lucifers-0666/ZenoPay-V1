const ZenoPayUser = require("../../Models/ZenoPayUser");
const Merchant = require("../../Models/Merchant");
const TransactionHistory = require("../../Models/TransactionHistory");
const WalletTransaction = require("../../Models/Transaction");
const BankAccount = require("../../Models/BankAccount");
const Banks = require("../../Models/Banks");
const Wallet = require("../../Models/Wallet");
const ContactSubmission = require("../../Models/ContactSubmission");
const AdminSettings = require("../../Models/AdminSettings");
const PaymentGatewaySettings = require("../../Models/PaymentGatewaySettings");
const { stringify } = require("csv-stringify/sync");
const PDFDocument = require("pdfkit");

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCompactINR = (amount) => {
  const num = toNumber(amount);
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(1)}Cr`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const formatPercentage = (current, previous) => {
  const safeCurrent = toNumber(current);
  const safePrevious = toNumber(previous);
  if (!safePrevious && !safeCurrent) return 0;
  if (!safePrevious) return 100;
  return Number((((safeCurrent - safePrevious) / safePrevious) * 100).toFixed(1));
};

const timeAgoShort = (value) => {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "just now";
  const sec = Math.max(1, Math.floor((Date.now() - dt.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

const initialsFrom = (name = "U") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "U";

const normalizeStatus = (value = "") => {
  const s = String(value || "").toLowerCase();
  if (s.includes("success") || s.includes("complete")) return "success";
  if (s.includes("fail") || s.includes("declin")) return "failed";
  return "pending";
};

const buildDateKeys = (days) => {
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(new Date(d));
  }
  return keys;
};

const buildSeries = async (Model, dateField, days, extraMatch = {}) => {
  const points = buildDateKeys(days);
  const start = points[0];

  const data = await Model.aggregate([
    {
      $match: {
        [dateField]: { $gte: start },
        ...extraMatch,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: `$${dateField}`,
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]).catch(() => []);

  const map = new Map((data || []).map((row) => [row._id, Number(row.count || 0)]));
  const labels = points.map((d) =>
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: days <= 7 ? "short" : "numeric",
    })
  );
  const values = points.map((d) => map.get(d.toISOString().slice(0, 10)) || 0);
  return { labels, values };
};

// GET Admin Dashboard
const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const last30Start = new Date(now);
    last30Start.setDate(now.getDate() - 29);
    last30Start.setHours(0, 0, 0, 0);

    const prev30Start = new Date(last30Start);
    prev30Start.setDate(prev30Start.getDate() - 30);

    const prev30End = new Date(last30Start);
    prev30End.setMilliseconds(-1);

    const [
      totalUsers,
      totalTransactions,
      activeMerchants,
      pendingKycUsers,
      pendingMerchants,
      pendingBanks,
      flaggedTransactions,
      volumeAgg,
      txLast30,
      txPrev30,
      usersLast30,
      usersPrev30,
      merchantsLast30,
      merchantsPrev30,
      recentTransactions,
      recentUsers,
      recentMerchantDocs,
      recentFailedTx,
      tx7,
      tx30,
      tx90,
      users7,
      users30,
      users90,
    ] = await Promise.all([
      ZenoPayUser.countDocuments({ Role: "user" }),
      TransactionHistory.countDocuments({}),
      Merchant.countDocuments({ IsActive: true }),
      ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "pending" }),
      Merchant.countDocuments({
        $or: [{ Status: /pending/i }, { IsActive: false }],
      }),
      Banks.countDocuments({
        $or: [{ Status: /pending/i }, { IsActive: false }, { Approved: false }],
      }),
      TransactionHistory.countDocuments({
        Status: { $in: ["flagged", "failed", "Failed", "declined", "Declined"] },
      }),
      TransactionHistory.aggregate([
        { $group: { _id: null, total: { $sum: { $toDouble: "$Amount" } } } },
      ]),
      TransactionHistory.countDocuments({ TransactionTime: { $gte: last30Start } }),
      TransactionHistory.countDocuments({
        TransactionTime: { $gte: prev30Start, $lte: prev30End },
      }),
      ZenoPayUser.countDocuments({ Role: "user", RegistrationDate: { $gte: last30Start } }),
      ZenoPayUser.countDocuments({
        Role: "user",
        RegistrationDate: { $gte: prev30Start, $lte: prev30End },
      }),
      Merchant.countDocuments({ createdAt: { $gte: last30Start } }),
      Merchant.countDocuments({ createdAt: { $gte: prev30Start, $lte: prev30End } }),
      TransactionHistory.find({})
        .sort({ TransactionTime: -1, createdAt: -1 })
        .limit(5)
        .lean(),
      ZenoPayUser.find({ Role: "user" })
        .sort({ RegistrationDate: -1, createdAt: -1 })
        .limit(3)
        .lean(),
      Merchant.find({})
        .sort({ createdAt: -1 })
        .limit(2)
        .lean(),
      TransactionHistory.find({
        Status: { $in: ["failed", "Failed", "declined", "Declined"] },
      })
        .sort({ TransactionTime: -1, createdAt: -1 })
        .limit(2)
        .lean(),
      buildSeries(TransactionHistory, "TransactionTime", 7),
      buildSeries(TransactionHistory, "TransactionTime", 30),
      buildSeries(TransactionHistory, "TransactionTime", 90),
      buildSeries(ZenoPayUser, "RegistrationDate", 7, { Role: "user" }),
      buildSeries(ZenoPayUser, "RegistrationDate", 30, { Role: "user" }),
      buildSeries(ZenoPayUser, "RegistrationDate", 90, { Role: "user" }),
    ]);

    const totalVolume = toNumber(volumeAgg?.[0]?.total || 0);
    const pendingApprovals =
      Number(pendingKycUsers || 0) + Number(pendingMerchants || 0) + Number(pendingBanks || 0);

    const mappedRecentTransactions = (recentTransactions || []).map((tx) => {
      const txStatus = String(tx.Status || "pending").toLowerCase();
      const normalizedStatus = txStatus.includes("success")
        ? "success"
        : txStatus.includes("fail") || txStatus.includes("declin")
          ? "failed"
          : "pending";

      const userName = tx.SenderHolderName || tx.ReceiverHolderName || "Unknown User";

      return {
        id: tx.TransactionID || String(tx._id || "").slice(-8).toUpperCase(),
        userName,
        initials: initialsFrom(userName),
        amountText: `₹${toNumber(tx.Amount).toLocaleString("en-IN")}`,
        type: tx.Type || tx.TransactionType || tx.Description || "Transaction",
        status: normalizedStatus,
        timeAgo: timeAgoShort(tx.TransactionTime || tx.createdAt),
      };
    });

    const recentActivity = [
      ...(recentUsers || []).map((u) => ({
        timestamp: u.RegistrationDate || u.createdAt,
        tone: "green",
        text: `New user ${u.FullName || u.Email || "User"} registered`,
      })),
      ...(recentMerchantDocs || []).map((m) => ({
        timestamp: m.createdAt,
        tone: "blue",
        text: `Merchant ${m.BusinessName || m.Email || "Merchant"} joined platform`,
      })),
      ...(recentFailedTx || []).map((t) => ({
        timestamp: t.TransactionTime || t.createdAt,
        tone: "red",
        text: `Failed transaction detected (#${t.TransactionID || String(t._id || "").slice(-6)})`,
      })),
    ]
      .filter((a) => a.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 7)
      .map((a) => ({
        ...a,
        timeAgo: timeAgoShort(a.timestamp),
      }));

    const dashboard = {
      metrics: {
        totalUsers,
        totalTransactions,
        activeMerchants,
        pendingApprovals,
        flaggedTransactions,
        totalVolumeText: formatCompactINR(totalVolume),
        usersGrowthPct: formatPercentage(usersLast30, usersPrev30),
        txGrowthPct: formatPercentage(txLast30, txPrev30),
        merchantsGrowthPct: formatPercentage(merchantsLast30, merchantsPrev30),
      },
      recentTransactions: mappedRecentTransactions,
      activity: recentActivity,
      charts: {
        tx: {
          "7d": { labels: tx7.labels, data: tx7.values },
          "30d": { labels: tx30.labels, data: tx30.values },
          "90d": { labels: tx90.labels, data: tx90.values },
        },
        users: {
          "7d": { labels: users7.labels, data: users7.values },
          "30d": { labels: users30.labels, data: users30.values },
          "90d": { labels: users90.labels, data: users90.values },
        },
      },
    };

    res.locals.adminPage = "dashboard";
    return res.render("admin/dashboard/admin-dashboard-overview", {
      user: req.session.user,
      title: "Dashboard",
      page: "dashboard",
      adminPage: "dashboard",
      kycPending: 0,
      supportOpen: 0,
      pageTitle: "Admin Dashboard Overview - ZenoPay",
      dashboard,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).send("Error loading dashboard");
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
    const range = ["7", "30", "90", "365"].includes(String(req.query.range || ""))
      ? String(req.query.range)
      : "30";
    const days = parseInt(range, 10);
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - (days - 1));

    const txDateFilter = { TransactionTime: { $gte: fromDate } };
    const walletDateFilter = { createdAt: { $gte: fromDate } };

    const [
      bankTotalTransactions,
      bankSuccessfulTransactions,
      bankFailedTransactions,
      bankPendingTransactions,
      walletTotalTransactions,
      walletSuccessfulTransactions,
      walletFailedTransactions,
      walletPendingTransactions,
    ] = await Promise.all([
      TransactionHistory.countDocuments(txDateFilter),
      TransactionHistory.countDocuments({ ...txDateFilter, Status: { $in: ["success", "Success"] } }),
      TransactionHistory.countDocuments({ ...txDateFilter, Status: { $in: ["failed", "Failed", "declined", "Declined"] } }),
      TransactionHistory.countDocuments({ ...txDateFilter, Status: { $in: ["pending", "Pending"] } }),
      WalletTransaction.countDocuments(walletDateFilter),
      WalletTransaction.countDocuments({ ...walletDateFilter, status: { $in: ["completed", "success"] } }),
      WalletTransaction.countDocuments({ ...walletDateFilter, status: { $in: ["failed"] } }),
      WalletTransaction.countDocuments({ ...walletDateFilter, status: { $in: ["pending"] } }),
    ]);

    const totalTransactions = Number(bankTotalTransactions || 0) + Number(walletTotalTransactions || 0);
    const successfulTransactions = Number(bankSuccessfulTransactions || 0) + Number(walletSuccessfulTransactions || 0);
    const failedTransactions = Number(bankFailedTransactions || 0) + Number(walletFailedTransactions || 0);
    const pendingTransactions = Number(bankPendingTransactions || 0) + Number(walletPendingTransactions || 0);

    const [bankVolumeAgg, walletVolumeAgg] = await Promise.all([
      TransactionHistory.aggregate([
        { $match: txDateFilter },
        { $group: { _id: null, total: { $sum: { $toDouble: "$Amount" } } } }
      ]),
      WalletTransaction.aggregate([
        { $match: walletDateFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
    ]);

    const totalVolumeNumber = Number(bankVolumeAgg[0]?.total || 0) + Number(walletVolumeAgg[0]?.total || 0);

    const chargebacks = Math.max(0, Math.round(failedTransactions * 0.15));
    const successRate = totalTransactions > 0
      ? ((successfulTransactions / totalTransactions) * 100).toFixed(1)
      : "0.0";

    const stats = {
      totalVolume: `${(totalVolumeNumber / 1000000).toFixed(1)}M`,
      totalTransactions: totalTransactions.toLocaleString("en-IN"),
      successRate,
      chargebacks: chargebacks.toLocaleString("en-IN"),
    };

    // Generate selected range labels + query-backed values
    const dayKeys = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      dayKeys.push(new Date(d));
    }

    const [byDayAllBank, byDayAllWallet] = await Promise.all([
      TransactionHistory.aggregate([
      { $match: txDateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
          volume: { $sum: { $toDouble: "$Amount" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
      WalletTransaction.aggregate([
        { $match: walletDateFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            volume: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const mergedAllByDayMap = new Map();
    [...(byDayAllBank || []), ...(byDayAllWallet || [])].forEach((row) => {
      const prev = mergedAllByDayMap.get(row._id) || { _id: row._id, volume: 0, count: 0 };
      prev.volume += Number(row.volume || 0);
      prev.count += Number(row.count || 0);
      mergedAllByDayMap.set(row._id, prev);
    });
    const byDayAll = Array.from(mergedAllByDayMap.values()).sort((a, b) => String(a._id).localeCompare(String(b._id)));

    const [byDaySuccessBank, byDaySuccessWallet] = await Promise.all([
      TransactionHistory.aggregate([
      { $match: { ...txDateFilter, Status: { $in: ["success", "Success"] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
          volume: { $sum: { $toDouble: "$Amount" } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
      WalletTransaction.aggregate([
        { $match: { ...walletDateFilter, status: { $in: ["completed", "success"] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            volume: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const mergedSuccessByDayMap = new Map();
    [...(byDaySuccessBank || []), ...(byDaySuccessWallet || [])].forEach((row) => {
      const prev = mergedSuccessByDayMap.get(row._id) || { _id: row._id, volume: 0 };
      prev.volume += Number(row.volume || 0);
      mergedSuccessByDayMap.set(row._id, prev);
    });
    const byDaySuccess = Array.from(mergedSuccessByDayMap.values()).sort((a, b) => String(a._id).localeCompare(String(b._id)));

    const [byDayStatusBank, byDayStatusWallet] = await Promise.all([
      TransactionHistory.aggregate([
      { $match: txDateFilter },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
            status: "$Status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]),
      WalletTransaction.aggregate([
        { $match: walletDateFilter },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),
    ]);

    const byDayStatus = [...(byDayStatusBank || []), ...(byDayStatusWallet || [])].map((row) => ({
      _id: {
        day: row?._id?.day,
        status: normalizeStatus(row?._id?.status),
      },
      count: Number(row?.count || 0),
    }));

    const allMap = new Map(byDayAll.map((d) => [d._id, d]));
    const successMap = new Map(byDaySuccess.map((d) => [d._id, d]));
    const statusMap = new Map();
    byDayStatus.forEach((d) => {
      const k = `${d._id.day}|${String(d._id.status || "").toLowerCase()}`;
      statusMap.set(k, Number(statusMap.get(k) || 0) + Number(d.count || 0));
    });

    const volumeLabels = [];
    const volumeData = [];
    const successVolumeData = [];
    const txnLabels = [];
    const txnData = [];
    const statusSuccessData = [];
    const statusFailedData = [];
    const statusPendingData = [];

    for (let i = 0; i < dayKeys.length; i++) {
      const d = dayKeys[i];
      const dayKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      volumeLabels.push(label);
      txnLabels.push(label);

      const allDay = allMap.get(dayKey);
      const successDay = successMap.get(dayKey);

      volumeData.push(Math.round(Number(allDay?.volume || 0)));
      successVolumeData.push(Math.round(Number(successDay?.volume || 0)));
      txnData.push(Number(allDay?.count || 0));

      statusSuccessData.push(Number(statusMap.get(`${dayKey}|success`) || 0));
      statusFailedData.push(Number(statusMap.get(`${dayKey}|failed`) || 0));
      statusPendingData.push(Number(statusMap.get(`${dayKey}|pending`) || 0));
    }

    const topMerchantsRaw = await Merchant.find({})
      .sort({ TotalVolume: -1 })
      .limit(5)
      .lean();

    const merchantsVolumeTotal = topMerchantsRaw.reduce((sum, m) => sum + Number(m.TotalVolume || 0), 0);

    const topMerchants = topMerchantsRaw.map((merchant) => {
      const merchantVolume = Number(merchant.TotalVolume || 0);
      const shareValue = merchantsVolumeTotal > 0 ? (merchantVolume / merchantsVolumeTotal) * 100 : 0;

      return {
        merchant: merchant.BusinessName || "Unknown Merchant",
        volume: merchantVolume,
        volumeText: `₹${merchantVolume.toLocaleString("en-IN")}`,
        share: `${shareValue.toFixed(1)}%`,
        transactions: Number(merchant.TransactionCount || 0),
        status: merchant.Status || (merchant.IsActive ? "active" : "pending"),
      };
    });

    const totalUsers = await ZenoPayUser.countDocuments({ Role: "user" });
    const newUsersToday = await ZenoPayUser.countDocuments({
      Role: "user",
      RegistrationDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    const users7Days = await ZenoPayUser.countDocuments({
      Role: "user",
      RegistrationDate: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
    });
    const users30Days = await ZenoPayUser.countDocuments({
      Role: "user",
      RegistrationDate: { $gte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) },
    });

    const activeMerchants = await Merchant.countDocuments({ IsActive: true });
    const verifiedUsers = await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: { $in: ["approved", "verified"] } });
    const pendingKycUsers = await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "pending" });

    const usersByDayAgg = await ZenoPayUser.aggregate([
      {
        $match: {
          Role: "user",
          RegistrationDate: { $gte: fromDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$RegistrationDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const usersByDayMap = new Map(usersByDayAgg.map((u) => [u._id, u.count]));
    const userGrowthLabels = [];
    const userGrowthData = [];
    for (let i = 0; i < dayKeys.length; i++) {
      const d = dayKeys[i];
      const key = d.toISOString().slice(0, 10);
      userGrowthLabels.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
      userGrowthData.push(Number(usersByDayMap.get(key) || 0));
    }

    const kycNotStarted = await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "not_started" });
    const kycApproved = await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: { $in: ["approved", "verified"] } });
    const kycRejected = await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "rejected" });

    const top10MerchantsRaw = await Merchant.find({})
      .sort({ TotalVolume: -1 })
      .limit(10)
      .lean();
    const topMerchantLabels = top10MerchantsRaw.map((m) => m.BusinessName || "Unknown");
    const topMerchantVolumeData = top10MerchantsRaw.map((m) => Number(m.TotalVolume || 0));

    const [recentBankTransactions, recentWalletTransactions] = await Promise.all([
      TransactionHistory.find(txDateFilter)
        .sort({ TransactionTime: -1 })
        .limit(10)
        .lean(),
      WalletTransaction.find(walletDateFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const recentTransactions = [
      ...(recentBankTransactions || []).map((t) => ({
        TransactionID: t.TransactionID,
        Amount: toNumber(t.Amount),
        Status: t.Status,
        SenderHolderName: t.SenderHolderName || t.ReceiverHolderName || "Bank User",
        TransactionTime: t.TransactionTime || t.createdAt,
      })),
      ...(recentWalletTransactions || []).map((t) => ({
        TransactionID: t.reference || String(t._id || ""),
        Amount: toNumber(t.amount),
        Status: t.status,
        SenderHolderName: t?.metadata?.senderName || t?.metadata?.recipientName || "Wallet User",
        TransactionTime: t.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.TransactionTime || 0) - new Date(a.TransactionTime || 0))
      .slice(0, 10);
    const recentUsers = await ZenoPayUser.find({ Role: "user" })
      .sort({ RegistrationDate: -1 })
      .limit(10)
      .lean();

    const avgTxnAgg = await TransactionHistory.aggregate([
      { $match: txDateFilter },
      { $group: { _id: null, avgValue: { $avg: { $toDouble: "$Amount" } } } }
    ]);
    const avgTxnValue = avgTxnAgg[0]?.avgValue || 0;

    const trendText = (current, previous) => {
      const pct = formatPercentage(current, previous);
      return `${pct >= 0 ? "+" : ""}${pct}%`;
    };

    const totalMerchantsCount = await Merchant.countDocuments({});
    const volumeLast7 = volumeData.slice(-7).reduce((sum, v) => sum + Number(v || 0), 0);
    const volumePrev = Math.max(0, totalVolumeNumber - volumeLast7);

    const usersTrend = trendText(users7Days, Math.max(0, users30Days - users7Days));
    const merchantsTrend = trendText(activeMerchants, Math.max(0, totalMerchantsCount - activeMerchants));
    const volumeTrend = trendText(volumeLast7, volumePrev);
    const failedTrend = trendText(failedTransactions, Math.max(0, totalTransactions - failedTransactions));
    const chargebackTrend = trendText(chargebacks, Math.max(0, failedTransactions - chargebacks));
    const avgTxnTrend = trendText(avgTxnValue, Math.max(0, avgTxnValue * 0.95));

    const detailedStats = [
      {
        metric: "New Users",
        today: Math.max(1, Math.floor(users7Days / 7)).toLocaleString("en-IN"),
        last7Days: users7Days.toLocaleString("en-IN"),
        last30Days: users30Days.toLocaleString("en-IN"),
        trend: usersTrend,
        improving: Number(usersTrend.replace("%", "")) >= 0,
      },
      {
        metric: "Active Merchants",
        today: Math.max(1, Math.floor(activeMerchants / 30)).toLocaleString("en-IN"),
        last7Days: Math.max(1, Math.floor(activeMerchants / 4)).toLocaleString("en-IN"),
        last30Days: activeMerchants.toLocaleString("en-IN"),
        trend: merchantsTrend,
        improving: Number(merchantsTrend.replace("%", "")) >= 0,
      },
      {
        metric: "Processed Volume",
        today: `₹${Math.floor(totalVolumeNumber / 30).toLocaleString("en-IN")}`,
        last7Days: `₹${Math.floor(totalVolumeNumber / 4).toLocaleString("en-IN")}`,
        last30Days: `₹${Math.floor(totalVolumeNumber).toLocaleString("en-IN")}`,
        trend: volumeTrend,
        improving: Number(volumeTrend.replace("%", "")) >= 0,
      },
      {
        metric: "Failed Transactions",
        today: Math.max(1, Math.floor(failedTransactions / 30)).toLocaleString("en-IN"),
        last7Days: Math.max(1, Math.floor(failedTransactions / 4)).toLocaleString("en-IN"),
        last30Days: failedTransactions.toLocaleString("en-IN"),
        trend: failedTrend,
        improving: Number(failedTrend.replace("%", "")) <= 0,
      },
      {
        metric: "Chargebacks",
        today: Math.max(1, Math.floor(chargebacks / 30)).toLocaleString("en-IN"),
        last7Days: Math.max(1, Math.floor(chargebacks / 4)).toLocaleString("en-IN"),
        last30Days: chargebacks.toLocaleString("en-IN"),
        trend: chargebackTrend,
        improving: Number(chargebackTrend.replace("%", "")) <= 0,
      },
      {
        metric: "Avg Transaction Value",
        today: `₹${Math.round(avgTxnValue).toLocaleString("en-IN")}`,
        last7Days: `₹${Math.round(avgTxnValue * 0.98).toLocaleString("en-IN")}`,
        last30Days: `₹${Math.round(avgTxnValue).toLocaleString("en-IN")}`,
        trend: avgTxnTrend,
        improving: Number(avgTxnTrend.replace("%", "")) >= 0,
      },
    ];

    res.render("admin/dashboard/admin-statistics", {
      user: req.session.user,
      page: "statistics",
      adminPage: "statistics",
      stats,
      volumeLabels,
      volumeData,
      successVolumeData,
      txnLabels,
      txnData,
      statusSuccessData,
      statusFailedData,
      statusPendingData,
      userGrowthLabels,
      userGrowthData,
      kycBreakdown: {
        approved: kycApproved,
        pending: pendingKycUsers,
        rejected: kycRejected,
        notStarted: kycNotStarted,
      },
      topMerchantLabels,
      topMerchantVolumeData,
      recentTransactions,
      recentUsers,
      userStats: {
        totalUsers,
        newToday: newUsersToday,
        activeUsers: users30Days,
        kycPending: pendingKycUsers,
        verifiedUsers,
      },
      transactionStats: {
        total: totalTransactions,
        success: successfulTransactions,
        failed: failedTransactions,
        pending: pendingTransactions,
        avgValue: Math.round(avgTxnValue),
      },
      merchantStats: {
        total: totalMerchantsCount,
        active: activeMerchants,
        verified: await Merchant.countDocuments({ IsActive: true, Status: "active" }),
        volume: Math.round(totalVolumeNumber),
      },
      topMerchants,
      detailedStats,
      filters: { range },
      title: "Statistics",
      pageTitle: "Statistics",
    });
  } catch (error) {
    console.error("Statistics Error:", error);
    res.status(500).send("Error loading statistics");
  }
};

// GET statistics chart dynamic data
const getStatisticsChartData = async (req, res) => {
  try {
    const type = String(req.query.type || "volume").toLowerCase();
    const days = Math.max(1, Math.min(365, parseInt(req.query.days || "30", 10)));

    const labels = [];
    const values = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);

      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      labels.push(dayStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));

      if (type === "volume") {
        const [bankResult, walletResult] = await Promise.all([
          TransactionHistory.aggregate([
            {
              $match: {
                TransactionTime: { $gte: dayStart, $lte: dayEnd },
                Status: { $in: ["success", "Success"] },
              },
            },
            { $group: { _id: null, total: { $sum: { $toDouble: "$Amount" } } } },
          ]),
          WalletTransaction.aggregate([
            {
              $match: {
                createdAt: { $gte: dayStart, $lte: dayEnd },
                status: { $in: ["completed", "success"] },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
        ]);
        const total = Number(bankResult[0]?.total || 0) + Number(walletResult[0]?.total || 0);
        values.push(Math.round(total));
      } else {
        const [bankCount, walletCount] = await Promise.all([
          TransactionHistory.countDocuments({
            TransactionTime: { $gte: dayStart, $lte: dayEnd },
          }),
          WalletTransaction.countDocuments({
            createdAt: { $gte: dayStart, $lte: dayEnd },
          }),
        ]);
        values.push(Number(bankCount || 0) + Number(walletCount || 0));
      }
    }

    return res.json({ labels, values });
  } catch (err) {
    console.error("Statistics Chart Data Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET statistics export CSV
const exportStatistics = async (req, res) => {
  try {
    const range = ["7", "30", "90", "365"].includes(String(req.query.range || ""))
      ? String(req.query.range)
      : "30";
    const days = parseInt(range, 10);

    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - (days - 1));

    const [bankTransactions, walletTransactions] = await Promise.all([
      TransactionHistory.find({
        TransactionTime: { $gte: fromDate },
      })
        .sort({ TransactionTime: -1 })
        .limit(5000)
        .lean(),
      WalletTransaction.find({
        createdAt: { $gte: fromDate },
      })
        .sort({ createdAt: -1 })
        .limit(5000)
        .lean(),
    ]);

    const transactions = [
      ...(bankTransactions || []).map((t) => ({
        Date: t.TransactionTime,
        TransactionID: t.TransactionID,
        User: t.SenderHolderName || t.ReceiverHolderName || "Bank User",
        Amount: toNumber(t.Amount),
        Status: t.Status || "",
        Type: t.Description || "Bank Transfer",
      })),
      ...(walletTransactions || []).map((t) => ({
        Date: t.createdAt,
        TransactionID: t.reference || String(t._id || ""),
        User: t?.metadata?.senderName || t?.metadata?.recipientName || "Wallet User",
        Amount: toNumber(t.amount),
        Status: t.status || "",
        Type: t.type || "Wallet",
      })),
    ]
      .sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0))
      .slice(0, 5000);

    const headers = ["Date", "TXN ID", "User", "Amount", "Status", "Type"];
    const rows = transactions.map((t) => [
      t.Date ? new Date(t.Date).toLocaleDateString("en-IN") : "",
      t.TransactionID || "",
      t.User || "Unknown",
      Number(t.Amount || 0),
      t.Status || "",
      t.Type || "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="statistics-report-${range}d.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("Statistics Export Error:", err);
    return res.status(500).json({ success: false });
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
    const successfulTransactions = await TransactionHistory.countDocuments({ Status: { $in: ["Success", "success"] } });
    const failedTransactions = await TransactionHistory.countDocuments({ Status: { $in: ["Failed", "failed", "declined", "Declined"] } });
    const pendingTransactions = await TransactionHistory.countDocuments({ Status: { $in: ["Pending", "pending"] } });
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

    const verification = {
      verified: await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: { $in: ["approved", "verified"] } }),
      unverified: await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "not_started" }),
      pending: await ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "pending" }),
    };

    const byHour = await TransactionHistory.aggregate([
      {
        $addFields: {
          hour: { $hour: { $ifNull: ["$TransactionTime", "$createdAt"] } },
        },
      },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const hourlyMap = new Map((byHour || []).map((r) => [Number(r._id), Number(r.count || 0)]));
    const transactionTimes = Array.from({ length: 24 }).map((_, h) => hourlyMap.get(h) || 0);

    const methodAgg = await TransactionHistory.aggregate([
      {
        $addFields: {
          method: {
            $toLower: {
              $convert: {
                input: { $ifNull: ["$Type", "$TransactionType"] },
                to: "string",
                onError: "other",
                onNull: "other",
              },
            },
          },
        },
      },
      { $group: { _id: "$method", count: { $sum: 1 } } },
    ]);

    const paymentMethods = { bank: 0, card: 0, wallet: 0 };
    (methodAgg || []).forEach((row) => {
      const key = String(row._id || "other");
      const count = Number(row.count || 0);
      if (/(bank|neft|imps|rtgs)/i.test(key)) paymentMethods.bank += count;
      else if (/(card|visa|master|rupay)/i.test(key)) paymentMethods.card += count;
      else paymentMethods.wallet += count;
    });

    const merchantCategoriesAgg = await Merchant.aggregate([
      {
        $addFields: {
          cat: {
            $toLower: {
              $convert: {
                input: { $ifNull: ["$BusinessCategory", "$Category"] },
                to: "string",
                onError: "other",
                onNull: "other",
              },
            },
          },
        },
      },
      { $group: { _id: "$cat", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const merchantCategories = { retail: 0, food: 0, tech: 0, services: 0, other: 0 };
    (merchantCategoriesAgg || []).forEach((row) => {
      const key = String(row._id || "other");
      const count = Number(row.count || 0);
      if (/(retail|ecommerce|shopping)/i.test(key)) merchantCategories.retail += count;
      else if (/(food|restaurant|grocery)/i.test(key)) merchantCategories.food += count;
      else if (/(tech|software|it)/i.test(key)) merchantCategories.tech += count;
      else if (/(service|consult|agency)/i.test(key)) merchantCategories.services += count;
      else merchantCategories.other += count;
    });

    const topMerchants = await Merchant.find({})
      .sort({ TotalVolume: -1 })
      .limit(5)
      .select("BusinessName TotalVolume")
      .lean();

    const bankStats = await Banks.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("BankName Status")
      .lean();
    
    res.json({
      success: true,
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        retention: totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0,
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
        pending: pendingTransactions,
        payouts: successfulTransactions,
      },
      merchants: {
        active: activeMerchants,
        pending: pendingMerchants
      },
      banks: {
        connected: connectedBanks
      },
      charts: {
        verification,
        transactionTimes,
        paymentMethods,
        merchantCategories,
      },
      tables: {
        topMerchants,
        bankStats,
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
    res.locals.adminPage = "activity-monitor";
    res.render("admin/dashboard/admin-real-time-monitor", {
      user: req.session.user,
      page: "activity-monitor",
      adminPage: "activity-monitor",
      pageTitle: "Admin Real-Time Monitor - ZenoPay"
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
    const period = ["7", "30", "month"].includes(String(req.query.period || ""))
      ? String(req.query.period)
      : "month";

    const now = new Date();
    let startDate;
    let periodLabel;

    switch (period) {
      case "7":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        periodLabel = "Last 7 Days";
        break;
      case "30":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        periodLabel = "Last 30 Days";
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        break;
    }

    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime() + 1) / (24 * 60 * 60 * 1000)));

    const previousEnd = new Date(startDate);
    previousEnd.setMilliseconds(-1);
    const previousStart = new Date(previousEnd);
    previousStart.setHours(0, 0, 0, 0);
    previousStart.setDate(previousStart.getDate() - (periodDays - 1));

    const txNormalizeStage = {
      $addFields: {
        _date: { $ifNull: ["$TransactionTime", "$createdAt"] },
        _amount: {
          $convert: {
            input: { $ifNull: ["$Amount", "$amount"] },
            to: "double",
            onError: 0,
            onNull: 0,
          },
        },
        _status: {
          $toLower: {
            $convert: {
              input: { $ifNull: ["$Status", "$status"] },
              to: "string",
              onError: "",
              onNull: "",
            },
          },
        },
        _type: {
          $ifNull: [
            "$Type",
            {
              $ifNull: [
                "$type",
                {
                  $ifNull: [
                    "$TransactionType",
                    {
                      $ifNull: ["$Description", "Unknown"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };

    const txPeriodMatch = {
      $match: {
        _date: { $gte: startDate, $lte: endDate },
      },
    };

    const userDateMatch = {
      $or: [
        { RegistrationDate: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } },
      ],
    };

    const prevUserDateMatch = {
      $or: [
        { RegistrationDate: { $gte: previousStart, $lte: previousEnd } },
        { createdAt: { $gte: previousStart, $lte: previousEnd } },
      ],
    };

    const [
      totalRevenue,
      previousRevenue,
      activeUsers,
      previousActiveUsers,
      txnVolumeResult,
      previousTxnVolumeResult,
      avgTxnResult,
      previousAvgTxnResult,
      revenueByDay,
      usersByDay,
      txnByType,
      failureByDay,
    ] = await Promise.all([
      TransactionHistory.aggregate([
        txNormalizeStage,
        txPeriodMatch,
        { $match: { _status: { $in: ["completed", "success"] } } },
        { $group: { _id: null, total: { $sum: "$_amount" } } },
      ]).catch(() => []),

      TransactionHistory.aggregate([
        txNormalizeStage,
        {
          $match: {
            _date: { $gte: previousStart, $lte: previousEnd },
          },
        },
        { $match: { _status: { $in: ["completed", "success"] } } },
        { $group: { _id: null, total: { $sum: "$_amount" } } },
      ]).catch(() => []),

      ZenoPayUser.countDocuments(userDateMatch).catch(() => 0),

      ZenoPayUser.countDocuments(prevUserDateMatch).catch(() => 0),

      TransactionHistory.aggregate([
        txNormalizeStage,
        txPeriodMatch,
        { $count: "count" },
      ]).catch(() => []),

      TransactionHistory.aggregate([
        txNormalizeStage,
        {
          $match: {
            _date: { $gte: previousStart, $lte: previousEnd },
          },
        },
        { $count: "count" },
      ]).catch(() => []),

      TransactionHistory.aggregate([
        txNormalizeStage,
        txPeriodMatch,
        { $match: { _status: { $in: ["completed", "success"] } } },
        { $group: { _id: null, avg: { $avg: "$_amount" } } },
      ]).catch(() => []),

      TransactionHistory.aggregate([
        txNormalizeStage,
        {
          $match: {
            _date: { $gte: previousStart, $lte: previousEnd },
          },
        },
        { $match: { _status: { $in: ["completed", "success"] } } },
        { $group: { _id: null, avg: { $avg: "$_amount" } } },
      ]).catch(() => []),

      TransactionHistory.aggregate([
        txNormalizeStage,
        txPeriodMatch,
        { $match: { _status: { $in: ["completed", "success"] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$_date" } },
            total: { $sum: "$_amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]).catch(() => []),

      ZenoPayUser.aggregate([
        { $match: userDateMatch },
        {
          $addFields: {
            _userDate: { $ifNull: ["$RegistrationDate", "$createdAt"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$_userDate" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).catch(() => []),

      TransactionHistory.aggregate([
        txNormalizeStage,
        txPeriodMatch,
        {
          $group: {
            _id: "$_type",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]).catch(() => []),

      TransactionHistory.aggregate([
        txNormalizeStage,
        txPeriodMatch,
        { $match: { _status: { $in: ["failed", "declined"] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$_date" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).catch(() => []),
    ]);

    const buildDateRange = (start, end) => {
      const dates = [];
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      while (cur <= end) {
        dates.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    };

    const dateRange = buildDateRange(startDate, endDate);

    const revenueMap = {};
    (revenueByDay || []).forEach((d) => {
      revenueMap[d._id] = Number(d.total || 0);
    });

    const usersMap = {};
    (usersByDay || []).forEach((d) => {
      usersMap[d._id] = Number(d.count || 0);
    });

    const failureMap = {};
    (failureByDay || []).forEach((d) => {
      failureMap[d._id] = Number(d.count || 0);
    });

    const revenueLabels = dateRange.map((d) =>
      new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    );

    const revenueData = dateRange.map((d) => revenueMap[d] || 0);
    const newUsersData = dateRange.map((d) => usersMap[d] || 0);
    const failureData = dateRange.map((d) => failureMap[d] || 0);
    const activeUsersData = newUsersData.reduce((acc, n, idx) => {
      const prev = idx > 0 ? acc[idx - 1] : 0;
      acc.push(prev + n);
      return acc;
    }, []);

    const typeLabels = (txnByType || []).map((t) => String(t._id || "Unknown"));
    const typeData = (txnByType || []).map((t) => Number(t.count || 0));

    const analytics = {
      totalRevenue: Number(totalRevenue?.[0]?.total || 0),
      activeUsers: Number(activeUsers || 0),
      txnVolume: Number(txnVolumeResult?.[0]?.count || 0),
      avgTransaction: Math.round(Number(avgTxnResult?.[0]?.avg || 0)),
      revenueLabels,
      revenueData,
      userLabels: revenueLabels,
      newUsersData,
      activeUsersData,
      txnTypeLabels: typeLabels.length ? typeLabels : ["No Data"],
      txnBreakdown: typeData.length ? typeData : [0],
      failureLabels: revenueLabels,
      failureData,
      periodLabel,
      period,
      trends: {
        totalRevenue: formatPercentage(Number(totalRevenue?.[0]?.total || 0), Number(previousRevenue?.[0]?.total || 0)),
        activeUsers: formatPercentage(Number(activeUsers || 0), Number(previousActiveUsers || 0)),
        txnVolume: formatPercentage(Number(txnVolumeResult?.[0]?.count || 0), Number(previousTxnVolumeResult?.[0]?.count || 0)),
        avgTransaction: formatPercentage(Number(avgTxnResult?.[0]?.avg || 0), Number(previousAvgTxnResult?.[0]?.avg || 0)),
      },
    };

    res.locals.adminPage = "analytics";
    res.render("admin/analytics/admin-business-analytics", {
      pageTitle: "Admin Business Analytics",
      currentPage: "analytics",
      page: "analytics",
      adminPage: "analytics",
      user: req.session.user,
      admin: req.session.user,
      analytics,
      period,
    });
  } catch (error) {
    console.error("❌ getAnalytics ERROR:", error);
    res.locals.adminPage = "analytics";
    res.render("admin/analytics/admin-business-analytics", {
      pageTitle: "Admin Business Analytics",
      currentPage: "analytics",
      page: "analytics",
      adminPage: "analytics",
      user: req.session.user,
      admin: req.session.user,
      analytics: {
        totalRevenue: 0,
        activeUsers: 0,
        txnVolume: 0,
        avgTransaction: 0,
        revenueLabels: ["No Data"],
        revenueData: [0],
        userLabels: ["No Data"],
        newUsersData: [0],
        activeUsersData: [0],
        txnTypeLabels: ["No Data"],
        txnBreakdown: [1],
        failureLabels: ["No Data"],
        failureData: [0],
        periodLabel: "This Month",
        period: "month",
        trends: {
          totalRevenue: 0,
          activeUsers: 0,
          txnVolume: 0,
          avgTransaction: 0,
        },
      },
      period: "month",
      error: error?.message || "Unknown analytics error",
    });
  }
};

// GET Reports Page
const getReports = async (req, res) => {
  try {
    const allowedRanges = ["7", "30", "90"];
    const selectedRange = allowedRanges.includes(String(req.query.range || ""))
      ? String(req.query.range)
      : "7";

    const formatLabel = (days, date) => {
      if (days <= 7) {
        return new Date(date).toLocaleDateString("en-IN", { weekday: "short" });
      }
      return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    };

    const sanitizeCountMap = (rows = []) => {
      const out = new Map();
      (rows || []).forEach((r) => {
        if (!r?._id) return;
        out.set(String(r._id), Number(r.count || 0));
      });
      return out;
    };

    const buildDateRange = (days) => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));

      const prevEnd = new Date(start);
      prevEnd.setMilliseconds(-1);
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - days);

      return { start, end, prevStart, prevEnd };
    };

    const toTrendPct = (current, previous) => {
      const c = Number(current || 0);
      const p = Number(previous || 0);
      if (!c && !p) return 0;
      if (!p) return 100;
      return Number((((c - p) / p) * 100).toFixed(1));
    };

    const buildRangeData = async (days) => {
      const { start, end, prevStart, prevEnd } = buildDateRange(days);

      const txMatchCurrent = { TransactionTime: { $gte: start, $lte: end } };
      const txMatchPrev = { TransactionTime: { $gte: prevStart, $lte: prevEnd } };
      const userCurrentMatch = {
        Role: "user",
        $or: [{ RegistrationDate: { $gte: start, $lte: end } }, { createdAt: { $gte: start, $lte: end } }],
      };
      const userPrevMatch = {
        Role: "user",
        $or: [
          { RegistrationDate: { $gte: prevStart, $lte: prevEnd } },
          { createdAt: { $gte: prevStart, $lte: prevEnd } },
        ],
      };

      const [
        totalRevenueAgg,
        prevRevenueAgg,
        totalTransactions,
        prevTransactions,
        newUsers,
        prevNewUsers,
        activeWallets,
        prevActiveWallets,
        txByDay,
        txByType,
        successByDay,
        failedByDay,
        pendingByDay,
        supportOpenByDay,
        supportClosedByDay,
        kycApproved,
        kycPending,
        kycRejected,
        kycNotStarted,
        topMerchantsRaw,
      ] = await Promise.all([
        TransactionHistory.aggregate([
          { $match: txMatchCurrent },
          { $group: { _id: null, total: { $sum: { $toDouble: "$Amount" } } } },
        ]).catch(() => []),
        TransactionHistory.aggregate([
          { $match: txMatchPrev },
          { $group: { _id: null, total: { $sum: { $toDouble: "$Amount" } } } },
        ]).catch(() => []),
        TransactionHistory.countDocuments(txMatchCurrent).catch(() => 0),
        TransactionHistory.countDocuments(txMatchPrev).catch(() => 0),
        ZenoPayUser.countDocuments(userCurrentMatch).catch(() => 0),
        ZenoPayUser.countDocuments(userPrevMatch).catch(() => 0),
        Wallet.countDocuments({ isActive: true, updatedAt: { $gte: start, $lte: end } }).catch(() => 0),
        Wallet.countDocuments({ isActive: true, updatedAt: { $gte: prevStart, $lte: prevEnd } }).catch(() => 0),
        TransactionHistory.aggregate([
          { $match: txMatchCurrent },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
              revenue: { $sum: { $toDouble: "$Amount" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).catch(() => []),
        TransactionHistory.aggregate([
          { $match: txMatchCurrent },
          {
            $addFields: {
              _type: {
                $toLower: {
                  $convert: {
                    input: { $ifNull: ["$Type", { $ifNull: ["$TransactionType", "$Description"] }] },
                    to: "string",
                    onError: "other",
                    onNull: "other",
                  },
                },
              },
            },
          },
          { $group: { _id: "$_type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 4 },
        ]).catch(() => []),
        TransactionHistory.aggregate([
          { $match: { ...txMatchCurrent, Status: { $in: ["success", "Success", "completed"] } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).catch(() => []),
        TransactionHistory.aggregate([
          { $match: { ...txMatchCurrent, Status: { $in: ["failed", "Failed", "declined", "Declined"] } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).catch(() => []),
        TransactionHistory.aggregate([
          { $match: { ...txMatchCurrent, Status: { $in: ["pending", "Pending"] } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$TransactionTime" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).catch(() => []),
        ContactSubmission.aggregate([
          { $match: { submitted_at: { $gte: start, $lte: end }, status: { $in: ["new", "read", "in_progress"] } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$submitted_at" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).catch(() => []),
        ContactSubmission.aggregate([
          { $match: { submitted_at: { $gte: start, $lte: end }, status: { $in: ["replied", "closed"] } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$submitted_at" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).catch(() => []),
        ZenoPayUser.countDocuments({ Role: "user", KYCStatus: { $in: ["approved", "verified"] } }).catch(() => 0),
        ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "pending" }).catch(() => 0),
        ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "rejected" }).catch(() => 0),
        ZenoPayUser.countDocuments({ Role: "user", KYCStatus: "not_started" }).catch(() => 0),
        Merchant.find({})
          .sort({ TotalVolume: -1 })
          .limit(10)
          .lean()
          .catch(() => []),
      ]);

      const dateKeys = [];
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      while (cursor <= end) {
        dateKeys.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }

      const byDayMap = new Map((txByDay || []).map((r) => [String(r._id), r]));
      const successMap = sanitizeCountMap(successByDay);
      const failedMap = sanitizeCountMap(failedByDay);
      const pendingMap = sanitizeCountMap(pendingByDay);
      const supportOpenMap = sanitizeCountMap(supportOpenByDay);
      const supportClosedMap = sanitizeCountMap(supportClosedByDay);

      const revenueLabels = [];
      const revenueValues = [];
      const txCounts = [];
      const successCounts = [];
      const failedCounts = [];
      const pendingCounts = [];
      const supportOpenCounts = [];
      const supportClosedCounts = [];
      const userGrowthValues = [];

      let cumulativeUsers = 0;
      const usersByDay = await ZenoPayUser.aggregate([
        {
          $match: {
            Role: "user",
            $or: [
              { RegistrationDate: { $gte: start, $lte: end } },
              { createdAt: { $gte: start, $lte: end } },
            ],
          },
        },
        {
          $addFields: {
            _userDate: { $ifNull: ["$RegistrationDate", "$createdAt"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$_userDate" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).catch(() => []);
      const usersMap = sanitizeCountMap(usersByDay);

      dateKeys.forEach((d) => {
        const k = d.toISOString().slice(0, 10);
        revenueLabels.push(formatLabel(days, d));
        const daily = byDayMap.get(k);
        revenueValues.push(Math.round(Number(daily?.revenue || 0)));
        txCounts.push(Number(daily?.count || 0));
        successCounts.push(Number(successMap.get(k) || 0));
        failedCounts.push(Number(failedMap.get(k) || 0));
        pendingCounts.push(Number(pendingMap.get(k) || 0));
        supportOpenCounts.push(Number(supportOpenMap.get(k) || 0));
        supportClosedCounts.push(Number(supportClosedMap.get(k) || 0));
        const newUsersToday = Number(usersMap.get(k) || 0);
        cumulativeUsers += newUsersToday;
        userGrowthValues.push(cumulativeUsers);
      });

      const topMerchants = (topMerchantsRaw || []).map((merchant, idx) => {
        const totalVol = Number(merchant.TotalVolume || 0);
        const txCount = Number(merchant.TransactionCount || 0);
        const avgTicket = txCount > 0 ? Math.round(totalVol / txCount) : 0;
        return {
          rank: idx + 1,
          name: merchant.BusinessName || "Unknown Merchant",
          transactions: txCount,
          volume: totalVol,
          avgTicket,
          status: String(merchant.Status || (merchant.IsActive ? "active" : "inactive")).toLowerCase(),
        };
      });

      const currentRevenue = Number(totalRevenueAgg?.[0]?.total || 0);
      const previousRevenue = Number(prevRevenueAgg?.[0]?.total || 0);

      const txTypeLabels = (txByType || []).map((t) => String(t._id || "other").replace(/(^.|\s.)/g, (m) => m.toUpperCase()));
      const txTypeData = (txByType || []).map((t) => Number(t.count || 0));

      return {
        kpis: {
          totalRevenue: currentRevenue,
          totalTransactions: Number(totalTransactions || 0),
          newUsers: Number(newUsers || 0),
          activeWallets: Number(activeWallets || 0),
          revenueTrend: toTrendPct(currentRevenue, previousRevenue),
          transactionsTrend: toTrendPct(totalTransactions, prevTransactions),
          usersTrend: toTrendPct(newUsers, prevNewUsers),
          walletsTrend: toTrendPct(activeWallets, prevActiveWallets),
        },
        revenue: { labels: revenueLabels, values: revenueValues },
        userGrowth: { labels: revenueLabels, values: userGrowthValues },
        kyc: {
          labels: ["Approved", "Pending", "Rejected", "Not Submitted"],
          values: [Number(kycApproved || 0), Number(kycPending || 0), Number(kycRejected || 0), Number(kycNotStarted || 0)],
        },
        txSuccess: {
          labels: revenueLabels,
          success: successCounts,
          failed: failedCounts,
          pending: pendingCounts,
        },
        support: {
          labels: revenueLabels,
          open: supportOpenCounts,
          closed: supportClosedCounts,
        },
        txBreakdown: {
          labels: txTypeLabels.length ? txTypeLabels : ["No Data"],
          values: txTypeData.length ? txTypeData : [0],
        },
        topMerchants,
      };
    };

    const [range7, range30, range90] = await Promise.all([
      buildRangeData(7),
      buildRangeData(30),
      buildRangeData(90),
    ]);

    const reportsData = {
      selectedRange,
      ranges: {
        "7": range7,
        "30": range30,
        "90": range90,
      },
    };

    res.locals.adminPage = "reports";
    res.render("admin/reports/admin-reports", {
      title: "Reports & Analytics",
      pageTitle: "Reports & Analytics - ZenoPay Admin",
      page: "reports",
      currentPage: "reports",
      adminPage: "reports",
      admin: req.session.user,
      user: req.session.user,
      reportsData,
    });
  } catch (error) {
    console.error("Reports error:", error);
    res.status(500).send("Error loading reports");
  }
};

// GET Analytics chart data API (Chart.js ready)
const getChartData = async (req, res) => {
  try {
    const now = new Date();

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setHours(0, 0, 0, 0);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);

    // Daily transaction volume (last 30 days)
    const dailyVolumeRaw = await WalletTransaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: { $ifNull: ["$amount", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayMap = new Map((dailyVolumeRaw || []).map((row) => [String(row._id), Number(row.total || 0)]));
    const dayLabels = [];
    const dayValues = [];

    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayLabels.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
      dayValues.push(Number(dayMap.get(key) || 0));
    }

    // Transaction type breakdown
    const typeRaw = await WalletTransaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $toLower: { $ifNull: ["$type", "other"] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const typeBuckets = { transfer: 0, topup: 0, withdrawal: 0 };
    (typeRaw || []).forEach((row) => {
      const key = String(row._id || "");
      const count = Number(row.count || 0);
      if (/(send|transfer|p2p|receive)/i.test(key)) typeBuckets.transfer += count;
      else if (/(topup|top-up|add)/i.test(key)) typeBuckets.topup += count;
      else if (/(withdraw|withdrawal)/i.test(key)) typeBuckets.withdrawal += count;
    });

    // New users per week (last 90 days)
    const weeklyUsersRaw = await ZenoPayUser.aggregate([
      {
        $match: {
          Role: "user",
          RegistrationDate: { $gte: ninetyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$RegistrationDate" },
            week: { $isoWeek: "$RegistrationDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const weeklyLabels = (weeklyUsersRaw || []).map((row) => `W${row._id.week}-${row._id.year}`);
    const weeklyValues = (weeklyUsersRaw || []).map((row) => Number(row.count || 0));

    return res.json({
      success: true,
      dailyTransactionVolume: {
        labels: dayLabels,
        datasets: [
          {
            label: "Daily Transaction Volume",
            data: dayValues,
          },
        ],
      },
      transactionTypeBreakdown: {
        labels: ["Transfer", "Topup", "Withdrawal"],
        datasets: [
          {
            label: "Transaction Type Breakdown",
            data: [typeBuckets.transfer, typeBuckets.topup, typeBuckets.withdrawal],
          },
        ],
      },
      weeklyUserRegistrations: {
        labels: weeklyLabels,
        datasets: [
          {
            label: "New User Registrations",
            data: weeklyValues,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Chart data error:", error);
    return res.status(500).json({ success: false, message: "Failed to load chart data" });
  }
};

// Export Reports
const exportReports = async (req, res) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase();
    const range = ["7", "30", "90", "365"].includes(String(req.query.range || ""))
      ? String(req.query.range)
      : "30";
    const days = parseInt(range, 10);

    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - (days - 1));

    const [transactions, users, merchants] = await Promise.all([
      TransactionHistory.find({ TransactionTime: { $gte: fromDate } })
        .sort({ TransactionTime: -1 })
        .limit(5000)
        .lean(),
      ZenoPayUser.find({
        Role: "user",
        $or: [{ RegistrationDate: { $gte: fromDate } }, { createdAt: { $gte: fromDate } }],
      })
        .sort({ RegistrationDate: -1, createdAt: -1 })
        .limit(5000)
        .lean(),
      Merchant.find({ createdAt: { $gte: fromDate } })
        .sort({ createdAt: -1 })
        .limit(5000)
        .lean(),
    ]);

    const transactionRows = (transactions || []).map((t) => {
      const txDate = t.TransactionTime ? new Date(t.TransactionTime) : (t.createdAt ? new Date(t.createdAt) : new Date());
      const rawType = String(t.Type || t.TransactionType || t.Description || "transaction").toLowerCase();
      const type = /top/.test(rawType)
        ? "topup"
        : /with/.test(rawType)
          ? "withdrawal"
          : "transfer";
      const amount = Number(toNumber(t.Amount || t.amount || 0));
      const status = String(t.Status || t.status || "pending");
      const referenceId = t.TransactionID || t.reference || t._id?.toString() || "";
      const counterparty = t.ReceiverHolderName || t.SenderHolderName || t.ReceiverAccountNumber || t.SenderAccountNumber || "N/A";

      return {
        Date: txDate.toLocaleDateString("en-IN"),
        Type: type,
        Amount: amount,
        Status: status,
        "Reference ID": referenceId,
        Counterparty: counterparty,
      };
    });

    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const filename = `admin-reports-${range}d.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      doc.pipe(res);

      doc.fontSize(16).text("ZenoPay Admin Transaction Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Range: Last ${range} days | Generated: ${new Date().toLocaleString("en-IN")}`, { align: "center" });
      doc.moveDown(1.2);

      const headers = ["Date", "Type", "Amount", "Status", "Reference ID", "Counterparty"];
      doc.fontSize(10).text(headers.join(" | "));
      doc.moveDown(0.3);

      transactionRows.slice(0, 400).forEach((row) => {
        const line = [row.Date, row.Type, row.Amount, row.Status, row["Reference ID"], row.Counterparty]
          .map((v) => String(v ?? ""))
          .join(" | ");

        if (doc.y > 760) {
          doc.addPage();
        }
        doc.fontSize(9).text(line, { lineBreak: true });
      });

      doc.end();
      return;
    }

    const csv = stringify(transactionRows, {
      header: true,
      columns: ["Date", "Type", "Amount", "Status", "Reference ID", "Counterparty"],
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="admin-reports-${range}d.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET Settings Page
const getSettings = async (req, res) => {
  try {
    res.locals.adminPage = "settings";
    res.render("admin/settings/admin-system-settings", {
      pageTitle: "Admin System Settings",
      currentPage: "settings",
      page: "settings",
      adminPage: "settings",
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
    await AdminSettings.findOneAndUpdate(
      {},
      { ...req.body, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET Payment Gateway Settings Page
const getPaymentGatewaySettings = async (req, res) => {
  try {
    res.locals.adminPage = "settings";
    res.render("admin/settings/admin-payment-gateway", {
      user: req.session.user,
      page: "settings",
      adminPage: "settings",
      pageTitle: "Payment Gateway Settings - ZenoPay Admin"
    });
  } catch (error) {
    console.error("Payment Gateway Settings error:", error);
    res.status(500).send("Error loading payment gateway settings");
  }
};

// Update Payment Gateway Settings
const updatePaymentGatewaySettings = async (req, res) => {
  try {
    const {
      environment,
      apiKey,
      secretKey,
      merchantId,
      webhookUrl,
      successUrl,
      failureUrl,
      paymentMethods,
      fees,
      advancedSettings
    } = req.body;

    // Validate required fields
    if (!apiKey || !secretKey || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "API Key, Secret Key, and Merchant ID are required"
      });
    }

    const settings = await PaymentGatewaySettings.getSettings();
    settings.environment = environment === "live" ? "live" : "test";
    settings.apiKey = String(apiKey || "").trim();
    settings.secretKey = String(secretKey || "").trim();
    settings.merchantId = String(merchantId || "").trim();
    settings.webhookUrl = String(webhookUrl || "").trim();
    settings.successUrl = String(successUrl || "").trim();
    settings.failureUrl = String(failureUrl || "").trim();
    settings.paymentMethods = paymentMethods && typeof paymentMethods === "object" ? paymentMethods : settings.paymentMethods;
    settings.advancedSettings = advancedSettings && typeof advancedSettings === "object" ? {
      ...settings.advancedSettings,
      ...advancedSettings,
    } : settings.advancedSettings;

    if (fees && typeof fees === "object") {
      Object.keys(fees).forEach((method) => {
        if (!settings.paymentMethods?.[method]) return;
        settings.paymentMethods[method].fee = Number(
          fees[method]?.gatewayFee ?? settings.paymentMethods[method].fee
        );
        settings.paymentMethods[method].platformFee = Number(
          fees[method]?.platformFee ?? settings.paymentMethods[method].platformFee
        );
      });
    }

    await settings.save();

    return res.json({
      success: true,
      message: "Payment gateway settings updated successfully",
      data: {
        environment: settings.environment,
        merchantId: settings.merchantId,
        paymentMethodsEnabled: Object.keys(settings.paymentMethods || {}).filter((key) => settings.paymentMethods[key]?.enabled),
        feesConfigured: Object.keys(fees || {}).length,
        advancedSettingsCount: Object.keys(settings.advancedSettings || {}).length,
      }
    });
  } catch (error) {
    console.error("Update Payment Gateway Settings error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getDashboardData,
  getStatistics,
  getStatisticsChartData,
  exportStatistics,
  getStatisticsData,
  getActivityMonitor,
  getLiveActivities,
  getAnalytics,
  getChartData,
  getReports,
  exportReports,
  getSettings,
  updateSettings,
  getPaymentGatewaySettings,
  updatePaymentGatewaySettings,
};
