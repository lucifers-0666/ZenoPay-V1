const ZenoPayUser = require("../Models/ZenoPayUser");
const BankAccount = require("../Models/BankAccount");
const azureStorage = require("../Services/azureStorage");

const getDefaultCategoriesByTab = () => {
  const email = [
    {
      icon: "fa-paper-plane",
      name: "Transactions",
      items: [
        { icon: "fa-paper-plane", title: "Money Sent", desc: "When you send money to someone", enabled: true },
        { icon: "fa-arrow-down", title: "Money Received", desc: "When someone sends you money", enabled: true },
        { icon: "fa-clock", title: "Payment Pending", desc: "When your payment is awaiting confirmation", enabled: true },
        { icon: "fa-times-circle", title: "Payment Failed", desc: "When a payment fails to process", enabled: true },
        { icon: "fa-undo", title: "Refund Processed", desc: "When a refund is credited to your account", enabled: true },
        { icon: "fa-calendar-check", title: "Scheduled Payment Executed", desc: "When a scheduled payment runs", enabled: true },
      ],
    },
    {
      icon: "fa-shield-alt",
      name: "Security",
      items: [
        { icon: "fa-sign-in-alt", title: "New Login", desc: "When a new device signs into your account", enabled: true },
        { icon: "fa-mobile-alt", title: "2FA Changes", desc: "When 2FA is enabled or disabled", enabled: true },
        { icon: "fa-lock", title: "Password Changed", desc: "When your password is updated", enabled: true },
        { icon: "fa-exclamation-triangle", title: "Suspicious Activity", desc: "When unusual behavior is detected", enabled: true },
      ],
    },
    {
      icon: "fa-user-circle",
      name: "Account",
      items: [
        { icon: "fa-user-check", title: "KYC Status Update", desc: "Approval or rejection of your KYC", enabled: true },
        { icon: "fa-wallet", title: "Balance Low Alert", desc: "When balance drops below ₹500", enabled: true },
        { icon: "fa-gift", title: "Referral Reward", desc: "When a referral bonus is credited", enabled: true },
      ],
    },
    {
      icon: "fa-bullhorn",
      name: "Marketing",
      items: [
        { icon: "fa-tag", title: "Offers & Promotions", desc: "Deals and discounts from ZenoPay", enabled: false },
        { icon: "fa-newspaper", title: "Product Updates", desc: "New features and improvements", enabled: true },
        { icon: "fa-envelope", title: "Newsletter", desc: "Monthly digest from ZenoPay", enabled: false },
      ],
    },
  ];

  return {
    email,
    sms: JSON.parse(JSON.stringify(email)),
    inapp: JSON.parse(JSON.stringify(email)),
    push: JSON.parse(JSON.stringify(email)),
  };
};

const buildDefaultNotificationState = (user) => {
  const prefs = user?.NotificationPreferences || {};
  const categoriesByTab = getDefaultCategoriesByTab();

  if (prefs.promotionalEmails === false) {
    const marketing = categoriesByTab.email.find((category) => category.name === "Marketing");
    if (marketing) {
      marketing.items.forEach((item) => {
        item.enabled = false;
      });
    }
  }

  return {
    tab: "email",
    paused: !!prefs.pauseAll,
    digestFrequency: prefs.digestFrequency || "real-time",
    quietHours: !!prefs.quietHours,
    quietFrom: prefs.quietFrom || "22:00",
    quietTo: prefs.quietTo || "07:00",
    categoriesByTab,
  };
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
};

// GET Settings Page
const getSettings = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });

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
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
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
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
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

// GET Notification Preferences Page (Granular)
const getNotificationPreferences = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    const dynamicState = user?.NotificationPreferences?.dynamicState;
    const notificationStateData =
      dynamicState && typeof dynamicState === "object"
        ? dynamicState
        : buildDefaultNotificationState(user);

    res.render("notification-preferences", {
      pageTitle: "Notification Preferences - ZenoPay",
      user,
      notificationStateData,
      isLoggedIn: true,
    });
  } catch (error) {
    console.error("Error loading notification preferences page:", error);
    res.status(500).send("Error loading notification preferences page");
  }
};

