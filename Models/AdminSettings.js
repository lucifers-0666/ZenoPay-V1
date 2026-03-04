const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    appName: { type: String, default: "ZenoPay" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    appLogoUrl: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    dateFormat: { type: String, default: "DD/MM/YYYY" },
    language: { type: String, default: "English" },
    appDescription: { type: String, default: "" },

    minTransfer: { type: Number, default: 1 },
    maxTransfer: { type: Number, default: 100000 },
    dailyLimit: { type: Number, default: 200000 },
    transactionFee: { type: Number, default: 0 },
    feeType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    autoRefundDays: { type: Number, default: 7 },
    maxFeeCap: { type: Number, default: 50 },
    topUpLimit: { type: Number, default: 50000 },

    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 30 },
    sessionTimeout: { type: Number, default: 60 },
    passwordExpiry: { type: Number, default: 0 },
    twoFactorRequired: { type: Boolean, default: false },
    ipWhitelist: { type: [String], default: [] },
    flagLargeTransactions: { type: Boolean, default: false },
    autoFreezeOnFail: { type: Boolean, default: false },
    blockInternational: { type: Boolean, default: false },

    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    pushAlerts: { type: Boolean, default: true },
    alertOnFailed: { type: Boolean, default: true },
    alertOnFraud: { type: Boolean, default: true },
    alertOnKYC: { type: Boolean, default: true },
    alertOnRefund: { type: Boolean, default: false },
    alertOnNewUser: { type: Boolean, default: false },
    alertOnLowWallet: { type: Boolean, default: false },
    alertOnSupportTicket: { type: Boolean, default: true },
    alertOnAdminLogin: { type: Boolean, default: true },
    notificationRecipients: { type: [String], default: [] },

    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
    maintenanceDuration: { type: String, default: "30 minutes" },
    maintenanceStart: { type: Date, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
