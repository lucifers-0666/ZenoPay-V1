const ZenoPayUser = require("../Models/ZenoPayUser");
const BankAccount = require("../Models/BankAccount");
const azureStorage = require("../Services/azureStorage");

// GET Settings Page
const getSettings = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    // Get linked bank accounts count
    const bankAccounts = await BankAccount.find({ ZenoPayId: zenoPayId });

    res.render("settings", {
      pageTitle: "Account Settings",
      user: user,
      bankAccountCount: bankAccounts.length,
      isLoggedIn: true,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null,
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    res.status(500).send("Error loading settings page");
  }
};

// GET Account Settings Page (Comprehensive)
const getAccountSettings = async (req, res) => {
  try {
    // TEMPORARY: Bypass auth for design review
    if (!req.session.isLoggedIn || !req.session.user) {
      req.session.isLoggedIn = true;
      req.session.user = { ZenoPayID: "ZP-DEMO2024" };
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    // Format last password change date
    let lastPasswordChangeDate = null;
    if (user.PasswordChangeDate) {
      lastPasswordChangeDate = user.PasswordChangeDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    res.render("account-settings", {
      pageTitle: "Account Settings",
      user: user,
      ZenoPayID: zenoPayId,
      lastPasswordChangeDate: lastPasswordChangeDate,
      isLoggedIn: true,
    });
  } catch (error) {
    console.error("Error loading account settings:", error);
    res.status(500).send("Error loading account settings page");
  }
};

// GET Change Password Page
const getChangePassword = async (req, res) => {
  try {
    // TEMPORARY: Bypass auth for design review
    if (!req.session.isLoggedIn || !req.session.user) {
      req.session.isLoggedIn = true;
      req.session.user = { ZenoPayID: "ZP-DEMO2024" };
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.redirect("/login");
    }

    // Format last password change date
    const lastPasswordChange = user.PasswordChangeDate
      ? new Date(user.PasswordChangeDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

    res.render("change-password", {
      pageTitle: "Change Password",
      user: user,
      lastPasswordChange: lastPasswordChange,
      isLoggedIn: true,
    });
  } catch (error) {
    console.error("Error loading change password page:", error);
    res.status(500).send("Error loading change password page");
  }
};

// Update Personal Information
const updatePersonalInfo = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const { Email, PhoneNumber, Address } = req.body;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update fields
    if (Email) user.Email = Email;
    if (PhoneNumber) user.PhoneNumber = PhoneNumber;
    if (Address) user.Address = Address;

    await user.save();

    // Update session
    req.session.user = user;

    res.json({ success: true, message: "Personal information updated successfully" });
  } catch (error) {
    console.error("Error updating personal info:", error);
    res.status(500).json({ success: false, message: "Failed to update information" });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const { currentPassword, newPassword, confirmPassword, signOutAll } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one uppercase letter" });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one number" });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must contain at least one special character" });
    }

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password (plain text comparison - matches project's auth pattern)
    if (user.Password !== currentPassword) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Check if new password is same as current
    if (newPassword === currentPassword) {
      return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }

    // Update to new password (plain text - matches project's auth pattern)
    user.Password = newPassword;
    user.PasswordChangeDate = new Date();
    await user.save();

    // Sign out of all devices if requested
    if (signOutAll) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
      return res.json({ 
        success: true, 
        message: "Password changed successfully. You have been signed out.",
        signedOut: true
      });
    }

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

// Update Profile Picture
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Upload to Azure Blob Storage
    const imageUrl = await azureStorage.uploadToAzure(req.file.buffer, req.file.originalname);

    // Update user's image path
    user.ImagePath = imageUrl;
    await user.save();

    // Update session
    req.session.user = user;

    res.json({ success: true, message: "Profile picture updated successfully", imageUrl: imageUrl });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ success: false, message: "Failed to update profile picture" });
  }
};

// Update Notification Preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const { emailNotifications, smsNotifications, transactionAlerts, promotionalEmails } = req.body;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Initialize NotificationPreferences if it doesn't exist
    if (!user.NotificationPreferences) {
      user.NotificationPreferences = {};
    }

    // Update notification preferences
    user.NotificationPreferences.emailNotifications = emailNotifications === 'true';
    user.NotificationPreferences.smsNotifications = smsNotifications === 'true';
    user.NotificationPreferences.transactionAlerts = transactionAlerts === 'true';
    user.NotificationPreferences.promotionalEmails = promotionalEmails === 'true';

    await user.save();
    req.session.user = user;

    res.json({ success: true, message: "Notification preferences updated successfully" });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ success: false, message: "Failed to update preferences" });
  }
};

// Deactivate Account
const deactivateAccount = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const zenoPayId = req.session.user.ZenoPayID;
    const { password, reason } = req.body;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify password (plain text comparison - matches project's auth pattern)
    if (user.Password !== password) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    // Check if user has any balance
    const bankAccounts = await BankAccount.find({ ZenoPayId: zenoPayId });
    const hasBalance = bankAccounts.some(acc => parseFloat(acc.Balance) > 0);

    if (hasBalance) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot deactivate account with remaining balance. Please transfer or withdraw all funds first." 
      });
    }

    // Mark account as inactive
    user.AccountStatus = "Inactive";
    user.DeactivationReason = reason;
    user.DeactivatedAt = new Date();
    await user.save();

    // Destroy session
    req.session.destroy();

    res.json({ success: true, message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating account:", error);
    res.status(500).json({ success: false, message: "Failed to deactivate account" });
  }
};

module.exports = {
  getSettings,
  getAccountSettings,
  getChangePassword,
  updatePersonalInfo,
  changePassword,
  updateProfilePicture,
  updateNotificationPreferences,
  deactivateAccount,
}