// Update Personal Information
const updatePersonalInfo = async (req, res) => {
  try {
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const {
      Email,
      email,
      PhoneNumber,
      phone,
      Address,
      address,
      fullName,
      dob,
      city,
      state,
      pincode,
    } = req.body;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update fields
    const resolvedEmail = Email || email;
    const resolvedPhone = PhoneNumber || phone;
    const resolvedAddress = Address || address;

    if (typeof fullName === "string" && fullName.trim()) user.FullName = fullName.trim();
    if (resolvedEmail) user.Email = resolvedEmail;
    if (resolvedPhone) user.PhoneNumber = String(resolvedPhone).replace(/\D/g, "").slice(-10);
    if (resolvedAddress) user.Address = resolvedAddress;
    if (dob) user.DOB = dob;
    if (typeof city === "string" && city.trim()) user.City = city.trim();
    if (typeof state === "string" && state.trim()) user.State = state.trim();
    if (pincode) user.Pincode = String(pincode).trim();

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
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
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
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
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
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
    const {
      emailNotifications,
      smsNotifications,
      transactionAlerts,
      promotionalEmails,
      notificationState,
    } = req.body;

    const user = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Initialize NotificationPreferences if it doesn't exist
    if (!user.NotificationPreferences) {
      user.NotificationPreferences = {};
    }

    if (notificationState && typeof notificationState === "object") {
      const categoriesByTab = notificationState.categoriesByTab || {};
      const emailCategories = Array.isArray(categoriesByTab.email) ? categoriesByTab.email : [];
      const smsCategories = Array.isArray(categoriesByTab.sms) ? categoriesByTab.sms : [];

      const flattenItems = (categories) => categories.flatMap((category) => (Array.isArray(category.items) ? category.items : []));
      const emailItems = flattenItems(emailCategories);
      const smsItems = flattenItems(smsCategories);
      const transactionCategory = emailCategories.find((category) => category.name === "Transactions");
      const marketingCategory = emailCategories.find((category) => category.name === "Marketing");

      user.NotificationPreferences.emailNotifications = emailItems.some((item) => !!item.enabled);
      user.NotificationPreferences.smsNotifications = smsItems.some((item) => !!item.enabled);
      user.NotificationPreferences.transactionAlerts =
        (transactionCategory?.items || []).some((item) => !!item.enabled);
      user.NotificationPreferences.promotionalEmails =
        (marketingCategory?.items || []).some((item) => !!item.enabled);

      user.NotificationPreferences.pauseAll = !!notificationState.paused;
      user.NotificationPreferences.digestFrequency =
        ["real-time", "daily", "weekly"].includes(notificationState.digestFrequency)
          ? notificationState.digestFrequency
          : "real-time";
      user.NotificationPreferences.quietHours = !!notificationState.quietHours;
      user.NotificationPreferences.quietFrom =
        typeof notificationState.quietFrom === "string" && notificationState.quietFrom
          ? notificationState.quietFrom
          : "22:00";
      user.NotificationPreferences.quietTo =
        typeof notificationState.quietTo === "string" && notificationState.quietTo
          ? notificationState.quietTo
          : "07:00";

      user.NotificationPreferences.dynamicState = notificationState;
      user.markModified("NotificationPreferences.dynamicState");
    } else {
      // Backward-compatible update path
      user.NotificationPreferences.emailNotifications = parseBoolean(emailNotifications, true);
      user.NotificationPreferences.smsNotifications = parseBoolean(smsNotifications, true);
      user.NotificationPreferences.transactionAlerts = parseBoolean(transactionAlerts, true);
      user.NotificationPreferences.promotionalEmails = parseBoolean(promotionalEmails, false);
    }

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
    const zenoPayId = req.session.user?.ZenoPayID || "ZP-DEMO2024";
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
  getNotificationPreferences,
  getChangePassword,
  updatePersonalInfo,
  changePassword,
  updateProfilePicture,
  updateNotificationPreferences,
  deactivateAccount,
}
