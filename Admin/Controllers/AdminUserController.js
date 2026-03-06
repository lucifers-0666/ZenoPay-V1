const User = require("../../Models/User");
const BankAccount = require("../../Models/BankAccount");
const TransactionHistory = require("../../Models/TransactionHistory");
const bcrypt = require("bcryptjs");

const statusToLegacyVariants = {
  Active: ["Active", "active"],
  Inactive: ["Inactive", "inactive"],
  Suspended: ["Suspended", "suspended"],
};

const kycToLegacyVariants = {
  Verified: ["Verified", "verified", "approved"],
  Pending: ["Pending", "pending"],
  Rejected: ["Rejected", "rejected"],
  "Not Submitted": ["Not Submitted", "not_started"],
};

const roleToLegacyVariants = {
  User: ["User", "user"],
  Merchant: ["Merchant", "merchant"],
  Admin: ["Admin", "admin"],
  "Super Admin": ["Super Admin"],
};

const mapKycToUi = (value = "") => {
  const v = String(value || "").toLowerCase();
  if (v === "verified" || v === "approved") return "Verified";
  if (v === "pending") return "Pending";
  if (v === "rejected") return "Rejected";
  return "Not Submitted";
};

const mapRoleToUi = (value = "") => {
  const v = String(value || "").toLowerCase();
  if (v === "merchant") return "Merchant";
  if (v === "admin") return "Admin";
  if (v === "super admin") return "Super Admin";
  return "User";
};

const mapStatusToUi = (value = "") => {
  const v = String(value || "").toLowerCase();
  if (v === "suspended") return "Suspended";
  if (v === "inactive") return "Inactive";
  return "Active";
};

const mapKycToLegacy = (value = "") => {
  const v = String(value || "").toLowerCase();
  if (v === "verified") return "verified";
  if (v === "pending") return "pending";
  if (v === "rejected") return "rejected";
  return "not_started";
};

const mapRoleToLegacy = (value = "") => {
  const v = String(value || "").toLowerCase();
  if (v === "merchant") return "merchant";
  if (v === "admin" || v === "super admin") return "admin";
  return "user";
};

const normalizeUser = (doc = {}) => ({
  _id: doc._id,
  name: doc.name || doc.FullName || "Unknown",
  email: doc.email || doc.Email || "",
  phone: doc.phone || doc.Mobile || "",
  userId: doc.userId || doc.ZenoPayID || "",
  avatar: doc.avatar || "",
  avatarColor: doc.avatarColor || "#3B82F6",
  role: mapRoleToUi(doc.role || doc.Role),
  kycStatus: mapKycToUi(doc.kycStatus || doc.KYCStatus),
  status: mapStatusToUi(doc.status || doc.AccountStatus || doc.Status),
  balance: Number(doc.balance || 0),
  createdAt: doc.createdAt || doc.RegistrationDate || new Date(),
});

const buildUserFilter = ({ search = "", status = "", kyc = "", role = "", dateFrom = "", dateTo = "" }) => {
  const filter = {};

  if (search.trim()) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [
      { name: regex },
      { FullName: regex },
      { email: regex },
      { Email: regex },
      { phone: regex },
      { Mobile: regex },
      { userId: regex },
      { ZenoPayID: regex },
    ];
  }

  if (status && status !== "All Status") {
    const values = statusToLegacyVariants[status] || [status];
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { status: { $in: values } },
        { AccountStatus: { $in: values } },
        { Status: { $in: values } },
      ],
    });
  }

  if (kyc && kyc !== "All KYC") {
    const values = kycToLegacyVariants[kyc] || [kyc];
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { kycStatus: { $in: values } },
        { KYCStatus: { $in: values } },
      ],
    });
  }

  if (role && role !== "All Role") {
    const values = roleToLegacyVariants[role] || [role];
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { role: { $in: values } },
        { Role: { $in: values } },
      ],
    });
  }

  if (dateFrom || dateTo) {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    const dateOr = [];

    if (from && to) {
      dateOr.push({ createdAt: { $gte: from, $lte: to } });
      dateOr.push({ RegistrationDate: { $gte: from, $lte: to } });
    } else if (from) {
      dateOr.push({ createdAt: { $gte: from } });
      dateOr.push({ RegistrationDate: { $gte: from } });
    } else if (to) {
      dateOr.push({ createdAt: { $lte: to } });
      dateOr.push({ RegistrationDate: { $lte: to } });
    }

    if (dateOr.length) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: dateOr });
    }
  }

  return filter;
};

