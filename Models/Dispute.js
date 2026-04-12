const mongoose = require("mongoose");

const DisputeTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    by: {
      type: String,
      required: true,
      trim: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const DisputeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "rejected"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    additionalInfo: {
      type: String,
      default: "",
      trim: true,
    },
    timeline: {
      type: [DisputeTimelineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

DisputeSchema.index({ userId: 1, status: 1, createdAt: -1 });
DisputeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Dispute", DisputeSchema);
