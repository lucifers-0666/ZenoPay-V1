const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    walletId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayDetails",
      required: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCredit: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDebit: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "frozen", "suspended"],
      default: "active",
      index: true,
    },
    lastTransaction: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Wallet", WalletSchema);
