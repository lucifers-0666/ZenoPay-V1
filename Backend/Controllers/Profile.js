const AadharDetails = require("../Models/AadharDetails");
const PanDetails = require("../Models/PanDetails");
const BankAccount = require("../Models/BankAccount");
const TransactionHistory = require("../Models/TransactionHistory");

const getProfile = async (req, res) => {
  try {
    // 1. Check Session
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const aadharNumber = req.session.user.aadharNumber;

    // 2. Fetch User Details (Aadhaar)
    const user = await AadharDetails.findOne({ AadharNumber: aadharNumber });
    if (!user) {
        return res.redirect("/login"); // Should not happen if session is valid
    }

    // 3. Fetch PAN Details
    const pan = await PanDetails.findOne({ AadharNumber: aadharNumber });

    // 4. Fetch Bank Accounts
    const bankAccounts = await BankAccount.find({ AadharNumber: aadharNumber });

    // 5. Fetch Transactions (for all user accounts)
    // Get array of user's account numbers
    const accountNumbers = bankAccounts.map(acc => acc.AccountNumber);
    
    // Find transactions where user is either sender or receiver
    const transactions = await TransactionHistory.find({
        $or: [
            { SenderAccountNumber: { $in: accountNumbers } },
            { ReceiverAccountNumber: { $in: accountNumbers } }
        ]
    }).sort({ TransactionTime: -1 }).limit(20); // Last 20 transactions

    // 6. Calculate Total Balance
    let totalBalance = 0;
    bankAccounts.forEach(acc => {
        totalBalance += parseFloat(acc.OpeningBalance.toString());
    });

    // 7. Render View
    res.render("profile", {
      pageTitle: "User Profile",
      user: user,
      pan: pan,
      bankAccounts: bankAccounts,
      transactions: transactions,
      totalBalance: totalBalance
    });

  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.redirect("/");
  }
};

module.exports = {
  getProfile,
};