const buildSort = (sort = "createdAt", order = "desc") => {
  const dir = order === "asc" ? 1 : -1;
  const fieldMap = {
    createdAt: "RegistrationDate",
    name: "FullName",
    email: "Email",
    phone: "Mobile",
    userId: "ZenoPayID",
    role: "Role",
    kycStatus: "KYCStatus",
    status: "AccountStatus",
    balance: "balance",
  };
  const field = fieldMap[sort] || "RegistrationDate";
  return { [field]: dir };
};

// GET All Users
const getUsersList = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      role = "",
      kyc = "",
      dateFrom = "",
      dateTo = "",
      page = 1,
      limit = 20,
      sort = "createdAt",
      order = "desc",
      view = "table",
    } = req.query;

    const viewMode = ["table", "grid", "columns"].includes(String(view))
      ? String(view)
      : "table";

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * pageSize;

    const filter = buildUserFilter({ search, status, kyc, role, dateFrom, dateTo });
    const sortObj = buildSort(sort, order);

    const [usersRaw, totalCount, totalUsers, verifiedKYC, pendingKYC, suspended, newToday] = await Promise.all([
      User.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(pageSize)
        .select("-Password")
        .lean(),

      User.countDocuments(filter),
      User.countDocuments({}),
      User.countDocuments({
        $or: [
          { kycStatus: { $in: kycToLegacyVariants.Verified } },
          { KYCStatus: { $in: kycToLegacyVariants.Verified } },
        ],
      }),
      User.countDocuments({
        $or: [
          { kycStatus: { $in: kycToLegacyVariants.Pending } },
          { KYCStatus: { $in: kycToLegacyVariants.Pending } },
        ],
      }),
      User.countDocuments({
        $or: [
          { status: { $in: statusToLegacyVariants.Suspended } },
          { AccountStatus: { $in: statusToLegacyVariants.Suspended } },
          { Status: { $in: statusToLegacyVariants.Suspended } },
        ],
      }),
      User.countDocuments({
        $or: [
          { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          { RegistrationDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        ],
      }),
    ]);

    const users = usersRaw.map(normalizeUser);

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(0);
    lastMonthEnd.setHours(23, 59, 59, 999);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const [lastMonthUsers, thisMonthUsers] = await Promise.all([
      User.countDocuments({
        $or: [
          { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } },
          { RegistrationDate: { $gte: lastMonthStart, $lte: lastMonthEnd } },
        ],
      }),
      User.countDocuments({
        $or: [
          { createdAt: { $gte: thisMonthStart } },
          { RegistrationDate: { $gte: thisMonthStart } },
        ],
      }),
    ]);

    const growthPct = lastMonthUsers > 0
      ? (((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1)
      : null;

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const newYesterday = await User.countDocuments({
      $or: [
        { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } },
        { RegistrationDate: { $gte: yesterdayStart, $lte: yesterdayEnd } },
      ],
    });
    const newTodayDiff = newToday - newYesterday;

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const from = totalCount === 0 ? 0 : skip + 1;
    const to = Math.min(skip + pageSize, totalCount);

    if (req.query.api === "true") {
      return res.json({
        success: true,
        data: users,
        stats: {
          totalUsers,
          verifiedKYC,
          pendingKYC,
          suspended,
          newToday,
          newTodayDiff,
          growthPct,
        },
        filters: { search, status, kyc, role, dateFrom, dateTo, sort, order },
        viewMode,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers: totalCount,
          limit: pageSize,
          from,
          to,
        },
      });
    }

    res.locals.adminPage = "users";
    res.render("admin/users/admin-user-management", {
      pageTitle: "User Management",
      currentPage: "users",
      page: "users",
      adminPage: "users",
      admin: req.session.user,
      users,
      stats: {
        totalUsers,
        verifiedKYC,
        pendingKYC,
        suspended,
        newToday,
        newTodayDiff,
        growthPct,
      },
      pagination: {
        current: pageNum,
        total: totalPages,
        count: totalCount,
        limit: pageSize,
        from,
        to,
      },
      filters: { search, status, kyc, role, dateFrom, dateTo, sort, order },
      viewMode,
      title: "User Management",
      breadcrumb: [
        { label: "Admin", url: "/admin/dashboard" },
        { label: "User Management", url: null },
      ],
    });
  } catch (error) {
    console.error("getUsersList error:", error);
    if (req.query.api === "true") {
      return res.status(500).json({
        success: false,
        error: "Failed to load users",
      });
    }

    return res.status(500).render("admin/users/admin-user-management", {
      pageTitle: "User Management",
      currentPage: "users",
      page: "users",
      adminPage: "users",
      admin: req.session.user,
      users: [],
      stats: {
        totalUsers: 0,
        verifiedKYC: 0,
        pendingKYC: 0,
        suspended: 0,
        newToday: 0,
        newTodayDiff: 0,
        growthPct: null,
      },
      pagination: {
        current: 1,
        total: 1,
        count: 0,
        limit: 20,
        from: 0,
        to: 0,
      },
      filters: {
        search: "",
        status: "",
        role: "",
        kyc: "",
        dateFrom: "",
        dateTo: "",
        sort: "createdAt",
        order: "desc",
      },
      viewMode: "table",
      errorMessage: "Failed to load users",
    });
  }
};

