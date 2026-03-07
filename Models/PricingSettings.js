const mongoose = require("mongoose");

const pricingSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      index: true,
    },
    applyGST: {
      type: Boolean,
      default: true,
    },
    gstRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 18,
    },
    gstRegNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    annualDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 15,
    },
    studentDiscountEnabled: {
      type: Boolean,
      default: false,
    },
    studentDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    revenueChart: {
      type: [Number],
      default: [620000, 710000, 780000, 820000, 870000, 897143],
    },
    churnRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 2.8,
    },
  },
  {
    timestamps: true,
  }
);

pricingSettingsSchema.statics.getSettings = async function getSettings() {
  let settings = await this.findOne({ key: "default" });
  if (!settings) {
    settings = await this.create({ key: "default" });
  }
  return settings;
};

const PricingSettings = mongoose.model("PricingSettings", pricingSettingsSchema);

module.exports = PricingSettings;
