const BankBranch = require("../Models/BankBranch");

const getBankBranches = async (req, res) => {
  // Renders the branch.ejs view
  res.render("RegisterBranch", {
    pageTitle: "Register Branch",
  });
};

const postBankBranch = async (req, res) => {
  try {
    const data = req.body;

    // Check if IFSC already exists
    const existingBranch = await BankBranch.findOne({ IFSC: data.ifsc });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Branch with this IFSC already exists!",
      });
    }
  
    const newBranch = new BankBranch({
      IFSC: data.ifsc,
      BankName: data.bankName,
      BranchName: data.branchName,
      City: data.city,
      State: data.state,
      Pincode: data.pincode,
      BranchPhone: data.branchPhone,
      BranchEmail: data.branchEmail,
      ManagerName: data.managerName,
      ManagerMobile: data.managerMobile,
    });

    await newBranch.save();

    res.status(200).json({
      success: true,
      message: "Bank Branch Added Successfully!",
    });
  } catch (err) {
    console.error("Bank Branch Addition Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

module.exports = {
  getBankBranches,
  postBankBranch,
};
