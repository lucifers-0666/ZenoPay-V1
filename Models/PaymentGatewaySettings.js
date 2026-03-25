const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    fee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
  },
  { _id: false }
);

const paymentGatewaySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true, index: true },
    apiKey: { type: String, default: "" },
    secretKey: { type: String, default: "" },
    merchantId: { type: String, default: "" },
    webhookUrl: { type: String, default: "" },
    successUrl: { type: String, default: "" },
    failureUrl: { type: String, default: "" },
    environment: { type: String, enum: ["test", "live"], default: "test" },

    paymentMethods: {
      upi: { type: paymentMethodSchema, default: () => ({ enabled: true, fee: 1.5, platformFee: 0.5 }) },
      cards: { type: paymentMethodSchema, default: () => ({ enabled: true, fee: 2.5, platformFee: 0.5 }) },
      netbanking: { type: paymentMethodSchema, default: () => ({ enabled: false, fee: 2.5, platformFee: 0.5 }) },
      wallets: { type: paymentMethodSchema, default: () => ({ enabled: true, fee: 1.5, platformFee: 0.5 }) },
      emi: { type: paymentMethodSchema, default: () => ({ enabled: false, fee: 3.0, platformFee: 0.5 }) },
    },

    advancedSettings: {
      autoSettlement: { type: Boolean, default: true },
      settlementFrequency: { type: String, default: "daily" },
      paymentRetry: { type: Boolean, default: true },
      maxRetryAttempts: { type: Number, default: 3 },
      duplicateCheck: { type: Boolean, default: true },
      checkWindow: { type: Number, default: 5 },
      paymentTimeout: { type: Boolean, default: true },
      timeoutDuration: { type: Number, default: 30 },
      threeDSecure: { type: Boolean, default: true },
      internationalPayments: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

paymentGatewaySettingsSchema.statics.getSettings = async function getSettings() {
  let settings = await this.findOne({ key: "default" });
  if (!settings) {
    settings = await this.create({ key: "default" });
  }
  return settings;
};

module.exports = mongoose.model("PaymentGatewaySettings", paymentGatewaySettingsSchema);
