const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    ZenoPayId: {
      type: String,
      required: true,
      trim: true,
    },
    Type: {
      type: String,
      enum: [
        "credit",
        "debit",
        "info",
        "warning",
        "success",
        "reward",
        "security",
        "update",
        "general",
      ],
      default: "general",
      required: true,
    },
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Message: {
      type: String,
      required: true,
    },
    Amount: {
      type: Number,
      default: 0,
    },
    TransactionID: {
      type: String,
      default: null,
    },
    IsRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ ZenoPayId: 1, createdAt: -1 });
NotificationSchema.index({ ZenoPayId: 1, IsRead: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
