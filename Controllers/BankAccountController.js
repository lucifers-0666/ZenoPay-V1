
const BankAccount = require("../Models/BankAccount");
const BankBranch = require("../Models/Banks");
const ZenoPayDetails = require("../Models/ZenoPayUser");
const {
  maskCardNumber,
  createCardFingerprint,
  encryptCardNumber,
  hashPin,
} = require("../utils/cardSecurity");

const normalizeLookupValue = (value) => String(value || "").trim();
const normalizeEmail = (value) => normalizeLookupValue(value).toLowerCase();
const normalizePhone = (value) => normalizeLookupValue(value).replace(/\D/g, "").slice(-10);

const findUserByIdentity = async (rawValue) => {
  const raw = normalizeLookupValue(rawValue);
  if (!raw) return null;

  const email = raw.includes("@") ? normalizeEmail(raw) : "";
  const phone = normalizePhone(raw);
  const or = [{ ZenoPayID: raw }, { userId: raw }];

  if (email) {
    or.push({ Email: email }, { email });
  }

  if (phone) {
    or.push({ Mobile: phone }, { phone }, { PhoneNumber: phone });
  }

  return ZenoPayDetails.findOne({ $or: or });
};

const getOpenAccount = async (req, res) => {
  res.render("open-account", {
    currentPage: "Open Bank Account",
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
};

const postOpenAccount = async (req, res) => {
  try {
    const data = req.body;

    // Verify ZenoPay user exists by ID, email, or mobile
    const zenoPayUser = await findUserByIdentity(data.ZenoPayId);
    if (!zenoPayUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid ZenoPay ID, email, or mobile number",
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

    // Generate PIN (4 digits)
    const cardPIN = Math.floor(1000 + Math.random() * 9000).toString();

    const cardMasked = maskCardNumber(cardNumber);
    const cardLast4 = cardNumber.slice(-4);
    const cardFingerprint = createCardFingerprint(cardNumber);
    const cardNumberEncrypted = encryptCardNumber(cardNumber);
    const cardPINHash = await hashPin(cardPIN);

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
      ZenoPayId: zenoPayUser.ZenoPayID || zenoPayUser.userId,
      FullName: data.FullName || zenoPayUser.FullName,
      DOB: data.DOB || zenoPayUser.DOB,
      Gender: data.Gender || zenoPayUser.Gender,
      Profession: data.Profession,
      AnnualIncome: data.AnnualIncome,
      Email: data.Email || zenoPayUser.Email || zenoPayUser.email,
      Mobile: data.Mobile || zenoPayUser.Mobile || zenoPayUser.phone,
      City: data.City || zenoPayUser.City,
      State: data.State || zenoPayUser.State,
      Pincode: data.Pincode || zenoPayUser.Pincode,
      DebitCardNumber: cardMasked,
      CardLast4: cardLast4,
      CardFingerprint: cardFingerprint,
      CardNumberEncrypted: cardNumberEncrypted,
      NameOnCard: String(data.FullName || zenoPayUser.FullName || "").toUpperCase(),
      CardExpiry: cardExpiry,
      CardPINHash: cardPINHash,
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
