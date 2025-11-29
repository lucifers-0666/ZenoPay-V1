const BankAccount = require("../Models/BankAccount");
const BankBranch = require("../Models/BankBranch"); // Assuming you saved the provided schema as BankBranch.js

const getOpenAccount = (req, res) => {
  res.render("OpenAccount", {
    pageTitle: "Open Bank Account",
  });
};

const verifyIFSC = async (req, res) => {
  const { ifsc } = req.body;
  console.log("Verifying IFSC:", ifsc);

  try {
    const branch = await BankBranch.findOne({ IFSC: ifsc.toUpperCase() });

    if (branch) {
      return res.status(200).json({
        success: true,
        message: "Branch Details Found!",
        branch: {
          BankName: branch.BankName,
          BranchName: branch.BranchName,
          City: branch.City,
          State: branch.State,
          BranchEmail: branch.BranchEmail,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Invalid IFSC Code. Branch not found.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error during verification." });
  }
};

const postOpenAccount = async (req, res) => {
  try {
    const data = req.body;
    const file = req.file;
 console.log("Opening Account with data:", data);
    // 1. Check if Account Number already exists
    const existingAccount = await BankAccount.findOne({ AccountNumber: data.accountNumber });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Account Number collision! Please regenerate.",
      });
    }

    const newAccount = new BankAccount({
      AccountNumber: data.accountNumber,
      BankName: data.bankName,
      BranchName: data.branchName,
      IFSC: data.ifsc,
      BranchCity: data.branchCity,
      BranchState: data.branchState,
      BranchEmail: data.branchEmail,
      AccountType: data.accountType,
      OpeningBalance: data.openingBalance,
      TransactionLimit: data.txnLimit,
      
      // Personal Details
      AadharNumber: data.aadharNumber.replace(/\s/g, ""),
      FullName: data.fullName,
      DOB: data.dob,
      Gender: data.gender,
      Profession: data.profession,
      AnnualIncome: data.annualIncome,
      PanNumber: data.panNumber,
      Email: data.email,
      Mobile: data.mobile,
      City: data.city,
      State: data.state,
      Pincode: data.pincode,
      
      // Image
      ProfileImagePath: file ? `/AccountProfileImages/${file.filename}` : null,
      
      // Debit Card Details
      DebitCardNumber: data.debitCardNumber.replace(/\s/g, ""),
      NameOnCard: data.nameOnCard,
      CardExpiry: data.cardExpiry, // MM/YY
      CardCVV: data.cardCVV,
      CardPIN: data.cardPin, // Hashing recommended in production
      CardType: "Visa Classic", // Defaulting for demo
    });

    await newAccount.save();

    res.status(200).json({
      success: true,
      message: "Bank Account Opened Successfully!",
      accountNumber: newAccount.AccountNumber
    });

  } catch (err) {
    console.error("Open Account Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not open account.",
    });
  }
};

module.exports = {
  getOpenAccount,
  postOpenAccount,
  verifyIFSC,
};