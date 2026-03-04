const AdminSettings = require("../../Models/AdminSettings");

const upsertSettings = async (patch = {}) => {
  return AdminSettings.findOneAndUpdate(
    {},
    { ...patch, updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const toBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "on", "yes"].includes(value.toLowerCase());
  return Boolean(value);
};

exports.settingsPage = async (req, res) => {
  try {
    const settings = (await AdminSettings.findOne().lean()) || {};
    res.locals.adminPage = "settings";
    return res.render("admin/settings/admin-settings", {
      settings,
      pageTitle: "System Settings",
      title: "System Settings",
      page: "settings",
      adminPage: "settings",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.updateGeneralSettings = async (req, res) => {
  try {
    const {
      appName,
      supportEmail,
      supportPhone,
      appLogoUrl,
      currency,
      timezone,
      dateFormat,
      language,
      appDescription,
    } = req.body;

    await upsertSettings({
      appName,
      supportEmail,
      supportPhone,
      appLogoUrl,
      currency,
      timezone,
      dateFormat,
      language,
      appDescription,
    });

    return res.json({ success: true, message: "General settings saved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updatePaymentSettings = async (req, res) => {
  try {
    const {
      minTransfer,
      maxTransfer,
      dailyLimit,
      transactionFee,
      feeType,
      autoRefundDays,
      maxFeeCap,
      topUpLimit,
    } = req.body;

    await upsertSettings({
      minTransfer,
      maxTransfer,
      dailyLimit,
      transactionFee,
      feeType,
      autoRefundDays,
      maxFeeCap,
      topUpLimit,
    });

    return res.json({ success: true, message: "Payment settings saved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateSecuritySettings = async (req, res) => {
  try {
    const {
      maxLoginAttempts,
      lockoutDuration,
      sessionTimeout,
      passwordExpiry,
      twoFactorRequired,
      ipWhitelist,
      flagLargeTransactions,
      autoFreezeOnFail,
      blockInternational,
    } = req.body;

    await upsertSettings({
      maxLoginAttempts,
      lockoutDuration,
      sessionTimeout,
      passwordExpiry,
      twoFactorRequired: toBool(twoFactorRequired),
      ipWhitelist: Array.isArray(ipWhitelist)
        ? ipWhitelist.filter(Boolean)
        : String(ipWhitelist || "")
            .split("\n")
            .map((ip) => ip.trim())
            .filter(Boolean),
      flagLargeTransactions: toBool(flagLargeTransactions),
      autoFreezeOnFail: toBool(autoFreezeOnFail),
      blockInternational: toBool(blockInternational),
    });

    return res.json({ success: true, message: "Security settings saved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateNotificationSettings = async (req, res) => {
  try {
    const {
      emailAlerts,
      smsAlerts,
      pushAlerts,
      alertOnFailed,
      alertOnFraud,
      alertOnKYC,
      alertOnRefund,
      alertOnNewUser,
      alertOnLowWallet,
      alertOnSupportTicket,
      alertOnAdminLogin,
      notificationRecipients,
    } = req.body;

    await upsertSettings({
      emailAlerts: toBool(emailAlerts),
      smsAlerts: toBool(smsAlerts),
      pushAlerts: toBool(pushAlerts),
      alertOnFailed: toBool(alertOnFailed),
      alertOnFraud: toBool(alertOnFraud),
      alertOnKYC: toBool(alertOnKYC),
      alertOnRefund: toBool(alertOnRefund),
      alertOnNewUser: toBool(alertOnNewUser),
      alertOnLowWallet: toBool(alertOnLowWallet),
      alertOnSupportTicket: toBool(alertOnSupportTicket),
      alertOnAdminLogin: toBool(alertOnAdminLogin),
      notificationRecipients: Array.isArray(notificationRecipients)
        ? notificationRecipients.filter(Boolean)
        : String(notificationRecipients || "")
            .split("\n")
            .map((email) => email.trim())
            .filter(Boolean),
    });

    return res.json({ success: true, message: "Notification settings saved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.toggleMaintenance = async (req, res) => {
  try {
    const { enabled, message, duration, scheduledStart } = req.body;
    await upsertSettings({
      maintenanceMode: toBool(enabled),
      maintenanceMessage: message || "",
      maintenanceDuration: duration || "30 minutes",
      maintenanceStart: scheduledStart ? new Date(scheduledStart) : null,
    });

    return res.json({
      success: true,
      message: `Maintenance mode ${toBool(enabled) ? "enabled" : "disabled"}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resetSettings = async (req, res) => {
  try {
    await AdminSettings.deleteMany({});
    await AdminSettings.create({});
    return res.json({ success: true, message: "Settings reset to defaults" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.forceLogoutAdmins = async (req, res) => {
  try {
    return res.json({ success: true, message: "Force logout queued" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
