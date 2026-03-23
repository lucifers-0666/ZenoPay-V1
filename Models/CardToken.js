const mongoose = require("mongoose");

const CardTokenSchema = new mongoose.Schema(
  {
    ZenoPayId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "razorpay"],
      required: true,
      lowercase: true,
      trim: true,
    },
    tokenId: {
      type: String,
      required: true,
      trim: true,
    },
    last4: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      default: "unknown",
      trim: true,
    },
    cardholderName: {
      type: String,
      default: "",
      trim: true,
    },
    expiryMonth: {
      type: String,
      default: "",
      trim: true,
    },
    expiryYear: {
      type: String,
      default: "",
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

CardTokenSchema.index({ provider: 1, tokenId: 1 }, { unique: true });
CardTokenSchema.index({ ZenoPayId: 1, isDefault: 1 });

module.exports = mongoose.model("CardToken", CardTokenSchema);