const getAllUsers = getUsersList;

const exportUsersCSV = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      role = "",
      kyc = "",
      dateFrom = "",
      dateTo = "",
    } = req.query;

    const filter = buildUserFilter({ search, status, kyc, role, dateFrom, dateTo });
    const usersRaw = await User.find(filter)
      .sort({ RegistrationDate: -1 })
      .lean();
    const users = usersRaw.map(normalizeUser);

    const headers = [
      "User ID", "Name", "Email", "Phone",
      "Role", "KYC Status", "Status", "Balance", "Joined",
    ];

    const rows = users.map((u) => [
      u.userId || "",
      u.name || "",
      u.email || "",
      u.phone || "",
      u.role || "",
      u.kycStatus || "",
      u.status || "",
      Number(u.balance || 0).toFixed(2),
      new Date(u.createdAt).toLocaleDateString("en-IN"),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="zenopay-users-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("exportUsersCSV error:", error);
    return res.status(500).json({ error: "CSV export failed" });
  }
};

const bulkUserAction = async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No users selected" });
    }

    let result;
    switch (action) {
      case "suspend":
        result = await User.updateMany(
          { _id: { $in: userIds } },
          {
            $set: {
              status: "Suspended",
              AccountStatus: "Suspended",
              Status: "suspended",
            },
          }
        );
        break;
      case "activate":
        result = await User.updateMany(
          { _id: { $in: userIds } },
          {
            $set: {
              status: "Active",
              AccountStatus: "Active",
              Status: "active",
            },
          }
        );
        break;
      case "delete":
        result = await User.deleteMany({ _id: { $in: userIds } });
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    const affected = result.modifiedCount || result.deletedCount || 0;
    return res.json({
      success: true,
      message: `${action} applied to ${affected} users`,
    });
  } catch (error) {
    console.error("bulkUserAction error:", error);
    return res.status(500).json({ error: "Bulk action failed" });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const userRaw = await User.findById(req.params.id).lean();

    if (!userRaw) {
      if (req.query.api === "true") {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      return res.status(404).render("admin/users/admin-user-management", {
        pageTitle: "User Management",
        currentPage: "users",
        page: "users",
        adminPage: "users",
        admin: req.session.user,
        users: [],
        stats: {
          totalUsers: 0,
          verifiedKYC: 0,
          pendingKYC: 0,
          suspended: 0,
          newToday: 0,
          newTodayDiff: 0,
          growthPct: null,
        },
        pagination: {
          current: 1,
          total: 1,
          count: 0,
          limit: 20,
          from: 0,
          to: 0,
        },
        filters: {
          search: "",
          status: "",
          role: "",
          kyc: "",
          dateFrom: "",
          dateTo: "",
          sort: "createdAt",
          order: "desc",
        },
        viewMode: "table",
        errorMessage: "User not found",
      });
    }

    const user = {
      ...normalizeUser(userRaw),
      _id: userRaw._id,
      twoFactorEnabled: Boolean(userRaw.twoFactorEnabled || userRaw.TwoFactorEnabled),
      updatedAt: userRaw.updatedAt || new Date(),
    };

    let recentTransactions = [];
    try {
      const TransactionHistoryModel = require("../../Models/TransactionHistory");
      recentTransactions = await TransactionHistoryModel.find({
        $or: [{ SenderID: req.params.id }, { ReceiverID: req.params.id }, { userId: req.params.id }],
      })
        .sort({ createdAt: -1, TransactionDate: -1 })
        .limit(5)
        .lean();
    } catch (_e) {
      recentTransactions = [];
    }

    if (req.query.api === "true") {
      return res.json({
        success: true,
        data: {
          ...user,
          recentTransactions,
        },
      });
    }

    res.locals.adminPage = "users";
    return res.render("admin/user-detail", {
      pageTitle: `User — ${user.name}`,
      title: `User — ${user.name}`,
      currentPage: "users",
      page: "users",
      adminPage: "users",
      admin: req.session.user,
      breadcrumb: [
        { label: "Admin", url: "/admin/dashboard" },
        { label: "User Management", url: "/admin/users" },
        { label: user.name, url: null },
      ],
      user,
      recentTransactions,
    });
  } catch (error) {
    console.error("getUserDetail error:", error);
    if (req.query.api === "true") {
      return res.status(500).json({
        success: false,
        error: "Failed to load user",
      });
    }

    return res.status(500).render("admin/users/admin-user-management", {
      pageTitle: "User Management",
      currentPage: "users",
      page: "users",
      adminPage: "users",
      admin: req.session.user,
      users: [],
      stats: {
        totalUsers: 0,
        verifiedKYC: 0,
        pendingKYC: 0,
        suspended: 0,
        newToday: 0,
        newTodayDiff: 0,
        growthPct: null,
      },
      pagination: {
        current: 1,
        total: 1,
        count: 0,
        limit: 20,
        from: 0,
        to: 0,
      },
      filters: {
        search: "",
        status: "",
        role: "",
        kyc: "",
        dateFrom: "",
        dateTo: "",
        sort: "createdAt",
        order: "desc",
      },
      viewMode: "table",
      errorMessage: "Failed to load user",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      status,
      kycStatus,
      sendWelcome,
    } = req.body;

    const errors = [];

    if (!name || String(name).trim().length < 2) {
      errors.push({ field: "name", message: "Name is required (min 2 chars)" });
    }

    const emailValue = String(email || "").toLowerCase().trim();
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.push({ field: "email", message: "Valid email is required" });
    }

    if (!password || String(password).length < 8) {
      errors.push({ field: "password", message: "Password min 8 characters" });
    }

    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }

    const existing = await User.findOne({
      $or: [{ email: emailValue }, { Email: emailValue }],
    }).lean();

    if (existing) {
      return res.status(400).json({
        success: false,
        errors: [{ field: "email", message: "Email already registered" }],
      });
    }

    const count = await User.countDocuments();
    const userId = `USR-${String(count + 1).padStart(5, "0")}`;

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
    const firstChar = String(name || "U").trim().charCodeAt(0) || 85;
    const avatarColor = colors[firstChar % colors.length];

    const passwordHash = await bcrypt.hash(String(password), 12);

    const onlyDigits = String(phone || "").replace(/\D/g, "");
    const mobile = (onlyDigits.length >= 10 ? onlyDigits.slice(-10) : "9999999999");

    const user = await User.create({
      name: String(name).trim(),
      email: emailValue,
      phone: String(phone || "").trim(),
      userId,
      avatarColor,
      role: role || "User",
      status: status || "Active",
      kycStatus: kycStatus || "Not Submitted",
      Password: passwordHash,
      ZenoPayID: userId,
      FullName: String(name).trim(),
      Email: emailValue,
      Mobile: mobile,
      DOB: new Date("2000-01-01"),
      Gender: "Male",
      FatherName: "N/A",
      Address: "N/A",
      City: "N/A",
      State: "N/A",
      Pincode: "000000",
      Role: mapRoleToLegacy(role || "User"),
      AccountStatus: status || "Active",
      KYCStatus: mapKycToLegacy(kycStatus || "Not Submitted"),
    });

    // Placeholder for welcome email workflow
    void sendWelcome;

    return res.json({
      success: true,
      user: {
        name: user.name || user.FullName,
        userId: user.userId || user.ZenoPayID,
      },
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
};

// GET User Details
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-Password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get additional user information
    const bankAccounts = await BankAccount.find({ UserID: id }).lean();
    const transactions = await TransactionHistory.find({
      $or: [{ SenderID: id }, { ReceiverID: id }],
    })
      .sort({ TransactionDate: -1 })
      .limit(10)
      .lean();

    const userProfile = {
      ...user,
      bankAccounts: bankAccounts || [],
      recentTransactions: transactions || [],
      accountStatus: user.Status || "active",
      verificationStatus: user.Verification?.KYCStatus || "pending",
    };

    // Return JSON for API or render for HTML
    if (req.query.api === "true") {
      return res.json({
        success: true,
        data: userProfile,
      });
    }

    res.locals.adminPage = "users";
    res.render("admin/users/admin-user-details", {
      pageTitle: "User Details",
      page: "users",
      adminPage: "users",
      user: userProfile,
      admin: req.session.user,
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user details",
    });
  }
};

