const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "ZenoPayDetails" },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ["auth", "user", "transaction", "wallet", "refund", "settings", "kyc", "system"],
      default: "system",
    },
    description: { type: String, default: "" },
    targetId: { type: String, default: "" },
    targetType: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    status: {
      type: String,
      enum: ["success", "failed", "warning"],
      default: "success",
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
