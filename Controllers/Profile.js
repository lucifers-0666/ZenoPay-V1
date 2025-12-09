const AadharDetails = require("../Models/ZenoPayUser");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");


const getProfile = async (req, res) => {
  try {
    
    console.log("Fetching profile for user:", req.session.user);
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const zenoPayId = req.session.user.ZenoPayID;

    const user = await AadharDetails.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.redirect("/login");
    }

    const bankAccounts = await BankAccount.find({ ZenoPayId: zenoPayId });

    let totalBalance = 0;
    bankAccounts.forEach((acc) => {
      totalBalance += parseFloat(acc.OpeningBalance.toString());
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
    res.render("Profile", {
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

module.exports = {
  getProfile,
};
