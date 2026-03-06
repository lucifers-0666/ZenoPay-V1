const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true, trim: true },
    bankCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    ifscPrefix: { type: String, trim: true, uppercase: true },
    type: {
      type: String,
      enum: ["public", "private", "cooperative", "foreign", "payments"],
      default: "public",
    },
    logoUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "rejected"],
      default: "pending",
      index: true,
    },
    priority: { type: Number, default: 99, index: true },
    upiEnabled: { type: Boolean, default: true, index: true },
    neftEnabled: { type: Boolean, default: true },
    rtgsEnabled: { type: Boolean, default: true },
    impsEnabled: { type: Boolean, default: true },
    updatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bank", bankSchema);
