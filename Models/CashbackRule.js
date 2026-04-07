const mongoose = require("mongoose");

const CashbackRuleSchema = new mongoose.Schema(
  {
    ruleType: {
      type: String,
      enum: ["flat_percent", "category_percent"],
      default: "flat_percent",
      required: true,
    },
    percent: {
      type: Number,
      required: true,
      min: 0,
    },
    maxCashback: {
      type: Number,
      default: 0,
      min: 0,
    },
    minTransactionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CashbackRule", CashbackRuleSchema);
