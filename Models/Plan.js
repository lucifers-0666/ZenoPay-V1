const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "beta", "archived"],
      default: "active",
      index: true,
    },
    monthlyPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    annualPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    monthlyTxLimit: {
      type: Number,
      min: 0,
      default: 0,
    },
    dailyTransferLimit: {
      type: Number,
      min: 0,
      default: 0,
    },
    apiCallsPerDay: {
      type: Number,
      min: 0,
      default: 0,
    },
    transactionFeeText: {
      type: String,
      default: "",
      trim: true,
    },
    volumeLimitText: {
      type: String,
      default: "",
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    showOnPricingPage: {
      type: Boolean,
      default: true,
      index: true,
    },
    highlightPopular: {
      type: Boolean,
      default: false,
    },
    bestValue: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    subscribers: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.index({ sortOrder: 1, createdAt: 1 });

planSchema.statics.getPublicPlans = function getPublicPlans() {
  return this.find({ showOnPricingPage: true, status: { $ne: "archived" } })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
};

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
