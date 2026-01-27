const ZenoPayUser = require("../../Models/ZenoPayUser");
const BankAccount = require("../../Models/BankAccount");
const TransactionHistory = require("../../Models/TransactionHistory");

// GET All Users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search
      ? {
          Role: "user",
          $or: [
            { FullName: { $regex: search, $options: "i" } },
            { ZenoPayID: { $regex: search, $options: "i" } },
            { Email: { $regex: search, $options: "i" } },
            { Mobile: { $regex: search, $options: "i" } },
          ],
        }
      : { Role: "user" };

    // Get users
    const users = await ZenoPayUser.find(searchQuery)
      .sort({ RegistrationDate: -1 })
      .skip(skip)
      .limit(limit)
      .select("-Password");

    const totalUsers = await ZenoPayUser.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/users", {
      pageTitle: "User Management",
      currentPage: "users",
      admin: req.session.user,
      users,
      pagination: {
        page,
        limit,
        totalPages,
        totalUsers,
      },
      search,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).send("Error loading users");
  }
};

// GET User Details
const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user details
    const user = await ZenoPayUser.findOne({ ZenoPayID: userId }).select("-Password");
    
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Get user's bank accounts
    const bankAccounts = await BankAccount.find({ ZenoPayId: userId });

    // Get user's transaction history
    const accountNumbers = bankAccounts.map(acc => acc.AccountNumber);
    const transactions = await TransactionHistory.find({
      $or: [
        { SenderAccountNumber: { $in: accountNumbers } },
        { ReceiverAccountNumber: { $in: accountNumbers } },
      ],
    })
      .sort({ TransactionTime: -1 })
      .limit(10);

    // Calculate transaction stats
    const transactionStats = await TransactionHistory.aggregate([
      {
        $match: {
          $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$Amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.render("admin/user-details", {
      pageTitle: "User Details",
      currentPage: "users",
      admin: req.session.user,
      user,
      bankAccounts,
      transactions,
      stats: transactionStats.length > 0 ? transactionStats[0] : { totalAmount: 0, count: 0 },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).send("Error loading user details");
  }
};

// Suspend User
const suspendUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Update user status (you may need to add a Status field to your model)
    await ZenoPayUser.findOneAndUpdate(
      { ZenoPayID: userId },
      { $set: { Status: "suspended" } }
    );

    res.json({ success: true, message: "User suspended successfully" });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Activate User
const activateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    await ZenoPayUser.findOneAndUpdate(
      { ZenoPayID: userId },
      { $set: { Status: "active" } }
    );

    res.json({ success: true, message: "User activated successfully" });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user has any active transactions or balances
    const bankAccounts = await BankAccount.find({ ZenoPayId: userId });
    const hasBalance = bankAccounts.some(acc => acc.Balance > 0);
    
    if (hasBalance) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete user with active balance" 
      });
    }

    await ZenoPayUser.findOneAndDelete({ ZenoPayID: userId });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET All Users List Page
const getUsersList = async (req, res) => {
  try {
    res.render("users/list", {
      user: req.session.user,
      pageTitle: "User Management - ZenoPay"
    });
  } catch (error) {
    console.error("Users List Error:", error);
    res.status(500).send("Error loading users list");
  }
};

// GET Users Data API
const getUsersData = async (req, res) => {
  try {
    const users = await ZenoPayUser.find({ Role: "user" })
      .sort({ RegistrationDate: -1 })
      .limit(100)
      .select("-Password");
    
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.ZenoPayID || u._id,
        name: u.FullName,
        email: u.Email,
        phone: u.Mobile,
        registrationDate: u.RegistrationDate,
        status: u.IsActive ? 'active' : 'suspended',
        verification: u.IsVerified ? 'verified' : 'pending',
        lastActive: u.LastLogin || u.RegistrationDate
      }))
    });
  } catch (error) {
    console.error("Users Data Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUsersList,
  getUsersData,
  getUserDetails,
  suspendUser,
  activateUser,
  deleteUser,
};
