const mongoose = require("mongoose");

const paymentGatewaySettingsSchema = new mongoose.Schema(
  {
    environment: { type: String, enum: ["test", "live"], default: "test" },
    apiKey: { type: String, default: "" },
    secretKey: { type: String, default: "" },
    merchantId: { type: String, default: "" },
    webhookUrl: { type: String, default: "" },
    successUrl: { type: String, default: "" },
    failureUrl: { type: String, default: "" },
    paymentMethods: { type: Object, default: {} },
    advancedSettings: { type: Object, default: {} }
  },
  {
    timestamps: true,
  }
);

paymentGatewaySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("PaymentGatewaySettings", paymentGatewaySettingsSchema);
