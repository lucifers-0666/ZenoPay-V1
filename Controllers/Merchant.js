// const AadharDetails = require("../Models/AadharDetails");
const BankAccount = require("../Models/BankAccount");
const crypto = require("crypto");

// Render the page with user's accounts
const getCreateApiKeyPage = async (req, res) => {
    try {
        if (!req.session.isLoggedIn || !req.session.user) {
            return res.redirect("/login");
        }

        const userAadhar = req.session.user.aadharNumber;

        // Fetch all accounts for this user to populate the dropdown
        const accounts = await BankAccount.find({ AadharNumber: userAadhar });
        
        // Fetch current user details to see existing keys
        const user = await AadharDetails.findById(req.session.user._id);

        res.render("create-api-key", {
            pageTitle: "Merchant API Setup",
            user: req.session.user,
            accounts: accounts,
            existingBusiness: user.BusinessName,
            existingKey: user.api_key,
            existingSecret: user.api_secret,
            linkedAccount: user.api_key ? user.api_key.substring(0, 11) : null // Extract IFSC from key for display
        });
    } catch (err) {
        console.error(err);
        res.redirect("/");
    }
};

// Generate Keys linked to specific Account via IFSC prefix
const generateKeys = async (req, res) => {
    try {
        const { businessName, accountNumber } = req.body;
        const userId = req.session.user._id;
        const userAadhar = req.session.user.aadharNumber;

        if (!businessName || !accountNumber) {
            return res.status(400).json({ success: false, message: "Business Name and Account are required." });
        }

        // 1. Find the specific bank account to get the IFSC
        const account = await BankAccount.findOne({ 
            AccountNumber: accountNumber, 
            AadharNumber: userAadhar 
        });
        
        if (!account) {
            return res.status(404).json({ success: false, message: "Bank Account not found or unauthorized." });
        }

        // 2. Generate Keys
        // Requirement: "in the starting of api key add the branchIFSC"
        const ifsc = account.IFSC; // 11 characters
        const randomPart = crypto.randomBytes(16).toString("hex");
        const apiKey = `${ifsc}${randomPart}`; // Format: SBIN0001234a1b2c3d4...
        
        const apiSecret = "sk_" + crypto.randomBytes(32).toString("hex");

        // 3. Store in AadharDetails (User Schema) as requested
        const user = await AadharDetails.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.BusinessName = businessName;
        user.api_key = apiKey;
        user.api_secret = apiSecret;
        user.Role = "merchant"; // Upgrade user to merchant

        await user.save();

        // Update session role if needed
        req.session.user.role = "merchant";

        res.status(200).json({
            success: true,
            message: "Merchant Credentials Generated Successfully!",
            data: {
                apiKey,
                apiSecret,
                linkedIFSC: ifsc
            }
        });

    } catch (err) {
        console.error("Merchant Key Gen Error:", err);
        if (err.code === 11000) {
             return res.status(400).json({ success: false, message: "API Key generation collision. Please try again." });
        }
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

module.exports = {
    getCreateApiKeyPage,
    generateKeys
};