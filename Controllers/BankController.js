
const BankBranch = require("../Models/Banks");

const getBankBranches = async (req, res) => {
  // Renders the branch.ejs view
  res.render("register-bank", {
    pageTitle: "Register Bank",
    currentPage: "Register Bank",
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
};

const postBankBranch = async (req, res) => {
  try {
    const data = req.body;

    // Check if BankName already exists
    const existingName = await BankBranch.findOne({ BankName: data.BankName });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Bank with this name already exists!",
      });
    }

    // Generate Bank ID automatically from bank name
    // Extract capital letters from bank name
    const capitals = data.BankName.match(/[A-Z]/g);
    const prefix = capitals
      ? capitals.join("")
      : data.BankName.substring(0, 3).toUpperCase();

    // Generate 7 random digits
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000);

    // Create Bank ID (e.g., SBI-1234567, HDFC-9876543)
    const bankId = `${prefix}-${randomDigits}`;

    const newBranch = new BankBranch({
      BankName: data.BankName,
      BankId: bankId,
      City: data.City,
      State: data.State,
      Pincode: data.Pincode,
      BankPhone: data.BankPhone,
      BankEmail: data.BankEmail,
      ManagerName: data.ManagerName,
      ManagerMobile: data.ManagerMobile,
    });

    await newBranch.save();

    res.status(200).json({
      success: true,
      message: "Bank Registered Successfully!",
      bankId: bankId,
    });
  } catch (err) {
    console.error("Bank Registration Error:", err);

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Bank with this ${field} already exists!`,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  }
};

const getAllBanks = async (req, res) => {
  try {
    const banks = await BankBranch.find().sort({ RegistrationDate: -1 });
    res.render("banks-list", {
      pageTitle: "Registered Banks",
      banks: banks,
    });
  } catch (err) {
    console.error("Error fetching banks:", err);
    res.status(500).send("Error fetching banks");
  }
};

module.exports = {
  getBankBranches,
  postBankBranch,
  getAllBanks,
};
