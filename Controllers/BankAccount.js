
const BankAccount = require("../Models/BankAccount");
const BankBranch = require("../Models/Banks");
const ZenoPayDetails = require("../Models/ZenoPayUser");

const getOpenAccount = async (req, res) => {
  res.render("OpenAccount", {
    currentPage: "Open Bank Account",
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
};

const postOpenAccount = async (req, res) => {
  try {
    const data = req.body;

    // Verify ZenoPay ID exists
    const zenoPayUser = await ZenoPayDetails.findOne({
      ZenoPayID: data.ZenoPayId,
    });
    if (!zenoPayUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid ZenoPay ID",
      });
    }

    // Generate Account Number (16 digits)
    const accountNumber = Date.now().toString() + Math.floor(Math.random() * 1000);

    // Generate Debit Card Number (16 digits)
    const cardNumber =
      "4" +
      Math.floor(Math.random() * 1000000000000000)
        .toString()
        .padStart(15, "0");

    // Generate Card Expiry (5 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);
    const cardExpiry = `${String(expiryDate.getMonth() + 1).padStart(
      2,
      "0"
    )}/${expiryDate.getFullYear().toString().substr(-2)}`;

    // Generate CVV (3 digits)
    const cardCVV = Math.floor(100 + Math.random() * 900).toString();

    // Generate PIN (4 digits)
    const cardPIN = Math.floor(1000 + Math.random() * 9000).toString();

    // Get Bank Name from BankId
    const bank = await BankBranch.findOne({ BankId: data.BankId });
    if (!bank) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bank ID",
      });
    }

    const newAccount = new BankAccount({
      AccountNumber: accountNumber,
      BankName: data.BankName,
      BankId: data.BankId,
      BankCity: data.BankCity,
      BankState: data.BankState,
      BankEmail: data.BankEmail,
      AccountType: data.AccountType,
      OpeningBalance: data.OpeningBalance,
      Balance: data.OpeningBalance,
      TransactionLimit: data.TransactionLimit,
      ZenoPayId: data.ZenoPayId,
      FullName: data.FullName,
      DOB: data.DOB,
      Gender: data.Gender,
      Profession: data.Profession,
      AnnualIncome: data.AnnualIncome,
      Email: data.Email,
      Mobile: data.Mobile,
      City: data.City,
      State: data.State,
      Pincode: data.Pincode,
      DebitCardNumber: cardNumber,
      NameOnCard: data.FullName.toUpperCase(),
      CardExpiry: cardExpiry,
      CardCVV: cardCVV,
      CardPIN: cardPIN,
      CardType: data.CardType,
      DebitCardStatus: "Active",
      AccountStatus: "Active",
    });

    await newAccount.save();

    res.status(200).json({
      success: true,
      message: "Bank Account Opened Successfully!",
      accountNumber: accountNumber,
      cardNumber: cardNumber,
      cardExpiry: cardExpiry,
      cardCVV: cardCVV,
      cardPIN: cardPIN,
    });
  } catch (err) {
    console.error("Account Opening Error:", err);

    // Handle duplicate account number
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please try again.",
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

module.exports = {
  getOpenAccount,
  postOpenAccount,
};
