const AadharDetails = require("../Models/ZenoPayUser");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");


const getProfile = async (req, res) => {
  try {
    
    console.log("Fetching profile for user:", req.session.user);

    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";

    const user = await AadharDetails.findOne({ ZenoPayID: zenoPayId });

    const bankAccounts = await BankAccount.find({ ZenoPayId: zenoPayId });

    let totalBalance = 0;
    bankAccounts.forEach((acc) => {
      totalBalance += parseFloat(acc.Balance.toString());
    });

    // Get account numbers for transaction lookup
    const accountNumbers = bankAccounts.map((acc) => acc.AccountNumber);

    // Fetch recent transactions
    const transactions = await TransactionHistory.find({
      $or: [
        { SenderAccountNumber: { $in: accountNumbers } },
        { ReceiverAccountNumber: { $in: accountNumbers } },
      ],
    })
      .sort({ TransactionTime: -1 })
      .limit(10);
 console.log(user);
    res.render("profile", {
      pageTitle: "User Profile",
      
      user: user,
      bankAccounts: bankAccounts,
      transactions: transactions,
      totalBalance: totalBalance,
      accountCount: bankAccounts.length,
      isLoggedIn: true,
      qrCode: req.session.qrCode || null,
    });
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.redirect("/dashboard");
  }
};

const updateProfile = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || null;
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      fullName,
      displayName,
      dob,
      phone,
      email,
      gender,
      address,
      city,
      state,
      pincode,
    } = req.body || {};

    const user = await AadharDetails.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (typeof fullName === "string" && fullName.trim()) {
      user.FullName = fullName.trim();
      user.name = fullName.trim();
    }

    if (typeof displayName === "string" && displayName.trim()) {
      user.userId = displayName.trim();
    }

    if (dob) user.DOB = dob;
    if (typeof email === "string" && email.trim()) user.Email = email.trim().toLowerCase();
    if (typeof gender === "string" && gender.trim()) user.Gender = gender.trim();
    if (typeof address === "string" && address.trim()) user.Address = address.trim();
    if (typeof city === "string" && city.trim()) user.City = city.trim();
    if (typeof state === "string" && state.trim()) user.State = state.trim();
    if (typeof pincode === "string" && pincode.trim()) user.Pincode = pincode.trim();

    const normalizedPhone = String(phone || "").replace(/\D/g, "").slice(-10);
    if (normalizedPhone) {
      user.Mobile = normalizedPhone;
      user.PhoneNumber = normalizedPhone;
    }

    await user.save();

    req.session.user = {
      ...(req.session.user || {}),
      ZenoPayID: user.ZenoPayID,
      FullName: user.FullName,
      Mobile: user.Mobile,
      Email: user.Email,
      PhoneNumber: user.PhoneNumber || user.Mobile,
      name: user.name || user.FullName,
      email: user.email || user.Email,
    };

    return res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile Update Error:", err);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

const postOnboarding = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || null;
    if (!zenoPayId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      fullName,
      displayName,
      dob,
      accountHolder,
      bankName,
      ifsc,
      accountType,
      preferences,
      kycSkipped,
    } = req.body || {};

    const user = await AadharDetails.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (typeof fullName === "string" && fullName.trim()) {
      user.FullName = fullName.trim();
      user.name = fullName.trim();
    }
    if (typeof displayName === "string" && displayName.trim()) {
      user.userId = displayName.trim();
    }
    if (dob) user.DOB = dob;

    if (typeof accountHolder === "string" && accountHolder.trim()) {
      user.FatherName = user.FatherName || accountHolder.trim();
    }

    if (typeof bankName === "string" && bankName.trim()) {
      user.BankName = bankName.trim();
    }

    if (typeof ifsc === "string" && ifsc.trim()) {
      user.IFSC = ifsc.trim().toUpperCase();
    }

    if (typeof accountType === "string" && accountType.trim()) {
      user.AccountType = accountType.trim();
    }

    if (preferences && typeof preferences === "object") {
      user.NotificationPreferences = {
        ...(user.NotificationPreferences || {}),
        emailNotifications: !!preferences.emailNotifications,
        smsNotifications: !!preferences.smsNotifications,
        transactionAlerts: !!preferences.transactionAlerts,
      };
    }

    if (kycSkipped === true && String(user.KYCStatus || "").toLowerCase() === "not_started") {
      user.KYCStatus = "not_started";
      user.kycStatus = "Not Submitted";
    }

    await user.save();

    req.session.user = {
      ...(req.session.user || {}),
      ZenoPayID: user.ZenoPayID,
      FullName: user.FullName,
      Mobile: user.Mobile,
      Email: user.Email,
      name: user.name || user.FullName,
    };

    return res.json({ success: true, message: "Onboarding details saved" });
  } catch (err) {
    console.error("Onboarding Save Error:", err);
    return res.status(500).json({ success: false, message: "Failed to save onboarding details" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  postOnboarding,
};
