const ZenoPayUser = require("../../Models/ZenoPayUser");
const BankAccount = require("../../Models/BankAccount");
const TransactionHistory = require("../../Models/TransactionHistory");
const bcrypt = require("bcryptjs");

// GET All Users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = { Role: "user" };
    
    if (search) {
      searchQuery.$or = [
        { FullName: { $regex: search, $options: "i" } },
        { ZenoPayID: { $regex: search, $options: "i" } },
        { Email: { $regex: search, $options: "i" } },
        { Mobile: { $regex: search, $options: "i" } },
      ];
    }

    if (role === "merchant") {
      searchQuery.Role = "merchant";
    } else if (role === "admin") {
      searchQuery.Role = "admin";
    }

    // Get users with pagination
    const users = await ZenoPayUser.find(searchQuery)
      .sort({ RegistrationDate: -1 })
      .skip(skip)
      .limit(limit)
      .select("-Password")
      .lean();

    const totalUsers = await ZenoPayUser.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    // Return JSON for API or render for HTML
    if (req.query.api === "true") {
      return res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
        },
      });
    }

    res.render("users/admin-user-management", {
      pageTitle: "User Management",
      currentPage: "users",
      admin: req.session.user,
      users,
      currentPage: page,
      totalPages,
      search,
      role,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
};

// GET User Details
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await ZenoPayUser.findById(id)
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

    res.render("users/user-details", {
      pageTitle: "User Details",
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
    const existingEmail = await ZenoPayUser.findOne({
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
    const user = await ZenoPayUser.findByIdAndUpdate(
      id,
      {
        FullName: fullName,
        Email: email,
        Mobile: mobile,
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

    const user = await ZenoPayUser.findByIdAndUpdate(
      id,
      {
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

    const user = await ZenoPayUser.findByIdAndUpdate(
      id,
      {
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
    const user = await ZenoPayUser.findByIdAndUpdate(
      id,
      {
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

    const user = await ZenoPayUser.findByIdAndUpdate(
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
      totalUsers: await ZenoPayUser.countDocuments({ Role: "user" }),
      totalMerchants: await ZenoPayUser.countDocuments({ Role: "merchant" }),
      totalAdmins: await ZenoPayUser.countDocuments({ Role: "admin" }),
      activeUsers: await ZenoPayUser.countDocuments({
        Role: "user",
        Status: "active",
      }),
      suspendedUsers: await ZenoPayUser.countDocuments({
        Role: "user",
        Status: "suspended",
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
  getAllUsers,
  getUserDetails,
  updateUser,
  suspendUser,
  activateUser,
  deleteUser,
  resetUserPassword,
  getUserStats,
};