// POST Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, mobile, status, role } = req.body;

    // Validation
    if (!id || !fullName || !email || !mobile) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Check email uniqueness (excluding current user)
    const existingEmail = await User.findOne({
      Email: email,
      _id: { $ne: id },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      {
        name: fullName,
        FullName: fullName,
        email,
        Email: email,
        phone: mobile,
        Mobile: mobile,
        status: mapStatusToUi(status || "Active"),
        role: mapRoleToUi(role || "User"),
        Status: status || "active",
        Role: role || "user",
      },
      { new: true }
    ).select("-Password");

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
};

// POST Suspend User
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        status: "Suspended",
        AccountStatus: "Suspended",
        Status: "suspended",
        SuspensionReason: reason || "Admin suspension",
        SuspensionDate: new Date(),
      },
      { new: true }
    ).select("-Password");

    // Send notification email
    if (user && user.Email) {
      // TODO: Send suspension email notification
    }

    res.json({
      success: true,
      message: "User suspended successfully",
      data: user,
    });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to suspend user",
    });
  }
};

// POST Activate User
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {
        status: "Active",
        AccountStatus: "Active",
        Status: "active",
        SuspensionReason: null,
        SuspensionDate: null,
      },
      { new: true }
    ).select("-Password");

    res.json({
      success: true,
      message: "User activated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to activate user",
    });
  }
};

