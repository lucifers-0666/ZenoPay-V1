const Banks = require("../../Models/Banks");
const BankAccount = require("../../Models/BankAccount");

// GET All Banks
const getAllBanks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const searchQuery = search
      ? {
          $or: [
            { BankName: { $regex: search, $options: "i" } },
            { BankId: { $regex: search, $options: "i" } },
            { City: { $regex: search, $options: "i" } },
            { State: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const banks = await Banks.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBanks = await Banks.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalBanks / limit);

    res.render("banks/admin-bank-management", {
      pageTitle: "Admin Bank Management",
      currentPage: "banks",
      admin: req.session.user,
      banks,
      pagination: {
        page,
        limit,
        totalPages,
        totalBanks,
      },
      search,
    });
  } catch (error) {
    console.error("Get all banks error:", error);
    res.status(500).send("Error loading banks");
  }
};

// GET Pending Banks (if you add approval process)
const getPendingBanks = async (req, res) => {
  try {
    // Assuming you'll add IsApproved field
    const pendingBanks = await Banks.find({ IsApproved: false })
      .sort({ createdAt: -1 });

    res.render("banks/admin-bank-approvals", {
      pageTitle: "Admin Bank Approvals",
      currentPage: "banks",
      admin: req.session.user,
      banks: pendingBanks,
    });
  } catch (error) {
    console.error("Get pending banks error:", error);
    res.status(500).send("Error loading pending banks");
  }
};

// GET Bank Details
const getBankDetails = async (req, res) => {
  try {
    const bankId = req.params.id;
    
    const bank = await Banks.findById(bankId);

    if (!bank) {
      return res.status(404).send("Bank not found");
    }

    // Get accounts for this bank
    const accounts = await BankAccount.find({ BankName: bank.BankName })
      .limit(10)
      .sort({ createdAt: -1 });

    // Get stats
    const totalAccounts = await BankAccount.countDocuments({ BankName: bank.BankName });
    
    const balanceStats = await BankAccount.aggregate([
      { $match: { BankName: bank.BankName } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$Balance" },
        },
      },
    ]);

    const totalBalance = balanceStats.length > 0 ? balanceStats[0].totalBalance : 0;

    res.render("banks/admin-bank-details", {
      pageTitle: "Admin Bank Details",
      currentPage: "banks",
      admin: req.session.user,
      bank,
      accounts,
      stats: {
        totalAccounts,
        totalBalance,
      },
    });
  } catch (error) {
    console.error("Get bank details error:", error);
    res.status(500).send("Error loading bank details");
  }
};

// Approve Bank
const approveBank = async (req, res) => {
  try {
    const bankId = req.params.id;
    
    await Banks.findByIdAndUpdate(bankId, {
      $set: { IsApproved: true },
    });

    res.json({ success: true, message: "Bank approved successfully" });
  } catch (error) {
    console.error("Approve bank error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject Bank
const rejectBank = async (req, res) => {
  try {
    const bankId = req.params.id;
    
    await Banks.findByIdAndDelete(bankId);

    res.json({ success: true, message: "Bank rejected successfully" });
  } catch (error) {
    console.error("Reject bank error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Bank
const updateBank = async (req, res) => {
  try {
    const bankId = req.params.id;
    const updateData = req.body;

    await Banks.findByIdAndUpdate(bankId, updateData);

    res.json({ success: true, message: "Bank updated successfully" });
  } catch (error) {
    console.error("Update bank error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Bank
const deleteBank = async (req, res) => {
  try {
    const bankId = req.params.id;
    
    const bank = await Banks.findById(bankId);
    
    if (!bank) {
      return res.status(404).json({ success: false, error: "Bank not found" });
    }

    // Check if there are any accounts
    const accountCount = await BankAccount.countDocuments({ BankName: bank.BankName });
    
    if (accountCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete bank with existing accounts" 
      });
    }

    await Banks.findByIdAndDelete(bankId);

    res.json({ success: true, message: "Bank deleted successfully" });
  } catch (error) {
    console.error("Delete bank error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllBanks,
  getPendingBanks,
  getBankDetails,
  approveBank,
  rejectBank,
  updateBank,
  deleteBank,
};
