const mongoose = require("mongoose");

const RefundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayDetails",
      required: false,
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransactionHistory",
      required: false,
      index: true,
    },
    transactionRef: {
      type: String,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing"],
      default: "pending",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZenoPayDetails",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Refund", RefundSchema);
