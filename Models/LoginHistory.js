const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema(
  {
    ZenoPayId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "blocked"],
      default: "success",
      index: true,
    },
    device: {
      type: String,
      default: "Unknown Device",
    },
    location: {
      type: String,
      default: "Unknown Location",
    },
    ip: {
      type: String,
      default: "Unknown IP",
    },
    userAgent: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "Unknown Browser",
    },
    loginAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);