// POST Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - mark as deleted instead of removing
    const user = await User.findByIdAndUpdate(
      id,
      {
        status: "Inactive",
        AccountStatus: "Inactive",
        Status: "deleted",
        DeletedDate: new Date(),
      },
      { new: true }
    ).select("-Password");

    res.json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
};

// POST Reset User Password
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(
      id,
      { Password: hashedPassword },
      { new: true }
    ).select("-Password");

    res.json({
      success: true,
      message: "User password reset successfully",
      data: user,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
};

// GET User Statistics
const getUserStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments({
        $or: [{ Role: "user" }, { role: "User" }],
      }),
      totalMerchants: await User.countDocuments({
        $or: [{ Role: "merchant" }, { role: "Merchant" }],
      }),
      totalAdmins: await User.countDocuments({
        $or: [{ Role: "admin" }, { role: "Admin" }],
      }),
      activeUsers: await User.countDocuments({
        $or: [
          { status: { $in: statusToLegacyVariants.Active } },
          { AccountStatus: { $in: statusToLegacyVariants.Active } },
          { Status: { $in: statusToLegacyVariants.Active } },
        ],
      }),
      suspendedUsers: await User.countDocuments({
        $or: [
          { status: { $in: statusToLegacyVariants.Suspended } },
          { AccountStatus: { $in: statusToLegacyVariants.Suspended } },
          { Status: { $in: statusToLegacyVariants.Suspended } },
        ],
      }),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
};

module.exports = {
  getUsersList,
  getAllUsers,
  exportUsersCSV,
  bulkUserAction,
  createUser,
  getUserDetail,
  getUserDetails,
  updateUser,
  suspendUser,
  activateUser,
  deleteUser,
  resetUserPassword,
  getUserStats,
};
